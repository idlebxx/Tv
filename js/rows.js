/* ============================================
   rows.js — horizontal scrollers for home + list pages
============================================ */

(function () {
  'use strict';
  const { api } = window.IDLEB;
  const { escapeHTML, seriesCardHTML, attachCardEvents, skeletonCard } = window.IDLEB.utils;

  // Map row name -> API call
  const ROW_CALLS = {
    'latest': () => api.getLatest(),
    'top-rated': () => api.getTopRated(),
    'most-watched': () => api.getMostWatched(),
    'all': (params) => api.getSeries(params || {}),
  };

  async function buildRow(section) {
    const name = section.dataset.row;
    const title = section.dataset.title;
    const href = section.dataset.href;
    const call = ROW_CALLS[name];
    if (!call) return;

    section.innerHTML = `
      <div class="row-header">
        <h2 class="gradient-text">${escapeHTML(title)}</h2>
        ${href ? `<a href="${href}">عرض الكل ←</a>` : ''}
      </div>
      <div class="row-wrapper">
        <button class="row-arrow next" aria-label="السابق">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
        <div class="row-track">
          ${Array.from({ length: 8 }).map(() => skeletonCard()).join('')}
        </div>
        <button class="row-arrow prev" aria-label="التالي">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
      </div>
    `;

    try {
      const { data } = await call();
      // Cache series globally for heart-toggle
      window.IDLEB_MOCK_DATA = window.IDLEB_MOCK_DATA || [];
      data.forEach((s) => { if (!window.IDLEB_MOCK_DATA.find((x) => x.id === s.id)) window.IDLEB_MOCK_DATA.push(s); });

      const track = section.querySelector('.row-track');
      track.innerHTML = data.map(seriesCardHTML).join('');
      attachCardEvents(track);
    } catch (e) {
      section.querySelector('.row-track').innerHTML = '<p style="padding:1rem;color:var(--muted)">فشل التحميل</p>';
    }

    // Scroll arrows
    const track = section.querySelector('.row-track');
    const prev = section.querySelector('.row-arrow.prev');
    const next = section.querySelector('.row-arrow.next');
    const scrollAmount = () => track.clientWidth * 0.8;
    if (prev) prev.addEventListener('click', () => track.scrollBy({ left: -scrollAmount(), behavior: 'smooth' }));
    if (next) next.addEventListener('click', () => track.scrollBy({ left: scrollAmount(), behavior: 'smooth' }));
  }

  document.querySelectorAll('.row-section').forEach(buildRow);
})();
