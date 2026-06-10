/* ============================================
   config.js — global configuration (FIXED FOR STATIC HOSTING)
============================================ */

window.IDLEB_CONFIG = {
  // استخدام Proxy مجاني لتفادي CORS
  API_BASE: 'https://api.allorigins.win/raw?url=https://admin.dramaramadan.net/api',
  USE_PROXY: true,
  USE_MOCK: false,  // ✅ استخدام API الحقيقي
  
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
