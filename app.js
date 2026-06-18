/* ============================================================
   Placement Tracker — App bootstrap (scaffold)
   Full logic is added incrementally across milestones.
   ============================================================ */
(function () {
  'use strict';

  /* ---------- Theme ---------- */
  var THEME_KEY = 'placement_tracker_theme';
  var root = document.documentElement;

  function setTheme(theme) {
    root.setAttribute('data-theme', theme);
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch (e) {}
  }

  document.getElementById('themeToggle').addEventListener('click', function () {
    var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    setTheme(next);
  });

  /* ---------- Mobile sidebar ---------- */
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

  /* ---------- Nav (placeholder until views land) ---------- */
  var main = document.getElementById('main');
  document.getElementById('nav').addEventListener('click', function (e) {
    var link = e.target.closest('.nav__link');
    if (!link) return;
    document.querySelectorAll('.nav__link').forEach(function (n) {
      n.classList.toggle('is-active', n === link);
    });
    toggleSidebar(false);
    main.innerHTML =
      '<div class="view-head fade-in"><h1>' +
      link.querySelector('span').textContent +
      '</h1><p>Coming together — scaffold ready.</p></div>';
  });

  main.innerHTML =
    '<div class="view-head fade-in"><h1>Placement Tracker</h1><p>Scaffold ready. Design system + dark/light mode online.</p></div>';
})();
