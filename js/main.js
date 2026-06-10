/* ============================================
   main.js — bootstrap
============================================ */

(function () {
  'use strict';

  // Auto theme on first visit (only if not set)
  if (!localStorage.getItem('idleb-settings')) {
    const hour = new Date().getHours();
    const isDay = hour >= 6 && hour < 18;
    if (!isDay) {
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  }

  // Hide app loader
  window.addEventListener('load', () => {
    const loader = document.getElementById('app-loader');
    if (loader) {
      setTimeout(() => loader.classList.add('hidden'), 300);
      setTimeout(() => loader.remove(), 800);
    }
  });
})();
