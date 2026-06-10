/* ============================================
   player.js — video player with skip intro, PiP, sleep timer
   No Video.js dependency — pure HTML5 video for static.
============================================ */

(function () {
  'use strict';
  const { progress, queue, analytics } = window.IDLEB.stores;

  function buildPlayer(episode, nextEpisode, container) {
    const wrap = document.createElement('div');
    wrap.className = 'player-wrap';
    wrap.innerHTML = `
      <video id="player-video" controls playsinline preload="metadata"
        src="${episode.video_url}"
        poster="${episode.thumbnail || ''}">
      </video>
      <button class="player-overlay-btn" id="skip-intro" style="display:none">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 4 15 12 5 20 5 4"/><line x1="19" y1="5" x2="19" y2="19"/></svg>
        تخطي المقدمة
      </button>
      <div class="player-controls-top">
        <select id="sleep-timer" aria-label="مؤقت النوم">
          <option value="0">بدون مؤقت</option>
          <option value="15">15 د</option>
          <option value="30">30 د</option>
          <option value="60">60 د</option>
          <option value="90">90 د</option>
        </select>
      </div>
      ${nextEpisode ? `
        <div class="next-overlay" id="next-overlay" style="display:none">
          <div class="next-overlay-content">
            <p>الحلقة القادمة</p>
            <h3>${escapeHTML(nextEpisode.title || '')}</h3>
            <a class="btn-primary" href="watch.html?seriesId=${nextEpisode.series_id}&seasonId=${nextEpisode.season_id}&episodeId=${nextEpisode.id}">تشغيل الآن</a>
          </div>
        </div>` : ''}
    `;
    container.appendChild(wrap);

    const v = wrap.querySelector('video');
    const skip = wrap.querySelector('#skip-intro');
    const nextOverlay = wrap.querySelector('#next-overlay');
    const sleepSel = wrap.querySelector('#sleep-timer');

    let lastSave = 0;
    let sleepInterval;

    v.addEventListener('timeupdate', () => {
      const t = v.currentTime;
      skip.style.display = t > 0 && t < 90 ? 'flex' : 'none';
      if (nextEpisode) {
        const d = v.duration || 0;
        nextOverlay.style.display = (d > 0 && d - t < 30) ? 'flex' : 'none';
      }
      const now = Date.now();
      if (now - lastSave > 5000 && t > 5) {
        lastSave = now;
        progress.set((p) => ({
          ...p,
          byEpisode: {
            ...p.byEpisode,
            [episode.id]: { episodeId: episode.id, seriesId: episode.series_id, position: t, duration: v.duration || 0, updatedAt: now }
          }
        }));
      }
    });

    v.addEventListener('ended', () => {
      analytics.set((a) => ({
        ...a,
        views: { ...a.views, [episode.series_id]: (a.views[episode.series_id] || 0) + 1 }
      }));
    });

    skip.addEventListener('click', () => { v.currentTime = 90; });

    sleepSel.addEventListener('change', () => {
      clearInterval(sleepInterval);
      const mins = Number(sleepSel.value);
      if (!mins) return;
      let left = mins * 60;
      sleepInterval = setInterval(() => {
        left--;
        if (left <= 0) { v.pause(); clearInterval(sleepInterval); sleepSel.value = '0'; }
      }, 1000);
    });

    // Media Session (lock screen)
    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: episode.title || 'IDLEB TV',
        artist: 'IDLEB TV',
        artwork: episode.thumbnail ? [{ src: episode.thumbnail, sizes: '512x512' }] : [],
      });
    }

    return v;
  }

  function escapeHTML(s) {
    return String(s || '').replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[c]);
  }

  window.IDLEB.player = { buildPlayer };
})();
