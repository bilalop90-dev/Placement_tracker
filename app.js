/* ============================================================
   Placement Tracker — Application logic
   State machine · roadmap · quiz engine · spaced repetition · dashboard
   ============================================================ */
(function () {
  'use strict';

  var AppData = window.AppData;
  var STATE_KEY = 'placement_tracker_state';
  var THEME_KEY = 'placement_tracker_theme';
  var PASS = AppData.passThreshold; // 0.9
  var COOLDOWN = AppData.cooldownMs; // 4h
  var SR = AppData.srSchedule; // [1,3,7,14,30]
  var DAY_MS = 24 * 60 * 60 * 1000;

  var root = document.documentElement;
  var mainEl = document.getElementById('main');
  var overlayEl = document.getElementById('overlay');
  var overlayInner = document.getElementById('overlayInner');

  /* ============================================================
     Utilities
     ============================================================ */
  function el(html) {
    var t = document.createElement('template');
    t.innerHTML = html.trim();
    return t.content.firstChild;
  }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function dayKey(ts) {
    var d = new Date(ts);
    return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
  }
  function startOfDay(ts) {
    var d = new Date(ts);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }
  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = a[i];
      a[i] = a[j];
      a[j] = tmp;
    }
    return a;
  }
  function pct(n) {
    return Math.round(n * 100);
  }

  /* ============================================================
     State
     ============================================================ */
  var state;

  function defaultState() {
    var s = {
      version: 1,
      topics: {}, // topicId -> { state, bestScore, attempts:[], scores:[], masteredAt, nextReviewDate, srIndex, needsRevision, cooldownUntil }
      streak: { count: 0, best: 0, lastActiveDay: null },
      activity: [] // { topicId, trackId, name, score, passed, ts, type }
    };
    eachTopic(function (topic, track, idx) {
      s.topics[topic.id] = {
        state: idx === 0 ? 'unlocked' : 'locked',
        bestScore: null,
        scores: [],
        attempts: 0,
        masteredAt: null,
        nextReviewDate: null,
        srIndex: 0,
        needsRevision: false,
        cooldownUntil: null
      };
    });
    return s;
  }

  function loadState() {
    try {
      var raw = localStorage.getItem(STATE_KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        // Make sure any newly added topics exist in stored state.
        eachTopic(function (topic, track, idx) {
          if (!parsed.topics[topic.id]) {
            parsed.topics[topic.id] = defaultState().topics[topic.id];
          }
        });
        return parsed;
      }
    } catch (e) {}
    return defaultState();
  }

  function saveState() {
    try {
      localStorage.setItem(STATE_KEY, JSON.stringify(state));
    } catch (e) {}
  }

  /* Iterate every topic across both tracks. */
  function eachTopic(fn) {
    ['java', 'aptitude'].forEach(function (tid) {
      AppData.tracks[tid].topics.forEach(function (topic, idx) {
        fn(topic, AppData.tracks[tid], idx);
      });
    });
  }

  function getTopicDef(topicId) {
    var found = null;
    eachTopic(function (topic, track) {
      if (topic.id === topicId) found = { topic: topic, track: track };
    });
    return found;
  }
  function trackTopics(trackId) {
    return AppData.tracks[trackId].topics;
  }

  /* ============================================================
     Streak logic
     ============================================================ */
  function refreshStreakOnLoad() {
    var st = state.streak;
    if (!st.lastActiveDay) {
      renderStreak();
      return;
    }
    var today = startOfDay(Date.now());
    var last = startOfDay(st.lastActiveDay);
    var diff = Math.round((today - last) / DAY_MS);
    if (diff >= 2) {
      // Missed at least a full day -> streak broken.
      st.count = 0;
      saveState();
    }
    renderStreak();
  }

  function markActiveToday() {
    var st = state.streak;
    var today = startOfDay(Date.now());
    var last = st.lastActiveDay ? startOfDay(st.lastActiveDay) : null;
    if (last === today) {
      // already counted today
    } else if (last !== null && today - last === DAY_MS) {
      st.count += 1; // consecutive day
    } else {
      st.count = 1; // first day or broken streak restarts
    }
    st.lastActiveDay = Date.now();
    if (st.count > st.best) st.best = st.count;
    saveState();
    renderStreak();
  }

  function renderStreak() {
    var c = state.streak.count;
    document.getElementById('streakCount').textContent = c;
    var tb = document.getElementById('topbarStreak');
    if (tb) tb.textContent = '🔥 ' + c;
  }

  /* ============================================================
     Topic state machine helpers
     ============================================================ */
  function avgScore(ts) {
    if (!ts.scores.length) return null;
    var sum = ts.scores.reduce(function (a, b) {
      return a + b;
    }, 0);
    return sum / ts.scores.length;
  }

  function unlockNext(trackId, masteredTopicId) {
    var topics = trackTopics(trackId);
    var idx = topics.findIndex(function (t) {
      return t.id === masteredTopicId;
    });
    if (idx >= 0 && idx + 1 < topics.length) {
      var nextId = topics[idx + 1].id;
      var ns = state.topics[nextId];
      if (ns.state === 'locked') {
        ns.state = 'unlocked';
        toast('Topic Unlocked', topics[idx + 1].name + ' is now available.', 'success', '🔓');
      }
    }
  }

  function effectiveState(topicId) {
    // Resolve a display state, accounting for expired cooldowns.
    var ts = state.topics[topicId];
    if (ts.state === 'attempted' && ts.cooldownUntil && Date.now() >= ts.cooldownUntil) {
      ts.state = 'unlocked';
      ts.cooldownUntil = null;
      saveState();
    }
    return ts.state;
  }

  function isDue(topicId) {
    var ts = state.topics[topicId];
    return (
      (ts.state === 'mastered' || ts.needsRevision) &&
      ts.nextReviewDate &&
      ts.nextReviewDate <= Date.now()
    );
  }

  /* ============================================================
     Toasts
     ============================================================ */
  var toastWrap = document.getElementById('toasts');
  function toast(title, msg, type, icon) {
    type = type || 'info';
    var node = el(
      '<div class="toast toast--' +
        type +
        '"><span class="toast__icon">' +
        (icon || '🔔') +
        '</span><div class="toast__body"><div class="toast__title">' +
        esc(title) +
        '</div>' +
        (msg ? '<div class="toast__msg">' + esc(msg) + '</div>' : '') +
        '</div></div>'
    );
    toastWrap.appendChild(node);
    setTimeout(function () {
      node.classList.add('is-leaving');
      setTimeout(function () {
        if (node.parentNode) node.parentNode.removeChild(node);
      }, 300);
    }, 3600);
  }

  /* ============================================================
     Navigation / routing
     ============================================================ */
  var currentView = 'dashboard';

  function navTo(view) {
    currentView = view;
    document.querySelectorAll('.nav__link').forEach(function (n) {
      n.classList.toggle('is-active', n.getAttribute('data-view') === view);
    });
    render();
    toggleSidebar(false);
  }

  function render() {
    if (currentView === 'dashboard') renderDashboard();
    else if (currentView === 'java') renderTrack('java');
    else if (currentView === 'aptitude') renderTrack('aptitude');
  }

  /* ============================================================
     Roadmap / Track view
     ============================================================ */
  var selectedTopicId = null;

  var STATE_BADGE = {
    locked: ['Locked', 'badge--locked'],
    unlocked: ['Unlocked', 'badge--unlocked'],
    attempted: ['Attempted', 'badge--attempted'],
    mastered: ['Mastered', 'badge--mastered']
  };

  function renderTrack(trackId) {
    var track = AppData.tracks[trackId];
    var topics = track.topics;
    // Default selection: first interactive topic.
    if (!selectedTopicId || !getTopicDef(selectedTopicId) || getTopicDef(selectedTopicId).track.id !== trackId) {
      selectedTopicId = null;
    }

    var mastered = topics.filter(function (t) {
      return state.topics[t.id].state === 'mastered';
    }).length;

    var nodes = topics
      .map(function (topic, idx) {
        var st = effectiveState(topic.id);
        var ts = state.topics[topic.id];
        var revision = ts.needsRevision && st === 'mastered';
        var modClass = 'node--' + (revision ? 'revision' : st);
        // line above this node is "filled" if the previous topic is mastered
        var prevMastered =
          idx > 0 && state.topics[topics[idx - 1].id].state === 'mastered';
        var thisMastered = st === 'mastered';
        var badge = STATE_BADGE[st] || STATE_BADGE.locked;
        var badgeHtml = revision
          ? '<span class="badge badge--revision">Needs Revision</span>'
          : '<span class="badge ' + badge[1] + '">' + badge[0] + '</span>';
        var scoreHtml =
          ts.bestScore != null
            ? '<div class="node__score">Best: ' + pct(ts.bestScore) + '%</div>'
            : '';
        var locked = st === 'locked';
        var active = topic.id === selectedTopicId ? ' is-active' : '';

        return (
          '<div class="node ' +
          modClass +
          '">' +
          '<div class="node__rail">' +
          '<div class="node__line ' +
          (prevMastered ? 'node__line--filled' : '') +
          '"></div>' +
          '<div class="node__dot"></div>' +
          '<div class="node__line-after ' +
          (thisMastered ? 'node__line--filled' : '') +
          '"></div>' +
          '</div>' +
          '<button class="node__pill ' +
          (locked ? 'is-locked' : '') +
          active +
          '" data-topic="' +
          topic.id +
          '" ' +
          (locked ? 'disabled' : '') +
          '>' +
          '<span class="node__left">' +
          '<span class="node__num">' +
          (idx + 1) +
          '</span>' +
          '<span class="node__info">' +
          '<span class="node__name">' +
          esc(topic.name) +
          '</span>' +
          scoreHtml +
          '</span>' +
          '</span>' +
          badgeHtml +
          '</button>' +
          '</div>'
        );
      })
      .join('');

    mainEl.innerHTML =
      '<div class="fade-in">' +
      '<div class="view-head"><h1>' +
      esc(track.name) +
      '</h1><p>' +
      mastered +
      ' / ' +
      topics.length +
      ' topics mastered — unlock the next by scoring ' +
      pct(PASS) +
      '%+.</p></div>' +
      '<div class="track-layout">' +
      '<div class="roadmap">' +
      nodes +
      '</div>' +
      '<div class="topic-panel" id="topicPanel"></div>' +
      '</div>' +
      '</div>';

    // Wire node clicks
    mainEl.querySelectorAll('.node__pill').forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (btn.classList.contains('is-locked')) return;
        selectedTopicId = btn.getAttribute('data-topic');
        renderTrack(trackId);
      });
    });

    renderTopicPanel(trackId);
  }

  function renderTopicPanel(trackId) {
    var panel = document.getElementById('topicPanel');
    if (!panel) return;

    if (!selectedTopicId) {
      panel.innerHTML =
        '<div class="card topic-panel__placeholder">' +
        '<svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>' +
        '<p>Select a topic from the roadmap to begin.</p>' +
        '</div>';
      return;
    }

    var def = getTopicDef(selectedTopicId);
    var topic = def.topic;
    var ts = state.topics[topic.id];
    var st = effectiveState(topic.id);

    var actions = '';
    if (st === 'unlocked') {
      actions += '<button class="btn btn--primary btn--block" data-action="start" data-topic="' + topic.id + '">Start Quiz</button>';
    } else if (st === 'attempted') {
      actions +=
        '<div class="cooldown"><div class="cooldown__label">Retry available in</div>' +
        '<div class="cooldown__time" data-cooldown="' + (ts.cooldownUntil || 0) + '" data-topic="' + topic.id + '">--:--:--</div></div>';
    } else if (st === 'mastered') {
      var dueNow = isDue(topic.id);
      if (dueNow) {
        actions += '<button class="btn btn--success btn--block" data-action="review" data-topic="' + topic.id + '">Start Review (Due)</button>';
      }
      actions += '<button class="btn btn--outline btn--block" data-action="retake" data-topic="' + topic.id + '">Retake Full Quiz</button>';
      actions += '<button class="btn btn--ghost btn--block" data-action="copyprompt" data-topic="' + topic.id + '">Copy AI Review Prompt</button>';
    }

    var stat = '';
    stat += statRow('State', st === 'mastered' && ts.needsRevision ? 'Needs Revision' : (STATE_BADGE[st] ? STATE_BADGE[st][0] : st));
    stat += statRow('Best score', ts.bestScore != null ? pct(ts.bestScore) + '%' : '—');
    stat += statRow('Attempts', ts.attempts);
    if (ts.state === 'mastered' && ts.nextReviewDate) {
      stat += statRow('Next review', formatReview(ts.nextReviewDate));
    }

    panel.innerHTML =
      '<div class="card fade-in">' +
      '<div class="topic-panel__code mono">' + topic.code + '</div>' +
      '<div class="topic-panel__name">' + esc(topic.name) + '</div>' +
      '<div class="topic-panel__desc">' + esc(topic.description) + '</div>' +
      stat +
      '<div class="topic-panel__divider"></div>' +
      '<div class="topic-panel__actions">' + actions + '</div>' +
      '</div>';

    wireTopicActions(panel, trackId);
    startCooldownTimers(panel);
  }

  function statRow(label, val) {
    return '<div class="topic-stat"><span>' + esc(label) + '</span><span>' + esc(val) + '</span></div>';
  }

  function formatReview(ts) {
    var d = startOfDay(ts);
    var today = startOfDay(Date.now());
    var diff = Math.round((d - today) / DAY_MS);
    if (diff <= 0) return 'Due today';
    if (diff === 1) return 'Tomorrow';
    return 'In ' + diff + ' days';
  }

  function wireTopicActions(scope, trackId) {
    scope.querySelectorAll('[data-action]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var action = btn.getAttribute('data-action');
        var topicId = btn.getAttribute('data-topic');
        if (action === 'start' || action === 'retake') startQuiz(topicId, 'quiz', trackId);
        else if (action === 'review') startQuiz(topicId, 'review', trackId);
        else if (action === 'copyprompt') copyPrompt(topicId);
      });
    });
  }

  function copyPrompt(topicId) {
    var def = getTopicDef(topicId);
    var text = def.topic.reviewPrompt;
    copyText(text, 'AI review prompt copied', def.topic.name);
  }

  function copyText(text, title, msg) {
    function done() {
      toast(title, msg, 'success', '📋');
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, function () {
        legacyCopy(text);
        done();
      });
    } else {
      legacyCopy(text);
      done();
    }
  }
  function legacyCopy(text) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand('copy');
    } catch (e) {}
    document.body.removeChild(ta);
  }

  /* ---- Live cooldown countdown timers ---- */
  var cooldownInterval = null;
  function startCooldownTimers(scope) {
    var nodes = scope.querySelectorAll('[data-cooldown]');
    if (cooldownInterval) {
      clearInterval(cooldownInterval);
      cooldownInterval = null;
    }
    if (!nodes.length) return;

    function tick() {
      var anyLive = false;
      nodes.forEach(function (n) {
        var until = parseInt(n.getAttribute('data-cooldown'), 10);
        var remain = until - Date.now();
        if (remain <= 0) {
          n.textContent = '00:00:00';
          var topicId = n.getAttribute('data-topic');
          var ts = state.topics[topicId];
          if (ts && ts.state === 'attempted') {
            ts.state = 'unlocked';
            ts.cooldownUntil = null;
            saveState();
          }
          // Re-render so the Start button reappears.
          if (currentView === 'java' || currentView === 'aptitude') render();
        } else {
          anyLive = true;
          n.textContent = fmtDuration(remain);
        }
      });
      if (!anyLive && cooldownInterval) {
        clearInterval(cooldownInterval);
        cooldownInterval = null;
      }
    }
    tick();
    cooldownInterval = setInterval(tick, 1000);
  }

  function fmtDuration(ms) {
    var totalSec = Math.max(0, Math.floor(ms / 1000));
    var h = Math.floor(totalSec / 3600);
    var m = Math.floor((totalSec % 3600) / 60);
    var s = totalSec % 60;
    function p(n) {
      return n < 10 ? '0' + n : '' + n;
    }
    return p(h) + ':' + p(m) + ':' + p(s);
  }

  /* ============================================================
     Quiz engine
     ============================================================ */
  // In-memory session only — never persisted mid-attempt.
  var session = null;

  function startQuiz(topicId, mode, trackId) {
    var def = getTopicDef(topicId);
    var topic = def.topic;
    var pool = shuffle(topic.questions);
    var count = mode === 'review' ? Math.min(AppData.reviewQuestionCount, pool.length) : pool.length;
    session = {
      topicId: topicId,
      trackId: trackId || def.track.id,
      mode: mode, // 'quiz' | 'review'
      questions: pool.slice(0, count),
      answers: [], // selected index per question (null until chosen)
      index: 0,
      passThreshold: PASS
    };
    for (var i = 0; i < session.questions.length; i++) session.answers.push(null);
    renderQuiz();
    openOverlay('');
    overlayInner.innerHTML = '';
    overlayInner.appendChild(quizNode);
  }

  var quizNode;
  function renderQuiz() {
    var q = session.questions[session.index];
    var total = session.questions.length;
    var num = session.index + 1;
    var selected = session.answers[session.index];
    var def = getTopicDef(session.topicId);
    var isLast = session.index === total - 1;

    var opts = q.options
      .map(function (opt, i) {
        var key = ['A', 'B', 'C', 'D'][i];
        return (
          '<button class="quiz-option ' +
          (selected === i ? 'is-selected' : '') +
          '" data-opt="' +
          i +
          '"><span class="quiz-option__key">' +
          key +
          '</span><span>' +
          esc(opt) +
          '</span></button>'
        );
      })
      .join('');

    var html =
      '<div class="quiz-head">' +
      '<span class="quiz-head__topic">' +
      esc(def.topic.name) +
      (session.mode === 'review' ? ' · Review' : '') +
      '</span>' +
      '<button class="quiz-head__close" id="quizClose" aria-label="Close quiz">' +
      '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>' +
      '</button></div>' +
      '<div class="quiz-progress">' +
      '<div class="quiz-progress__label"><span>Question ' +
      num +
      ' of ' +
      total +
      '</span><span>' +
      Math.round((num / total) * 100) +
      '%</span></div>' +
      '<div class="progress"><div class="progress__fill" style="width:' +
      (num / total) * 100 +
      '%"></div></div></div>' +
      '<div class="quiz-question">' +
      formatQuestion(q.question) +
      '</div>' +
      '<div class="quiz-options">' +
      opts +
      '</div>' +
      '<div class="quiz-foot">' +
      (selected != null
        ? '<button class="btn btn--primary" id="quizNext">' +
          (isLast ? 'Submit Quiz' : 'Next →') +
          '</button>'
        : '<button class="btn btn--primary" disabled>' + (isLast ? 'Submit Quiz' : 'Next →') + '</button>') +
      '</div>';

    quizNode = el('<div>' + html + '</div>');

    quizNode.querySelectorAll('.quiz-option').forEach(function (btn) {
      btn.addEventListener('click', function () {
        session.answers[session.index] = parseInt(btn.getAttribute('data-opt'), 10);
        renderQuizInPlace();
      });
    });
    var nextBtn = quizNode.querySelector('#quizNext');
    if (nextBtn) {
      nextBtn.addEventListener('click', function () {
        if (isLast) submitQuiz();
        else {
          session.index++;
          renderQuizInPlace();
        }
      });
    }
    quizNode.querySelector('#quizClose').addEventListener('click', function () {
      confirmQuit();
    });
  }

  function renderQuizInPlace() {
    renderQuiz();
    overlayInner.innerHTML = '';
    overlayInner.appendChild(quizNode);
  }

  // Code-style questions contain newlines / snippets — render as <pre> when multiline.
  function formatQuestion(text) {
    if (text.indexOf('\n') !== -1) {
      var parts = text.split('\n\n');
      var head = esc(parts[0]);
      var code = parts.slice(1).join('\n\n');
      if (code) {
        return (
          '<div>' +
          head +
          '</div><pre style="font-family:var(--font-mono);font-size:14px;background:var(--surface-2);padding:14px 16px;border-radius:10px;margin-top:12px;overflow-x:auto;white-space:pre-wrap;">' +
          esc(code) +
          '</pre>'
        );
      }
    }
    return esc(text);
  }

  function confirmQuit() {
    // No native confirm(): build the choice into the overlay.
    var box = el(
      '<div style="position:fixed;inset:0;display:grid;place-items:center;background:rgba(0,0,0,0.5);z-index:10;">' +
        '<div class="card" style="max-width:360px;text-align:center;">' +
        '<h3 style="margin-bottom:8px;">Quit this quiz?</h3>' +
        '<p style="color:var(--text-2);font-size:14px;margin-bottom:18px;">Your progress in this attempt will be lost.</p>' +
        '<div style="display:flex;gap:10px;justify-content:center;">' +
        '<button class="btn btn--ghost" id="quitCancel">Keep going</button>' +
        '<button class="btn btn--primary" id="quitYes" style="background:var(--danger);">Quit</button>' +
        '</div></div></div>'
    );
    overlayInner.appendChild(box);
    box.querySelector('#quitCancel').addEventListener('click', function () {
      box.remove();
    });
    box.querySelector('#quitYes').addEventListener('click', function () {
      session = null;
      closeOverlay();
      render();
    });
  }

  function submitQuiz() {
    var correct = 0;
    session.questions.forEach(function (q, i) {
      if (session.answers[i] === q.correctIndex) correct++;
    });
    var total = session.questions.length;
    var score = correct / total;
    var passed = score >= PASS;

    var ts = state.topics[session.topicId];
    var def = getTopicDef(session.topicId);

    ts.attempts = (ts.attempts || 0) + 1;
    ts.scores.push(score);
    if (ts.bestScore == null || score > ts.bestScore) ts.bestScore = score;

    if (session.mode === 'review') {
      handleReviewResult(passed, def);
    } else {
      handleQuizResult(passed, score, def);
    }

    // Studying today counts toward the streak.
    markActiveToday();

    // Activity log (latest first).
    state.activity.unshift({
      topicId: session.topicId,
      trackId: session.trackId,
      name: def.topic.name,
      score: score,
      passed: passed,
      ts: Date.now(),
      type: session.mode
    });
    if (state.activity.length > 30) state.activity = state.activity.slice(0, 30);

    saveState();
    showResults(score, passed, def);
  }

  function handleQuizResult(passed, score, def) {
    var ts = state.topics[session.topicId];
    if (passed) {
      var firstTime = ts.state !== 'mastered';
      ts.state = 'mastered';
      ts.needsRevision = false;
      ts.cooldownUntil = null;
      if (firstTime || !ts.masteredAt) {
        ts.masteredAt = Date.now();
        ts.srIndex = 0;
        ts.nextReviewDate = startOfDay(Date.now()) + SR[0] * DAY_MS;
        unlockNext(session.trackId, session.topicId);
      }
      toast('Topic Mastered! 🎉', def.topic.name + ' — ' + pct(score) + '%', 'success', '🏆');
    } else {
      if (ts.state !== 'mastered') {
        ts.state = 'attempted';
        ts.cooldownUntil = Date.now() + COOLDOWN;
      }
      // If already mastered and a retake fails, mastery is preserved.
    }
  }

  /* Review result handling lives with the SR scheduler (later milestone). */
  function handleReviewResult(passed, def) {
    // Placeholder until the spaced-repetition milestone wires this fully.
    var ts = state.topics[session.topicId];
    if (passed) {
      toast('Review passed', def.topic.name, 'success', '✅');
    } else {
      toast('Review missed', def.topic.name, 'warning', '⚠️');
    }
    ts.nextReviewDate = null;
  }

  /* ============================================================
     Results (basic) — verify + AI prompt added next milestone
     ============================================================ */
  function showResults(score, passed, def) {
    var ts = state.topics[session.topicId];
    var msg;
    if (session.mode === 'review') {
      msg = passed ? 'Review complete — great recall!' : 'Some gaps surfaced — keep revising.';
    } else if (passed) {
      msg = 'Topic Mastered! 🎉';
    } else {
      msg = 'You need ' + pct(PASS) + '% to master this topic.';
    }

    var cooldownHtml = '';
    if (!passed && session.mode === 'quiz' && ts.cooldownUntil) {
      cooldownHtml =
        '<div class="result__msg">Try again in <span class="result__cooldown" data-cooldown="' +
        ts.cooldownUntil +
        '" data-topic="' +
        session.topicId +
        '">--:--:--</span></div>';
    }

    var html =
      '<div class="quiz-head"><span class="quiz-head__topic">' +
      esc(def.topic.name) +
      ' · Results</span></div>' +
      '<div class="result">' +
      '<div class="result__score result__score--' +
      (passed ? 'pass' : 'fail') +
      ' mono">' +
      pct(score) +
      '%</div>' +
      '<div class="result__state" style="color:var(--' +
      (passed ? 'secondary' : 'danger') +
      ')">' +
      (passed ? 'PASSED' : 'NOT YET') +
      '</div>' +
      '<div class="result__msg">' +
      esc(msg) +
      '</div>' +
      cooldownHtml +
      '<div class="result__actions">' +
      '<button class="btn btn--primary" id="resBack">Back to Roadmap</button>' +
      '</div></div>';

    overlayInner.innerHTML = html;
    var back = overlayInner.querySelector('#resBack');
    back.addEventListener('click', function () {
      session = null;
      closeOverlay();
      render();
    });
    startCooldownTimers(overlayInner);
  }

  /* ============================================================
     Dashboard — fleshed out in a later milestone
     ============================================================ */
  function renderDashboard() {
    var name = 'Bilal';
    mainEl.innerHTML =
      '<div class="fade-in"><div class="view-head"><h1>' +
      greeting() +
      ', ' +
      name +
      ' 👋</h1><p>Your placement prep at a glance.</p></div>' +
      '<div class="empty"><span class="empty__icon">📊</span>Dashboard widgets are coming together.</div></div>';
  }

  function greeting() {
    var h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  }

  /* ============================================================
     Overlay control
     ============================================================ */
  function openOverlay(html) {
    overlayInner.innerHTML = html;
    overlayEl.classList.add('is-open');
    overlayEl.setAttribute('aria-hidden', 'false');
    overlayEl.scrollTop = 0;
  }
  function closeOverlay() {
    overlayEl.classList.remove('is-open');
    overlayEl.setAttribute('aria-hidden', 'true');
    overlayInner.innerHTML = '';
  }

  /* ============================================================
     Theme + sidebar wiring
     ============================================================ */
  function setTheme(theme) {
    root.setAttribute('data-theme', theme);
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch (e) {}
  }
  document.getElementById('themeToggle').addEventListener('click', function () {
    setTheme(root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
  });

  var sidebar = document.getElementById('sidebar');
  var backdrop = document.getElementById('sidebarBackdrop');
  function toggleSidebar(open) {
    sidebar.classList.toggle('is-open', open);
    backdrop.classList.toggle('is-open', open);
  }
  document.getElementById('menuToggle').addEventListener('click', function () {
    toggleSidebar(!sidebar.classList.contains('is-open'));
  });
  backdrop.addEventListener('click', function () {
    toggleSidebar(false);
  });

  document.getElementById('nav').addEventListener('click', function (e) {
    var link = e.target.closest('.nav__link');
    if (!link) return;
    navTo(link.getAttribute('data-view'));
  });

  /* ============================================================
     Boot
     ============================================================ */
  // Expose a few internals for later milestones / debugging.
  window.PT = {
    get state() {
      return state;
    },
    reset: function () {
      localStorage.removeItem(STATE_KEY);
      state = defaultState();
      saveState();
      render();
    }
  };

  state = loadState();
  saveState();
  refreshStreakOnLoad();
  render();
})();
