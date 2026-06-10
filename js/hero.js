/* ============================================
   hero.js — 3D hero slider
============================================ */

(function () {
  'use strict';
  const container = document.getElementById('hero');
  if (!container) return;
  const { escapeHTML, formatViews, poster, showToast } = window.IDLEB.utils;
  const { api } = window.IDLEB;

  async function init() {
    container.innerHTML = '<div class="loading-dots" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%)"><span></span><span></span><span></span></div>';
    const { data } = await api.getMostWatched();
    if (!data || !data.length) { container.style.display = 'none'; return; }

    // Cache for heart-toggle
    window.IDLEB_MOCK_DATA = window.IDLEB_MOCK_DATA || [];
    data.forEach((s) => { if (!window.IDLEB_MOCK_DATA.find((x) => x.id === s.id)) window.IDLEB_MOCK_DATA.push(s); });

    const items = data.slice(0, 5);
    let idx = 0;
    let timer;

    container.innerHTML = `
      <div class="hero-bg active" id="hero-bg" style="background-image:url('${escapeHTML(poster(items[0].backdrop || items[0].poster))}')"></div>
      <div class="hero-content" id="hero-content">
        <span class="hero-tag">🔥 الأكثر مشاهدة اليوم</span>
        <h1 class="hero-title" id="hero-title">${escapeHTML(items[0].title)}</h1>
        <div class="hero-meta" id="hero-meta">
          <span class="star">★ ${items[0].rating?.toFixed(1) || '—'}</span>
          <span>${items[0].year || ''}</span>
          <span>${formatViews(items[0].views)} مشاهدة</span>
          <span>${escapeHTML(items[0].country || '')}</span>
        </div>
        <p class="hero-desc" id="hero-desc">${escapeHTML(items[0].description || '')}</p>
        <div class="hero-actions">
          <a href="pages/series-detail.html?id=${encodeURIComponent(items[0].id)}" class="btn-primary">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            شاهد الآن
          </a>
          <a href="pages/series-detail.html?id=${encodeURIComponent(items[0].id)}" class="btn-ghost" style="background:var(--card);color:var(--fg)">تفاصيل</a>
        </div>
      </div>
      <div class="hero-dots" id="hero-dots">
        ${items.map((_, i) => `<button class="${i === 0 ? 'active' : ''}" data-i="${i}" aria-label="شريحة ${i + 1}"></button>`).join('')}
      </div>
    `;

    const bg = document.getElementById('hero-bg');
    const title = document.getElementById('hero-title');
    const meta = document.getElementById('hero-meta');
    const desc = document.getElementById('hero-desc');
    const dots = document.getElementById('hero-dots');
    const content = document.getElementById('hero-content');

    function show(i) {
      idx = i;
      const item = items[i];
      content.style.opacity = '0';
      bg.style.opacity = '0';
      setTimeout(() => {
        bg.style.backgroundImage = `url('${escapeHTML(poster(item.backdrop || item.poster))}')`;
        title.textContent = item.title;
        meta.innerHTML = `
          <span class="star">★ ${item.rating?.toFixed(1) || '—'}</span>
          <span>${item.year || ''}</span>
          <span>${formatViews(item.views)} مشاهدة</span>
          <span>${escapeHTML(item.country || '')}</span>
        `;
        desc.textContent = item.description || '';
        content.querySelector('a').href = 'pages/series-detail.html?id=' + encodeURIComponent(item.id);
        bg.style.opacity = '1';
        content.style.opacity = '1';
        dots.querySelectorAll('button').forEach((b, j) => b.classList.toggle('active', i === j));
      }, 300);
    }

    function next() { show((idx + 1) % items.length); }
    function start() { stop(); timer = setInterval(next, 7000); }
    function stop() { if (timer) clearInterval(timer); }
    start();

    dots.querySelectorAll('button').forEach((b) => {
      b.addEventListener('click', () => { show(Number(b.dataset.i)); start(); });
    });
    container.addEventListener('mouseenter', stop);
    container.addEventListener('mouseleave', start);
  }

  init();
})();
