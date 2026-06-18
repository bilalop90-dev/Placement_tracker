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
      activity: [], // { topicId, trackId, name, score, passed, ts, type }
      plan: null // { months, startDate, baseline: { topicId: {start,end,days} } }
    };
    eachTopic(function (topic, track, idx) {
      s.topics[topic.id] = {
        state: idx === 0 ? 'unlocked' : 'locked',
        bestScore: null,
        scores: [],
        attempts: 0,
        masteredAt: null,
        nextReviewDate: null,
        srIndex: 0, // index into SR ladder == reviewIntervalIndex
        needsRevision: false,
        reviewHistory: [], // { date, score, passed }
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
        var def = defaultState();
        // Additive migration — never overwrites existing progress.
        if (!parsed.topics) parsed.topics = {};
        if (!parsed.streak) parsed.streak = def.streak;
        if (!parsed.activity) parsed.activity = [];
        if (parsed.plan === undefined) parsed.plan = null;
        // Add any newly introduced topics (e.g. v1.1 expansion) as locked,
        // and backfill any missing fields on existing topic entries.
        eachTopic(function (topic) {
          var stored = parsed.topics[topic.id];
          if (!stored) {
            parsed.topics[topic.id] = def.topics[topic.id];
          } else {
            var d = def.topics[topic.id];
            for (var key in d) {
              if (Object.prototype.hasOwnProperty.call(d, key) && stored[key] === undefined) {
                stored[key] = d[key];
              }
            }
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
    else if (currentView === 'timeline') renderTimeline();
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
          nodeSchedHtml(topic.id) +
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
      topicScheduleBlock(topic.id) +
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

  // Randomise option order per question so the correct answer isn't positional.
  function shuffleOptions(q) {
    var order = shuffle([0, 1, 2, 3].slice(0, q.options.length));
    var newOptions = order.map(function (i) {
      return q.options[i];
    });
    var newCorrect = order.indexOf(q.correctIndex);
    return {
      id: q.id,
      question: q.question,
      options: newOptions,
      correctIndex: newCorrect,
      explanation: q.explanation
    };
  }

  function startQuiz(topicId, mode, trackId) {
    var def = getTopicDef(topicId);
    var topic = def.topic;
    var pool = shuffle(topic.questions);
    var count = mode === 'review' ? Math.min(AppData.reviewQuestionCount, pool.length) : pool.length;
    session = {
      topicId: topicId,
      trackId: trackId || def.track.id,
      mode: mode, // 'quiz' | 'review'
      questions: pool.slice(0, count).map(shuffleOptions),
      answers: [], // selected index per question (null until chosen)
      index: 0,
      passThreshold: PASS
    };
    for (var i = 0; i < session.questions.length; i++) session.answers.push(null);
    session.phase = 'quiz';
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
      (session.mode === 'review' ? 'Review Session · ' : '') +
      esc(def.topic.name) +
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
      '<span style="margin-right:auto;font-size:12px;color:var(--text-2);font-family:var(--font-mono);align-self:center;">Keys A–D / 1–4 · Enter</span>' +
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
      handleReviewResult(passed, score, def);
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

  /* ============================================================
     Spaced-repetition scheduler
     Intervals SR = [1, 3, 7, 14, 30] days after mastering.
     ============================================================ */
  function scheduleNextReview(ts) {
    if (ts.srIndex < SR.length) {
      ts.nextReviewDate = startOfDay(Date.now()) + SR[ts.srIndex] * DAY_MS;
    } else {
      // Completed the whole ladder — topic graduates from the queue.
      ts.nextReviewDate = null;
    }
  }

  function handleReviewResult(passed, score, def) {
    var ts = state.topics[session.topicId];
    // Mastered status is never lost on review, and no subsequent topic is re-locked.
    if (passed) {
      ts.needsRevision = false;
      ts.srIndex = Math.min(ts.srIndex + 1, SR.length); // advance the ladder
      scheduleNextReview(ts);
      var when = ts.nextReviewDate ? formatReview(ts.nextReviewDate).toLowerCase() : 'no more reviews needed';
      toast('Review passed ✅', def.topic.name + ' — next review ' + when, 'success', '🧠');
    } else {
      ts.needsRevision = true; // flag, but keep mastered
      ts.nextReviewDate = startOfDay(Date.now()) + DAY_MS; // retry tomorrow
      toast('Flagged for revision', def.topic.name + ' — review again tomorrow.', 'warning', '⚠️');
    }
    if (!ts.reviewHistory) ts.reviewHistory = [];
    ts.reviewHistory.push({ date: Date.now(), score: score, passed: passed });
  }

  /* Topics whose review is due today or overdue. */
  function dueTopics() {
    var due = [];
    eachTopic(function (topic, track) {
      if (isDue(topic.id)) {
        due.push({ topic: topic, track: track, ts: state.topics[topic.id] });
      }
    });
    // Most overdue first.
    due.sort(function (a, b) {
      return a.ts.nextReviewDate - b.ts.nextReviewDate;
    });
    return due;
  }

  /* ============================================================
     Results view — score, verify attempt, AI prompt copy
     ============================================================ */
  function showResults(score, passed, def) {
    session.phase = 'results';
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

    var correctCount = session.questions.reduce(function (acc, q, i) {
      return acc + (session.answers[i] === q.correctIndex ? 1 : 0);
    }, 0);

    var html =
      '<div class="quiz-head"><span class="quiz-head__topic">' +
      esc(def.topic.name) +
      (session.mode === 'review' ? ' · Review Complete' : ' · Results') +
      '</span></div>' +
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
      '<div class="result__msg mono">' +
      correctCount +
      ' / ' +
      session.questions.length +
      ' correct</div>' +
      cooldownHtml +
      '<div class="result__actions">' +
      '<button class="btn btn--outline" id="resVerify">Verify Attempt</button>' +
      '<button class="btn btn--ghost" id="resCopy">Copy AI Review Prompt</button>' +
      '<button class="btn btn--primary" id="resBack">Back to Roadmap</button>' +
      '</div>' +
      '<div class="verify" id="verifyArea" hidden></div>' +
      '</div>';

    overlayInner.innerHTML = html;

    overlayInner.querySelector('#resBack').addEventListener('click', function () {
      session = null;
      closeOverlay();
      render();
    });
    overlayInner.querySelector('#resCopy').addEventListener('click', function () {
      copyPrompt(session.topicId);
    });
    var verifyBtn = overlayInner.querySelector('#resVerify');
    var verifyArea = overlayInner.querySelector('#verifyArea');
    verifyBtn.addEventListener('click', function () {
      if (verifyArea.hasAttribute('hidden')) {
        verifyArea.innerHTML = buildVerify();
        verifyArea.removeAttribute('hidden');
        verifyBtn.textContent = 'Hide Verification';
        verifyArea.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        verifyArea.setAttribute('hidden', '');
        verifyBtn.textContent = 'Verify Attempt';
      }
    });

    startCooldownTimers(overlayInner);
  }

  function buildVerify() {
    return session.questions
      .map(function (q, i) {
        var chosen = session.answers[i];
        var opts = q.options
          .map(function (opt, oi) {
            var key = ['A', 'B', 'C', 'D'][oi];
            var cls = '';
            var mark = '';
            if (oi === q.correctIndex) {
              cls = 'verify__opt--correct';
              mark = '✓ Correct';
            }
            if (oi === chosen && chosen !== q.correctIndex) {
              cls = 'verify__opt--wrong';
              mark = '✗ Your answer';
            } else if (oi === chosen && chosen === q.correctIndex) {
              mark = '✓ Your answer';
            }
            return (
              '<div class="verify__opt ' +
              cls +
              '"><span class="verify__opt-key">' +
              key +
              '</span><span>' +
              esc(opt) +
              '</span>' +
              (mark ? '<span class="verify__opt-mark">' + mark + '</span>' : '') +
              '</div>'
            );
          })
          .join('');

        var wrong = chosen !== q.correctIndex;
        var unanswered = chosen == null;
        var expClass = wrong || unanswered ? '' : '';

        return (
          '<div class="verify__q">' +
          '<div class="verify__q-text"><span class="verify__q-num mono">Q' +
          (i + 1) +
          '.</span>' +
          formatQuestion(q.question) +
          '</div>' +
          opts +
          '<div class="verify__exp"' +
          expClass +
          '><b>Why:</b> ' +
          esc(q.explanation) +
          '</div>' +
          '</div>'
        );
      })
      .join('');
  }

  /* ============================================================
     Dashboard
     ============================================================ */
  /* ============================================================
     Study Plan & Timeline
     A target duration (1–7 months) distributes every topic across
     the period with start/end/max-days, then ADAPTS: remaining
     topics are re-projected from today over the days left, so time
     saved by finishing early is redistributed automatically.
     ============================================================ */
  var PLAN_MONTHS = [1, 2, 3, 4, 5, 6, 7];
  var MONTH_ABBR = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  function fmtDate(ts) {
    var d = new Date(ts);
    return d.getDate() + ' ' + MONTH_ABBR[d.getMonth()];
  }

  // Exact number of calendar days in the chosen period from a start date.
  function planTotalDays(startTs, months) {
    var d = new Date(startTs);
    var end = new Date(d.getFullYear(), d.getMonth() + months, d.getDate());
    return Math.round((startOfDay(end.getTime()) - startOfDay(startTs)) / DAY_MS);
  }

  // Spread `total` days across `n` topics as evenly as possible
  // (earlier topics absorb the remainder), guaranteeing >= 1 day each.
  function distributeDays(total, n) {
    var base = Math.floor(total / n);
    var rem = total % n;
    var arr = [];
    for (var i = 0; i < n; i++) arr.push(base + (i < rem ? 1 : 0));
    return arr;
  }

  function createPlan(months) {
    var start = startOfDay(Date.now());
    var plan = { months: months, startDate: start, baseline: {} };
    ['java', 'aptitude'].forEach(function (tid) {
      var topics = trackTopics(tid);
      var total = planTotalDays(start, months);
      var days = distributeDays(total, topics.length);
      var cursor = start;
      topics.forEach(function (t, i) {
        plan.baseline[t.id] = { start: cursor, end: cursor + (days[i] - 1) * DAY_MS, days: days[i] };
        cursor = cursor + days[i] * DAY_MS;
      });
    });
    state.plan = plan;
    saveState();
    toast(
      'Study plan created 📅',
      months + '-month timeline generated across both tracks.',
      'success',
      '📅'
    );
    render();
  }

  function clearPlan() {
    state.plan = null;
    saveState();
    render();
  }

  // Inclusive timestamp of the final day of the plan.
  function planEndTs() {
    if (!state.plan) return null;
    var start = startOfDay(state.plan.startDate);
    return start + (planTotalDays(state.plan.startDate, state.plan.months) - 1) * DAY_MS;
  }

  // Live, adaptive projection for the NOT-yet-mastered topics of a track,
  // distributed from today across the days remaining until the plan ends.
  function adaptiveSchedule(trackId) {
    var map = {};
    if (!state.plan) return map;
    var remaining = trackTopics(trackId).filter(function (t) {
      return state.topics[t.id].state !== 'mastered';
    });
    if (!remaining.length) return map;
    var from = Math.max(startOfDay(Date.now()), startOfDay(state.plan.startDate));
    var pEnd = planEndTs();
    var daysLeft = Math.max(remaining.length, Math.round((pEnd - from) / DAY_MS) + 1);
    var dist = distributeDays(daysLeft, remaining.length);
    var cursor = from;
    remaining.forEach(function (t, i) {
      map[t.id] = { start: cursor, end: cursor + (dist[i] - 1) * DAY_MS, days: dist[i] };
      cursor = cursor + dist[i] * DAY_MS;
    });
    return map;
  }

  // 'done-ahead' | 'done-late' | 'behind' | 'due-soon' | 'on-track'
  function topicScheduleStatus(topicId) {
    var ts = state.topics[topicId];
    var base = state.plan.baseline[topicId];
    if (!base) return 'on-track';
    if (ts.state === 'mastered') {
      if (ts.masteredAt && startOfDay(ts.masteredAt) <= base.end) return 'done-ahead';
      return 'done-late';
    }
    var today = startOfDay(Date.now());
    if (today > base.end) return 'behind';
    if (base.end - today <= DAY_MS) return 'due-soon';
    return 'on-track';
  }

  var SCHED_LABEL = {
    'done-ahead': ['Completed on time', 'mastered'],
    'done-late': ['Completed late', 'attempted'],
    behind: ['Behind schedule', 'revision'],
    'due-soon': ['Due soon', 'attempted'],
    'on-track': ['On track', 'unlocked']
  };

  function planProgress() {
    var pStart = startOfDay(state.plan.startDate);
    var pEnd = planEndTs();
    var total = Math.round((pEnd - pStart) / DAY_MS) + 1;
    var today = startOfDay(Date.now());
    var dayNum = Math.min(total, Math.max(1, Math.round((today - pStart) / DAY_MS) + 1));
    var done = 0,
      behind = 0,
      totalTopics = 0;
    eachTopic(function (t) {
      totalTopics++;
      if (state.topics[t.id].state === 'mastered') done++;
      else if (topicScheduleStatus(t.id) === 'behind') behind++;
    });
    return {
      total: total,
      dayNum: dayNum,
      done: done,
      behind: behind,
      totalTopics: totalTopics,
      pStart: pStart,
      pEnd: pEnd,
      overdue: today > pEnd
    };
  }

  /* ---------- Roadmap node schedule chip ---------- */
  function nodeSchedHtml(topicId) {
    if (!state.plan) return '';
    var base = state.plan.baseline[topicId];
    if (!base) return '';
    if (state.topics[topicId].state === 'mastered') {
      var late = topicScheduleStatus(topicId) === 'done-late';
      return '<div class="node__sched node__sched--done">✓ Completed' + (late ? ' (late)' : '') + '</div>';
    }
    var status = topicScheduleStatus(topicId);
    var cls = status === 'behind' ? ' node__sched--behind' : status === 'due-soon' ? ' node__sched--due' : '';
    return (
      '<div class="node__sched' +
      cls +
      '">📅 ' +
      fmtDate(base.start) +
      ' – ' +
      fmtDate(base.end) +
      ' · ' +
      base.days +
      'd' +
      (status === 'behind' ? ' · overdue' : '') +
      '</div>'
    );
  }

  /* ---------- Topic panel schedule block ---------- */
  function topicScheduleBlock(topicId) {
    if (!state.plan) return '';
    var ts = state.topics[topicId];
    var base = state.plan.baseline[topicId];
    if (!base) return '';
    var status = topicScheduleStatus(topicId);
    var lbl = SCHED_LABEL[status];

    var rows = '';
    rows += statRow('Planned window', fmtDate(base.start) + ' – ' + fmtDate(base.end));
    rows += statRow('Max days', base.days + (base.days === 1 ? ' day' : ' days'));
    rows += statRow('Deadline', fmtDate(base.end));

    if (ts.state !== 'mastered') {
      var adapt = adaptiveSchedule(getTopicDef(topicId).track.id)[topicId];
      if (adapt) {
        rows += statRow('Projected now', fmtDate(adapt.start) + ' – ' + fmtDate(adapt.end));
        if (adapt.days > base.days) rows += statRow('Time freed up', '+' + (adapt.days - base.days) + (adapt.days - base.days === 1 ? ' day' : ' days'));
        else if (adapt.days < base.days) rows += statRow('Compressed by', base.days - adapt.days + (base.days - adapt.days === 1 ? ' day' : ' days'));
      }
    } else if (ts.masteredAt) {
      var saved = Math.round((base.end - startOfDay(ts.masteredAt)) / DAY_MS);
      if (saved > 0) rows += statRow('Finished early', saved + (saved === 1 ? ' day' : ' days') + ' ahead');
    }

    return (
      '<div class="topic-panel__divider"></div>' +
      '<div class="sched-head"><span class="section-label" style="margin:0;">Schedule</span>' +
      '<span class="badge badge--' +
      lbl[1] +
      '">' +
      lbl[0] +
      '</span></div>' +
      rows +
      (status === 'behind'
        ? '<div class="sched-warn">⚠ Exceeding this window may delay finishing the roadmap on time. The remaining topics have been re-tightened — catch up to stay on track.</div>'
        : '')
    );
  }

  /* ---------- Dashboard plan card ---------- */
  function planCard() {
    if (!state.plan) {
      var opts = PLAN_MONTHS.map(function (m) {
        return '<button class="plan-pill" data-plan-months="' + m + '">' + m + ' mo</button>';
      }).join('');
      return (
        '<div class="card span-2 plan-card">' +
        '<div class="section-label">Study Plan</div>' +
        '<p class="plan-intro">Choose a target duration and the tracker distributes all ' +
        '29 topics across both roadmaps with daily deadlines — then adapts the schedule as you finish topics early or fall behind.</p>' +
        '<div class="plan-durations">' +
        opts +
        '</div></div>'
      );
    }
    var p = planProgress();
    var pctDone = Math.round((p.done / p.totalTopics) * 100);
    var dayPct = Math.round((p.dayNum / p.total) * 100);
    var statusTxt, statusCls;
    if (p.overdue) {
      statusTxt = 'Timeline ended';
      statusCls = 'attempted';
    } else if (p.behind > 0) {
      statusTxt = p.behind + (p.behind === 1 ? ' topic behind' : ' topics behind');
      statusCls = 'revision';
    } else {
      statusTxt = 'On track';
      statusCls = 'mastered';
    }
    return (
      '<div class="card span-2 plan-card">' +
      '<div class="plan-card__head"><div class="section-label" style="margin:0;">Study Plan · ' +
      state.plan.months +
      '-month</div><span class="badge badge--' +
      statusCls +
      '">' +
      statusTxt +
      '</span></div>' +
      '<div class="plan-card__stats">' +
      '<div><span class="plan-stat-num mono">Day ' +
      p.dayNum +
      '</span><span class="plan-stat-sub">of ' +
      p.total +
      ' · ' +
      fmtDate(p.pStart) +
      ' → ' +
      fmtDate(p.pEnd) +
      '</span></div>' +
      '<div><span class="plan-stat-num mono">' +
      p.done +
      '/' +
      p.totalTopics +
      '</span><span class="plan-stat-sub">topics mastered (' +
      pctDone +
      '%)</span></div>' +
      '</div>' +
      '<div class="progress" style="margin:8px 0 4px;"><div class="progress__fill ' +
      (p.behind > 0 ? '' : 'progress__fill--success') +
      '" style="width:' +
      dayPct +
      '%"></div></div>' +
      '<div class="plan-card__foot"><button class="btn btn--outline" data-plan-open>View full timeline →</button>' +
      '<button class="btn btn--ghost" data-plan-reset>Reset plan</button></div>' +
      '</div>'
    );
  }

  /* ---------- Timeline view ---------- */
  function trackScheduleList(trackId) {
    var track = AppData.tracks[trackId];
    var topics = track.topics;
    var adapt = adaptiveSchedule(trackId);

    var rows = topics
      .map(function (t, i) {
        var ts = state.topics[t.id];
        var base = state.plan.baseline[t.id];
        var status = topicScheduleStatus(t.id);
        var lbl = SCHED_LABEL[status];
        var meta = '📅 ' + fmtDate(base.start) + ' – ' + fmtDate(base.end) + ' · max ' + base.days + 'd';
        if (ts.state !== 'mastered' && adapt[t.id]) {
          var a = adapt[t.id];
          if (a.start !== base.start || a.end !== base.end) {
            meta += '  ·  now ' + fmtDate(a.start) + ' – ' + fmtDate(a.end);
          }
        }
        return (
          '<div class="sched-row sched-row--' +
          status +
          '"><span class="sched-row__num mono">' +
          (i + 1) +
          '</span><div class="sched-row__main"><div class="sched-row__name">' +
          esc(t.name) +
          '</div><div class="sched-row__meta mono">' +
          meta +
          '</div></div><span class="badge badge--' +
          lbl[1] +
          '">' +
          lbl[0] +
          '</span></div>'
        );
      })
      .join('');

    return '<div class="card"><div class="section-label">' + esc(track.name) + '</div><div class="sched-list">' + rows + '</div></div>';
  }

  function renderTimeline() {
    if (!state.plan) {
      var opts = PLAN_MONTHS.map(function (m) {
        return (
          '<button class="plan-pill plan-pill--lg" data-plan-months="' +
          m +
          '">' +
          m +
          ' month' +
          (m === 1 ? '' : 's') +
          '</button>'
        );
      }).join('');
      mainEl.innerHTML =
        '<div class="fade-in"><div class="view-head"><h1>Timeline &amp; Schedule</h1>' +
        '<p>Pick a target duration. Every topic across both tracks gets a start date, deadline, and a maximum number of days — and the plan re-balances itself as you progress.</p></div>' +
        '<div class="card"><div class="section-label">Choose your target duration</div>' +
        '<p class="plan-intro">A shorter plan means tighter daily deadlines; a longer plan spreads topics out. You can reset and re-pick any time.</p>' +
        '<div class="plan-durations">' +
        opts +
        '</div></div></div>';
      wirePlanControls(mainEl);
      return;
    }

    var p = planProgress();
    var pctDone = Math.round((p.done / p.totalTopics) * 100);
    var statusTxt = p.overdue ? 'Timeline ended' : p.behind > 0 ? p.behind + ' behind' : 'On track';
    var statusCls = p.overdue ? 'attempted' : p.behind > 0 ? 'revision' : 'mastered';

    var summary =
      '<div class="card"><div class="timeline-summary">' +
      tlStat('Duration', state.plan.months + ' mo', fmtDate(p.pStart) + ' → ' + fmtDate(p.pEnd)) +
      tlStat('Progress', 'Day ' + p.dayNum, 'of ' + p.total + ' days') +
      tlStat('Mastered', p.done + '/' + p.totalTopics, pctDone + '% complete') +
      tlStat('Status', statusTxt, p.overdue ? 'window closed' : 'across both tracks', statusCls) +
      '</div>' +
      '<div class="plan-card__foot" style="margin-top:6px;"><button class="btn btn--ghost" data-plan-reset>Reset &amp; re-pick duration</button></div>' +
      '</div>';

    mainEl.innerHTML =
      '<div class="fade-in"><div class="view-head"><h1>Timeline &amp; Schedule</h1>' +
      '<p>Deadlines per topic. Finish early and the freed days flow to the topics that remain.</p></div>' +
      summary +
      '<div style="margin-top:18px;">' +
      trackScheduleList('java') +
      '</div><div style="margin-top:18px;">' +
      trackScheduleList('aptitude') +
      '</div></div>';

    wirePlanControls(mainEl);
  }

  function tlStat(label, big, sub, cls) {
    return (
      '<div class="tl-stat"><div class="tl-stat__label">' +
      esc(label) +
      '</div><div class="tl-stat__big mono' +
      (cls ? ' tl-stat__big--' + cls : '') +
      '">' +
      esc(big) +
      '</div><div class="tl-stat__sub">' +
      esc(sub) +
      '</div></div>'
    );
  }

  // Wire the duration pills, "view timeline", and "reset" controls in a scope.
  function wirePlanControls(scope) {
    scope.querySelectorAll('[data-plan-months]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        createPlan(parseInt(btn.getAttribute('data-plan-months'), 10));
      });
    });
    scope.querySelectorAll('[data-plan-open]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        navTo('timeline');
      });
    });
    scope.querySelectorAll('[data-plan-reset]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        clearPlan();
      });
    });
  }

  function renderDashboard() {
    var name = 'Bilal';

    mainEl.innerHTML =
      '<div class="fade-in">' +
      '<div class="view-head"><h1>' +
      greeting() +
      ', ' +
      name +
      ' 👋</h1><p>Your placement prep at a glance.</p></div>' +
      '<div class="dash-grid">' +
      planCard() +
      '</div>' +
      '<div class="dash-grid" style="margin-top:18px;">' +
      trackProgressCard('java') +
      trackProgressCard('aptitude') +
      '</div>' +
      '<div class="dash-grid dash-grid--3" style="margin-top:18px;">' +
      streakCard() +
      reviewQueueCard() +
      weakestCard() +
      '</div>' +
      '<div style="margin-top:18px;">' +
      recentActivityCard() +
      '</div>' +
      '</div>';

    wirePlanControls(mainEl);

    // Wire "review now" buttons in the queue.
    mainEl.querySelectorAll('[data-review-now]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var topicId = btn.getAttribute('data-review-now');
        var def = getTopicDef(topicId);
        startQuiz(topicId, 'review', def.track.id);
      });
    });
    // Wire "go to topic" jumps.
    mainEl.querySelectorAll('[data-goto]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var parts = btn.getAttribute('data-goto').split('|');
        selectedTopicId = parts[1];
        navTo(parts[0]);
      });
    });
  }

  function trackProgressCard(trackId) {
    var track = AppData.tracks[trackId];
    var topics = track.topics;
    var mastered = topics.filter(function (t) {
      return state.topics[t.id].state === 'mastered';
    }).length;
    var p = (mastered / topics.length) * 100;
    var nextTopic = topics.find(function (t) {
      var st = state.topics[t.id].state;
      return st === 'unlocked' || st === 'attempted';
    });
    var meta = nextTopic ? 'Up next: ' + esc(nextTopic.name) : mastered === topics.length ? 'Track complete! 🎉' : 'Keep going';

    return (
      '<div class="card track-card">' +
      '<div class="track-card__top"><span class="track-card__name">' +
      esc(track.name) +
      '</span><span class="track-card__count"><b>' +
      mastered +
      '</b>/' +
      topics.length +
      ' mastered</span></div>' +
      '<div class="progress"><div class="progress__fill ' +
      (p === 100 ? 'progress__fill--success' : '') +
      '" style="width:' +
      p +
      '%"></div></div>' +
      '<div class="track-card__meta">' +
      meta +
      '</div>' +
      '<div style="margin-top:14px;"><button class="btn btn--outline" data-goto="' +
      trackId +
      '|">Open track →</button></div>' +
      '</div>'
    );
  }

  function streakCard() {
    return (
      '<div class="card streak-card">' +
      '<div class="section-label">Study Streak</div>' +
      '<div class="stat-row"><span class="stat-big mono">' +
      state.streak.count +
      '</span><span class="stat-sub">day' +
      (state.streak.count === 1 ? '' : 's') +
      ' in a row 🔥</span></div>' +
      '<div class="track-card__meta" style="margin-top:12px;">Best streak: <b>' +
      state.streak.best +
      '</b> day' +
      (state.streak.best === 1 ? '' : 's') +
      '</div>' +
      '</div>'
    );
  }

  function reviewQueueCard() {
    var due = dueTopics();
    var body;
    if (!due.length) {
      body = '<div class="empty"><span class="empty__icon">✅</span>No reviews due. You\'re all caught up.</div>';
    } else {
      body = due
        .slice(0, 6)
        .map(function (d) {
          return (
            '<div class="due-chip"><div><div class="due-chip__name">' +
            esc(d.topic.name) +
            '</div><div class="due-chip__track">' +
            esc(d.track.short) +
            (d.ts.needsRevision ? ' · revision' : '') +
            '</div></div>' +
            '<button class="btn btn--success" style="padding:7px 14px;" data-review-now="' +
            d.topic.id +
            '">Review</button></div>'
          );
        })
        .join('');
    }
    return (
      '<div class="card"><div class="section-label">Due Today (' +
      due.length +
      ')</div>' +
      body +
      '</div>'
    );
  }

  function weakestCard() {
    var ranked = [];
    eachTopic(function (topic, track) {
      var ts = state.topics[topic.id];
      var avg = avgScore(ts);
      if (avg != null) ranked.push({ topic: topic, track: track, avg: avg });
    });
    ranked.sort(function (a, b) {
      return a.avg - b.avg;
    });
    var top3 = ranked.slice(0, 3);

    var body;
    if (!top3.length) {
      body = '<div class="empty"><span class="empty__icon">🌱</span>Take a quiz to surface weak areas.</div>';
    } else {
      body = top3
        .map(function (r) {
          var cls = r.avg >= PASS ? 'score-tag--pass' : 'score-tag--fail';
          return (
            '<div class="list-item"><div class="list-item__main"><span class="list-item__title">' +
            esc(r.topic.name) +
            '</span><span class="list-item__sub">' +
            esc(r.track.short) +
            ' · avg over ' +
            state.topics[r.topic.id].scores.length +
            ' attempt' +
            (state.topics[r.topic.id].scores.length === 1 ? '' : 's') +
            '</span></div>' +
            '<span class="score-tag ' +
            cls +
            ' mono">' +
            pct(r.avg) +
            '%</span></div>'
          );
        })
        .join('');
    }
    return '<div class="card"><div class="section-label">Weakest Topics</div>' + body + '</div>';
  }

  function recentActivityCard() {
    var acts = state.activity.slice(0, 5);
    var body;
    if (!acts.length) {
      body = '<div class="empty"><span class="empty__icon">📝</span>No attempts yet — start your first quiz.</div>';
    } else {
      body = acts
        .map(function (a) {
          var cls = a.passed ? 'score-tag--pass' : 'score-tag--fail';
          return (
            '<div class="list-item"><div class="list-item__main"><span class="list-item__title">' +
            esc(a.name) +
            (a.type === 'review' ? ' · review' : '') +
            '</span><span class="list-item__sub">' +
            timeAgo(a.ts) +
            ' · ' +
            (a.passed ? 'Passed' : 'Missed') +
            '</span></div>' +
            '<span class="score-tag ' +
            cls +
            ' mono">' +
            pct(a.score) +
            '%</span></div>'
          );
        })
        .join('');
    }
    return '<div class="card"><div class="section-label">Recent Activity</div>' + body + '</div>';
  }

  function timeAgo(ts) {
    var diff = Date.now() - ts;
    var mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return mins + 'm ago';
    var hrs = Math.floor(mins / 60);
    if (hrs < 24) return hrs + 'h ago';
    var days = Math.floor(hrs / 24);
    if (days === 1) return 'yesterday';
    return days + 'd ago';
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

  /* ---------- Keyboard support ---------- */
  document.addEventListener('keydown', function (e) {
    // Only act while the quiz/results overlay is open.
    if (!overlayEl.classList.contains('is-open') || !session) return;

    if (e.key === 'Escape') {
      if (overlayInner.querySelector('#quitYes')) return; // confirm box already up
      if (session.phase === 'quiz') confirmQuit();
      else {
        session = null;
        closeOverlay();
        render();
      }
      return;
    }

    if (session.phase !== 'quiz') return;

    // 1-4 or A-D select an option.
    var map = { '1': 0, '2': 1, '3': 2, '4': 3, a: 0, b: 1, c: 2, d: 3 };
    var k = e.key.toLowerCase();
    if (map[k] != null) {
      var idx = map[k];
      var q = session.questions[session.index];
      if (idx < q.options.length) {
        session.answers[session.index] = idx;
        renderQuizInPlace();
      }
    } else if (e.key === 'Enter') {
      if (session.answers[session.index] != null) {
        if (session.index === session.questions.length - 1) submitQuiz();
        else {
          session.index++;
          renderQuizInPlace();
        }
      }
    }
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
