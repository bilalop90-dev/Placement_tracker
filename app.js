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
     Quiz engine — added in the next milestone
     ============================================================ */
  function startQuiz() {
    toast('Quiz engine', 'Coming in the next build step.', 'info', '⚙️');
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
