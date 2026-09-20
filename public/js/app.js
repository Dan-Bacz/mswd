(function () {
  'use strict';

  // Sidebar toggle (mobile/tablet)
  var toggle = document.getElementById('sidebarToggle');
  var sidebar = document.querySelector('.sidebar');
  if (toggle && sidebar) {
    toggle.addEventListener('click', function () {
      sidebar.classList.toggle('open');
    });
    document.addEventListener('click', function (e) {
      if (sidebar.classList.contains('open') &&
          !sidebar.contains(e.target) &&
          !toggle.contains(e.target)) {
        sidebar.classList.remove('open');
      }
    });
  }

  // Notifications dropdown
  var bell = document.getElementById('bellBtn');
  var panel = document.getElementById('bellPanel');
  if (bell && panel) {
    bell.addEventListener('click', function (e) {
      e.stopPropagation();
      panel.classList.toggle('open');
    });
    document.addEventListener('click', function (e) {
      if (!panel.contains(e.target) && e.target !== bell) {
        panel.classList.remove('open');
      }
    });
  }

  // Generic modal helpers: [data-modal-open="id"], [data-modal-close]
  document.querySelectorAll('[data-modal-open]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var modal = document.getElementById(btn.getAttribute('data-modal-open'));
      if (modal) modal.classList.add('open');
    });
  });
  document.querySelectorAll('[data-modal-close]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var modal = btn.closest('.modal-backdrop');
      if (modal) modal.classList.remove('open');
    });
  });
  document.querySelectorAll('.modal-backdrop').forEach(function (bd) {
    bd.addEventListener('click', function (e) {
      if (e.target === bd) bd.classList.remove('open');
    });
  });

  // Confirm helper for destructive inline forms
  document.querySelectorAll('form[data-confirm]').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      if (!window.confirm(form.getAttribute('data-confirm'))) {
        e.preventDefault();
      }
    });
  });

  // Auto-refresh the header unread badge via API (only when signed in)
  var badgeDot = document.querySelector('.bell-dot');
  var navBadge = document.querySelector('.nav-badge');
  function refreshUnread() {
    fetch('/api/notifications/unread-count', { credentials: 'same-origin' })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (!data.ok) return;
        var n = data.unread;
        if (badgeDot) {
          badgeDot.textContent = n > 9 ? '9+' : n;
          badgeDot.style.display = n > 0 ? 'inline-flex' : 'none';
        }
        if (navBadge) {
          navBadge.textContent = n > 9 ? '9+' : n;
          navBadge.style.display = n > 0 ? 'inline-flex' : 'none';
        }
      })
      .catch(function () {});
  }
  if (badgeDot || navBadge) {
    setInterval(refreshUnread, 30000);
  }
})();