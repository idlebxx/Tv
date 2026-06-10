/* ============================================
   config.js — global configuration (FIXED)
============================================ */

window.IDLEB_CONFIG = {
  API_BASE: 'https://admin.dramaramadan.net/api',
  USE_PROXY: false,
  USE_MOCK: false,  // ✅ تم التعديل: استخدام API الحقيقي
  ASSETS: {
    PLACEHOLDER_POSTER: 'data:image/svg+xml;utf8,' + encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 300">
        <defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#7C3AED"/><stop offset="100%" stop-color="#EC4899"/>
        </linearGradient></defs>
        <rect width="200" height="300" fill="url(#g)"/>
        <text x="100" y="160" text-anchor="middle" fill="white" font-family="Arial" font-size="24" font-weight="bold">IDLEB</text>
        <text x="100" y="190" text-anchor="middle" fill="white" font-family="Arial" font-size="16">TV</text>
      </svg>
    `),
  },
};
