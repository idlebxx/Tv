/* ============================================
   recommendations.js — client-side scoring
============================================ */

(function () {
  'use strict';
  const { analytics, progress, ratings } = window.IDLEB.stores;

  // 1) Similar — Jaccard on categories
  function similar(target, all, limit = 12) {
    const tc = new Set(target.categories);
    return all
      .filter((s) => s.id !== target.id)
      .map((s) => {
        const inter = s.categories.filter((c) => tc.has(c)).length;
        const union = new Set([...target.categories, ...s.categories]).size;
        const j = union ? inter / union : 0;
        const yb = s.year === target.year ? 0.2 : 0;
        const cb = s.country === target.country ? 0.15 : 0;
        return { s, score: j + yb + cb };
      })
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  // 2) Hidden gems — high rating, low views
  function hiddenGems(all, limit = 10) {
    return all
      .filter((s) => s.rating >= 4 && s.views < 50000)
      .sort((a, b) => b.rating - a.rating)
      .slice(0, limit);
  }

  // 3) Trending — local analytics
  function trending(all, limit = 10) {
    const views = analytics.get().views || {};
    const max = Math.max(1, ...Object.values(views));
    return all
      .map((s) => {
        const local = (views[s.id] || 0) / max;
        const global = s.views > 0 ? Math.log10(s.views) / 7 : 0;
        return { s, score: local * 0.7 + global * 0.3 };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  // 4) For-you — based on user history categories
  function forYou(all, limit = 12) {
    const hist = progress.get().history || [];
    const cw = {};
    hist.forEach((h) => {
      const s = all.find((x) => x.id === h.series_id);
      s?.categories?.forEach((c) => { cw[c] = (cw[c] || 0) + 1; });
    });
    const watched = new Set(hist.map((h) => h.series_id));
    return all
      .filter((s) => !watched.has(s.id))
      .map((s) => {
        const cs = s.categories.reduce((sum, c) => sum + (cw[c] || 0), 0) * 0.5;
        const rs = s.rating * 0.3;
        const ns = s.year >= 2023 ? 0.2 : 0;
        return { s, score: cs + rs + ns };
      })
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  window.IDLEB.recs = { similar, hiddenGems, trending, forYou };
})();
