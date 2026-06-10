/* ============================================
   api.js — fetch wrapper with mock fallback
============================================ */

(function () {
  'use strict';

  const { API_BASE, USE_MOCK } = window.IDLEB_CONFIG;

  // ===== Mock data (used when API fails / CORS) =====
  const MOCK_CATEGORIES = [
    { id: '1', name: 'دراما', count: 120 },
    { id: '2', name: 'رومانسي', count: 80 },
    { id: '3', name: 'كوميدي', count: 65 },
    { id: '4', name: 'إثارة', count: 95 },
    { id: '5', name: 'تاريخي', count: 50 },
    { id: '6', name: 'خيال', count: 40 },
  ];
  const MOCK_COUNTRIES = [
    { code: 'TR', name: 'تركيا', count: 80 },
    { code: 'EG', name: 'مصر', count: 60 },
    { code: 'SY', name: 'سوريا', count: 45 },
    { code: 'SA', name: 'السعودية', count: 30 },
    { code: 'IQ', name: 'العراق', count: 25 },
    { code: 'LB', name: 'لبنان', count: 20 },
    { code: 'JO', name: 'الأردن', count: 18 },
    { code: 'IN', name: 'الهند', count: 22 },
    { code: 'KR', name: 'كوريا', count: 35 },
  ];
  const MOCK_SERIES = Array.from({ length: 36 }, (_, i) => {
    const cats = MOCK_CATEGORIES;
    const countries = MOCK_COUNTRIES;
    const c1 = cats[i % cats.length];
    const c2 = cats[(i + 2) % cats.length];
    const country = countries[i % countries.length];
    const id = String(i + 1);
    return {
      id,
      title: ['حكاية قلب', 'ظل الماضي', 'أمواج الحب', 'سر المدينة', 'العاصفة', 'وعد الشمس',
        'أحلام اليقظة', 'طريق العودة', 'وادي الذئاب', 'قلوب حائرة', 'حارس الليل', 'سقوط المطر',
        'نور العين', 'رحلة الأمل', 'الزمن الجميل', 'صرخة الروح', 'بنات الشمس', 'ظل الشجرة',
        'غريب الدار', 'وردة الياسمين', 'الموسم القادم', 'سحر الشرق', 'أمير القلوب', 'ذاكرة الزمن',
        'الوعد', 'حبيبي نائماً', 'كسر الصمت', 'رجال ونساء', 'قصة حب', 'مملكة النار', 'أبناء الشمس',
        'جروح الحب', 'رسالة حب', 'العهد', 'غرام الانتقام', 'نهاية البداية'][i],
      description: 'مسلسل درامي رومانسي يتناول قصة عائلة عبر أجيالها، مليء بالمفاجآت والتقلبات.',
      poster: '',
      backdrop: '',
      rating: 3.5 + (i % 5) * 0.3,
      year: 2018 + (i % 8),
      country: country.name,
      categories: [c1.name, c2.name],
      seasons_count: 1 + (i % 4),
      views: 1000 + (i * 2300) % 80000,
      status: i % 3 === 0 ? 'ongoing' : 'completed',
    };
  });

  async function fetchJSON(path, params) {
    const url = new URL(API_BASE + path);
    if (params) Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, v);
    });
    const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
    if (!res.ok) throw new Error('API ' + res.status);
    return res.json();
  }

  // Wrap each call to fall back to mock on failure
  async function call(path, params, mock) {
    if (!USE_MOCK) return fetchJSON(path, params);
    try {
      const data = await fetchJSON(path, params);
      if (!data || (Array.isArray(data.data) && data.data.length === 0)) {
        return mock;
      }
      return data;
    } catch (e) {
      console.info('[api] fallback to mock for', path, e.message);
      return mock;
    }
  }

  // ===== Public API =====
  const api = {
    async getSeries(params) {
      return call('/series', params, mockPaginate(MOCK_SERIES, params));
    },
    async getSeriesById(id) {
      try {
        const d = await fetchJSON('/series/' + id);
        if (d && d.data) return d;
      } catch (e) {}
      const s = MOCK_SERIES.find((x) => x.id === id) || MOCK_SERIES[0];
      return { data: enrichSeries(s) };
    },
    async getLatest() { return { data: [...MOCK_SERIES].sort((a, b) => b.year - a.year).slice(0, 20) }; },
    async getTopRated() { return { data: [...MOCK_SERIES].sort((a, b) => b.rating - a.rating).slice(0, 20) }; },
    async getMostWatched() { return { data: [...MOCK_SERIES].sort((a, b) => b.views - a.views).slice(0, 20) }; },
    async getCategories() { return { data: MOCK_CATEGORIES }; },
    async getCountries() { return { data: MOCK_COUNTRIES }; },
    async getSeasons(seriesId) {
      const s = MOCK_SERIES.find((x) => x.id === seriesId) || MOCK_SERIES[0];
      return {
        data: Array.from({ length: s.seasons_count }, (_, i) => ({
          id: `${seriesId}-s${i + 1}`,
          series_id: seriesId,
          number: i + 1,
          title: `الموسم ${i + 1}`,
          poster: '',
          episode_count: 12,
        })),
      };
    },
    async getEpisodes(seriesId, seasonId) {
      const seasonNum = Number((seasonId.match(/s(\d+)/) || [1, 1])[1]);
      return {
        data: Array.from({ length: 12 }, (_, i) => ({
          id: `${seriesId}-${seasonId}-e${i + 1}`,
          series_id: seriesId,
          season_id: seasonId,
          number: i + 1,
          title: `الحلقة ${i + 1}`,
          thumbnail: '',
          video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
          duration: 40 + (i % 10) * 3,
          views: 1000 + (i * 230) % 50000,
          release_date: new Date(Date.now() - i * 86400000 * 7).toISOString(),
        })),
      };
    },
    async getEpisode(seriesId, seasonId, episodeId) {
      const eps = await api.getEpisodes(seriesId, seasonId);
      const ep = eps.data.find((e) => e.id === episodeId) || eps.data[0];
      return { data: ep };
    },
    async getNewEpisodes() {
      const all = [];
      for (const s of MOCK_SERIES.slice(0, 8)) {
        const ep = (await api.getEpisodes(s.id, `${s.id}-s1`)).data[0];
        all.push(ep);
      }
      return { data: all };
    },
    async search(q) {
      if (!q) return { data: [] };
      const filtered = MOCK_SERIES.filter((s) => s.title.includes(q) || s.description.includes(q));
      return { data: filtered };
    },
  };

  function mockPaginate(arr, params) {
    const page = Number(params?.page || 1);
    const per = 12;
    const start = (page - 1) * per;
    return {
      data: arr.slice(start, start + per),
      meta: { current_page: page, last_page: Math.ceil(arr.length / per), total: arr.length },
    };
  }

  function enrichSeries(s) {
    return {
      ...s,
      cast: [
        { id: '1', name: 'ممثل 1', character: 'البطل', photo: '' },
        { id: '2', name: 'ممثلة 2', character: 'البطلة', photo: '' },
        { id: '3', name: 'ممثل 3', character: 'الخصم', photo: '' },
      ],
    };
  }

  window.IDLEB.api = api;
})();
