document.addEventListener('DOMContentLoaded', function () {

  var sidebarToggle = document.getElementById('sidebar-toggle');
  var sidebar = document.getElementById('sidebar');
  if (sidebarToggle && sidebar) {
    sidebarToggle.addEventListener('click', function () {
      if (window.innerWidth <= 1024) {
        sidebar.classList.toggle('mobile-open');
      } else {
        sidebar.classList.toggle('collapsed');
      }
    });
  }

  var logoutLink = document.getElementById('sidebar-logout');
  var logoutForm = document.getElementById('logout-form');
  if (logoutLink && logoutForm) {
    logoutLink.addEventListener('click', function (e) {
      e.preventDefault();
      if (confirm('Are you sure you want to log out?')) {
        logoutForm.submit();
      }
    });
  }

  document.querySelectorAll('.js-submenu-toggle').forEach(function (toggle) {
    toggle.addEventListener('click', function () {
      var menu = toggle.nextElementSibling;
      if (menu) menu.classList.toggle('open');
    });
  });

  var notifBtn = document.getElementById('notif-btn');
  var notifDropdown = document.getElementById('notif-dropdown');
  if (notifBtn && notifDropdown) {
    notifBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      notifDropdown.classList.toggle('show');
      var badge = document.getElementById('notif-badge');
      if (badge) badge.textContent = '0';
      fetch('/api/notifications/mark-read', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: '_csrf=' + encodeURIComponent(window.csrfTokenValue || '') }).catch(function(){});
    });
    document.addEventListener('click', function (e) {
      if (!e.target.closest('.topbar-actions')) {
        notifDropdown.classList.remove('show');
      }
    });
  }

  document.querySelectorAll('[data-modal-open]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var target = document.getElementById(btn.dataset.modalOpen);
      if (target) target.classList.add('show');
    });
  });

  document.querySelectorAll('[data-modal-close]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var modal = btn.closest('.modal-backdrop');
      if (modal) modal.classList.remove('show');
    });
  });

  document.querySelectorAll('.modal-backdrop').forEach(function (modal) {
    modal.addEventListener('click', function (e) {
      if (e.target === modal) modal.classList.remove('show');
    });
  });

  document.querySelectorAll('[data-confirm]').forEach(function (el) {
    el.addEventListener('click', function (e) {
      if (!confirm(el.dataset.confirm || 'Are you sure?')) {
        e.preventDefault();
      }
    });
  });

  var tabs = document.querySelectorAll('.tab-btn');
  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      var target = tab.dataset.tab;
      var wrapper = tab.closest('.tabs');
      if (wrapper) {
        wrapper.querySelectorAll('.tab-btn').forEach(function (t) { t.classList.remove('active'); });
        tab.classList.add('active');
      }
      document.querySelectorAll('.tab-pane').forEach(function (pane) {
        pane.classList.toggle('active', pane.id === target);
      });
    });
  });

  var checkAll = document.querySelector('[data-checkall]');
  if (checkAll) {
    checkAll.addEventListener('change', function () {
      document.querySelectorAll('input[type="checkbox"].row-check').forEach(function (cb) {
        cb.checked = checkAll.checked;
      });
    });
  }

  var csrfInput = document.querySelector('input[name="_csrf"]');
  window.csrfTokenValue = csrfInput ? csrfInput.value : '';
});