/* ============================================
   store.js — localStorage-backed stores
   Mirrors the Zustand stores from the Next version.
============================================ */

(function () {
  'use strict';

  const PREFIX = 'idleb-';

  function load(key, fallback) {
    try {
      const raw = localStorage.getItem(PREFIX + key);
      return raw ? JSON.parse(raw) : fallback;
    } catch { return fallback; }
  }
  function save(key, value) {
    try { localStorage.setItem(PREFIX + key, JSON.stringify(value)); }
    catch (e) { console.warn('storage error', e); }
  }

  // Reactive store factory
  function createStore(name, initial, persist = true) {
    let state = persist ? load(name, initial) : initial;
    const listeners = new Set();

    if (persist) save(name, state);

    return {
      get() { return state; },
      set(updater) {
        state = typeof updater === 'function' ? updater(state) : { ...state, ...updater };
        if (persist) save(name, state);
        listeners.forEach((fn) => fn(state));
      },
      subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },
    };
  }

  // ===== Stores =====
  const auth = createStore('auth', { user: null });
  const watchlist = createStore('watchlist', { items: [] });
  const progress = createStore('progress', { byEpisode: {}, history: [] });
  const settings = createStore('settings', { theme: 'dark', fontSize: 'md', lang: 'ar' });
  const searchHistory = createStore('search-history', { history: [] });
  const queue = createStore('queue', { items: [] });
  const analytics = createStore('analytics', { views: {} });
  const ratings = createStore('ratings', { bySeries: {} });

  // Apply theme/lang/font on load and on change
  function applySettings(s) {
    document.documentElement.setAttribute('data-theme', s.theme);
    document.documentElement.setAttribute('data-lang', s.lang);
    document.documentElement.setAttribute('data-font', s.fontSize);
    document.documentElement.lang = s.lang;
    document.documentElement.dir = s.lang === 'ar' ? 'rtl' : 'ltr';
  }
  applySettings(settings.get());
  settings.subscribe(applySettings);

  // Expose globally
  window.IDLEB = {
    stores: { auth, watchlist, progress, settings, searchHistory, queue, analytics, ratings },
  };
})();
