/* ============================================
   utils.js — shared helpers
============================================ */

(function () {
  'use strict';

  const PLACEHOLDER = window.IDLEB_CONFIG.ASSETS.PLACEHOLDER_POSTER;

  function escapeHTML(s) {
    return String(s || '').replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[c]);
  }

  function formatViews(v) {
    v = Number(v) || 0;
    if (v >= 1e6) return (v / 1e6).toFixed(1) + 'M';
    if (v >= 1e3) return (v / 1e3).toFixed(1) + 'K';
    return String(v);
  }

  function formatDuration(s) {
    s = Number(s) || 0;
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return m + ':' + String(sec).padStart(2, '0');
  }

  function timeAgo(date) {
    const d = typeof date === 'string' ? new Date(date) : date;
    const seconds = Math.floor((Date.now() - d.getTime()) / 1000);
    const intervals = [
      [31536000, 'سنة'], [2592000, 'شهر'], [86400, 'يوم'], [3600, 'ساعة'], [60, 'دقيقة']
    ];
    for (const [secs, label] of intervals) {
      const v = Math.floor(seconds / secs);
      if (v >= 1) return 'منذ ' + v + ' ' + label;
    }
    return 'الآن';
  }

  function debounce(fn, ms) {
    let t; return function (...args) { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
  }

  function poster(url) { return url || PLACEHOLDER; }

  function showToast(message, type) {
    const c = document.getElementById('toast-container');
    if (!c) return;
    const t = document.createElement('div');
    t.className = 'toast ' + (type || '');
    t.textContent = message;
    c.appendChild(t);
    setTimeout(() => { t.style.opacity = '0'; t.style.transform = 'translateY(-20px)'; }, 2500);
    setTimeout(() => t.remove(), 3000);
  }

  function getQuery(name) {
    return new URLSearchParams(window.location.search).get(name);
  }

  function setQuery(name, value) {
    const u = new URL(window.location.href);
    if (value) u.searchParams.set(name, value); else u.searchParams.delete(name);
    history.replaceState(null, '', u);
  }

  function posterOrEmpty(s) { return s.poster || ''; }

  // Skeleton card
  function skeletonCard() {
    return `<div class="series-card">
      <div class="poster skeleton" style="aspect-ratio: 2/3;"></div>
    </div>`;
  }

  // Render a series card
  function seriesCardHTML(s) {
    const inList = window.IDLEB.stores.watchlist.get().items.some((x) => x.id === s.id);
    return `
      <article class="series-card" data-id="${escapeHTML(s.id)}">
        <a href="pages/series-detail.html?id=${encodeURIComponent(s.id)}">
          <img class="poster" src="${escapeHTML(poster(s.poster))}" alt="${escapeHTML(s.title)}" loading="lazy" />
        </a>
        <button class="heart-btn ${inList ? 'active' : ''}" data-action="toggle-watchlist" data-id="${escapeHTML(s.id)}" aria-label="مفضلة">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="${inList ? 'white' : 'none'}" stroke="currentColor" stroke-width="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
        </button>
        ${s.status === 'ongoing' ? '<span class="badge">مستمر</span>' : ''}
        <div class="card-overlay">
          <div class="play-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="2">
              <polygon points="5 3 19 12 5 21 5 3"/>
            </svg>
          </div>
          <h3 class="title">${escapeHTML(s.title)}</h3>
          <div class="meta">
            <span class="star">★ ${s.rating?.toFixed(1) || '—'}</span>
            <span>${s.year || ''}</span>
            <span>${formatViews(s.views)} مشاهدة</span>
          </div>
        </div>
      </article>
    `;
  }

  function attachCardEvents(container) {
    container.querySelectorAll('[data-action="toggle-watchlist"]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const id = btn.dataset.id;
        const all = window.IDLEB.api && window.IDLEB_MOCK_DATA;
        // Find the series from any global cache
        const series = findSeriesInCache(id);
        if (!series) return;
        const list = window.IDLEB.stores.watchlist.get().items;
        const exists = list.some((x) => x.id === id);
        if (exists) {
          window.IDLEB.stores.watchlist.set((s) => ({ ...s, items: s.items.filter((x) => x.id !== id) }));
          showToast('أزيل من المفضلة');
        } else {
          window.IDLEB.stores.watchlist.set((s) => ({ ...s, items: [series, ...s.items] }));
          showToast('أضيف للمفضلة', 'success');
        }
        btn.classList.toggle('active');
        const svg = btn.querySelector('svg');
        if (svg) svg.setAttribute('fill', exists ? 'none' : 'white');
      });
    });
  }

  // Cache: tracks series we've seen so heart-click can find them
  window.IDLEB_MOCK_DATA = window.IDLEB_MOCK_DATA || [];
  function findSeriesInCache(id) {
    return window.IDLEB_MOCK_DATA.find((s) => s.id === id);
  }

  window.IDLEB.utils = {
    escapeHTML, formatViews, formatDuration, timeAgo,
    debounce, poster, showToast, getQuery, setQuery,
    skeletonCard, seriesCardHTML, attachCardEvents,
  };
})();
