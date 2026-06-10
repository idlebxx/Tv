/* ============================================
   ui.js — navbar, footer, theme toggle, back to top
============================================ */

(function () {
  'use strict';
  const { escapeHTML, showToast } = window.IDLEB.utils;
  const { settings, auth, watchlist, queue, progress } = window.IDLEB.stores;

  // === Theme toggle ===
  const themeBtn = document.getElementById('theme-toggle');
  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      const order = ['dark', 'light', 'amoled'];
      const cur = settings.get().theme;
      const next = order[(order.indexOf(cur) + 1) % order.length];
      settings.set({ theme: next });
      showToast('الثيم: ' + (next === 'dark' ? 'داكن' : next === 'light' ? 'فاتح' : 'AMOLED'));
    });
  }

  // === Back to top ===
  const btt = document.getElementById('back-to-top');
  if (btt) {
    window.addEventListener('scroll', () => {
      btt.classList.toggle('visible', window.scrollY > 600);
    }, { passive: true });
    btt.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  }

  // === Navbar scroll effect ===
  const nav = document.getElementById('navbar');
  if (nav) {
    window.addEventListener('scroll', () => nav.classList.toggle('scrolled', window.scrollY > 20), { passive: true });
  }

  // === Mobile menu ===
  const menuBtn = document.getElementById('menu-toggle');
  const mobileMenu = document.getElementById('mobile-menu');
  if (menuBtn && mobileMenu) {
    mobileMenu.innerHTML = `
      <a href="index.html">الرئيسية</a>
      <a href="pages/series.html">المسلسلات</a>
      <a href="pages/categories.html">التصنيفات</a>
      <a href="pages/recommendations.html">موصى لك</a>
      <a href="pages/new-episodes.html">حلقات جديدة</a>
      <a href="pages/coming-soon.html">قريباً</a>
      <a href="pages/countries.html">الخريطة</a>
      <a href="pages/watchlist.html">مفضلتي</a>
      <a href="pages/queue.html">شاهد لاحقاً</a>
      <a href="pages/history.html">السجل</a>
      <a href="pages/downloads.html">التحميلات</a>
      <a href="pages/profile.html">الملف الشخصي</a>
    `;
    menuBtn.addEventListener('click', () => mobileMenu.classList.toggle('open'));
  }

  // === Auth button state ===
  const authBtn = document.getElementById('auth-btn');
  if (authBtn) {
    function updateAuthBtn() {
      const u = auth.get().user;
      if (u) {
        authBtn.textContent = u.name.split(' ')[0];
        authBtn.href = 'pages/profile.html';
      } else {
        authBtn.textContent = 'دخول';
        authBtn.href = 'pages/login.html';
      }
    }
    updateAuthBtn();
    auth.subscribe(updateAuthBtn);
  }

  // === Year ===
  const y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();

  // === Active link ===
  document.querySelectorAll('.nav-link').forEach((a) => {
    if (a.getAttribute('href') === location.pathname.split('/').pop() ||
        (location.pathname.endsWith('/') && a.getAttribute('href') === 'index.html')) {
      a.classList.add('active');
    }
  });
})();
