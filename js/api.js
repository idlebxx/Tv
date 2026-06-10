/* ============================================
   api.js — fetch wrapper with REAL API support
============================================ */

(function () {
  'use strict';

  const { API_BASE, USE_MOCK } = window.IDLEB_CONFIG;

  // تحويل رابط الصورة إلى رابط كامل
  function getFullImageUrl(path) {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    return `https://admin.dramaramadan.net${path}`;
  }

  async function fetchJSON(path, params) {
    const url = new URL(API_BASE + path);
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, v);
      });
    }
    
    try {
      const res = await fetch(url, { 
        headers: { 
          'Accept': 'application/json',
          'User-Agent': 'okhttp/4.12.0'
        },
        mode: 'cors'
      });
      if (!res.ok) throw new Error('API ' + res.status);
      const data = await res.json();
      return data;
    } catch (e) {
      console.warn('[api] fetch error:', e.message);
      throw e;
    }
  }

  // تحويل بيانات المسلسل من API إلى الشكل المطلوب
  function transformSeries(item) {
    return {
      id: String(item.id),
      title: item.title_ar || item.title || 'بدون عنوان',
      title_en: item.title_en || '',
      description: item.story || item.description || 'لا يوجد وصف',
      poster: getFullImageUrl(item.poster),
      backdrop: getFullImageUrl(item.banner) || getFullImageUrl(item.poster),
      rating: parseFloat(item.rating) || 0,
      year: item.release_year || new Date().getFullYear(),
      country: item.country || '',
      categories: item.genres || [],
      seasons_count: item.seasons_count || 1,
      views: item.views_count || 0,
      status: item.status || 'completed',
      episode_count: item.episode_count || 0,
      release_date: item.release_date || '',
    };
  }

  // ===== Public API =====
  const api = {
    // جلب المسلسلات مع فلتر
    async getSeries(params = {}) {
      try {
        const defaultParams = {
          page: params.page || 1,
          limit: params.limit || 20,
          app_version: '9',
          sort_by: params.sort_by || 'newest'
        };
        if (params.genre) defaultParams.genre = params.genre;
        
        const response = await fetchJSON('/series/', defaultParams);
        if (response && response.status === 'success' && response.data) {
          return {
            data: response.data.map(transformSeries),
            meta: response.meta || { current_page: 1, last_page: 1, total: response.data.length }
          };
        }
        return { data: [], meta: { total: 0 } };
      } catch (e) {
        console.error('[api] getSeries error:', e);
        return { data: [], meta: { total: 0 } };
      }
    },

    // جلب مسلسل بواسطة ID
    async getSeriesById(id) {
      try {
        // تجربة جلب مسلسل واحد أولاً
        const response = await fetchJSON('/series/' + id);
        if (response && response.status === 'success' && response.data) {
          return { data: transformSeries(response.data) };
        }
        throw new Error('Series not found');
      } catch (e) {
        // إذا فشل، نجيب من القائمة العامة
        const all = await this.getSeries({ limit: 100 });
        const found = all.data.find(s => s.id === id);
        if (found) return { data: found };
        return null;
      }
    },

    // أحدث المسلسلات
    async getLatest() {
      return this.getSeries({ sort_by: 'newest', limit: 20 });
    },

    // الأعلى تقييماً
    async getTopRated() {
      return this.getSeries({ sort_by: 'top_rated', limit: 20 });
    },

    // الأكثر مشاهدة
    async getMostWatched() {
      return this.getSeries({ sort_by: 'most_viewed', limit: 20 });
    },

    // أحدث حلقة
    async getLatestEpisode() {
      return this.getSeries({ sort_by: 'latest_episode', limit: 20 });
    },

    // جلب المسلسلات حسب التصنيف
    async getByGenre(genre, limit = 20) {
      try {
        const all = await this.getSeries({ limit: 100 });
        const filtered = all.data.filter(s => 
          s.categories && s.categories.some(c => 
            c.toLowerCase().includes(genre.toLowerCase())
          )
        );
        return { data: filtered.slice(0, limit), meta: { total: filtered.length } };
      } catch (e) {
        return { data: [], meta: { total: 0 } };
      }
    },

    // جلب المواسم لمسلسل
    async getSeasons(seriesId) {
      try {
        const response = await fetchJSON('/seasons/', { series_id: seriesId, app_version: '9' });
        if (response && response.status === 'success' && response.data) {
          return {
            data: response.data.map(s => ({
              id: String(s.id),
              series_id: String(s.series_id),
              number: s.season_number || 1,
              title: `الموسم ${s.season_number || 1}`,
              poster: getFullImageUrl(s.poster),
              episode_count: s.episode_count || 0
            }))
          };
        }
      } catch (e) {}
      return { data: [{ id: seriesId, series_id: seriesId, number: 1, title: 'الموسم 1', episode_count: 0 }] };
    },

    // جلب حلقات موسم
    async getEpisodes(seriesId, seasonId) {
      try {
        const response = await fetchJSON('/episodes/', { season_id: seasonId, app_version: '9' });
        if (response && response.status === 'success' && response.data) {
          return {
            data: response.data.map(e => ({
              id: String(e.id),
              series_id: String(e.series_id),
              season_id: String(e.season_id),
              number: e.episode_number || 1,
              title: `الحلقة ${e.episode_number || 1}`,
              thumbnail: getFullImageUrl(e.thumbnail),
              video_url: null, // سيتم جلبها من endpoint منفصل
              duration: e.duration || 45,
              views: e.views_count || 0,
              release_date: e.release_date || new Date().toISOString()
            }))
          };
        }
      } catch (e) {}
      return { data: [] };
    },

    // جلب روابط المشاهدة لحلقة
    async getWatchLinks(episodeId) {
      try {
        const url = `https://admin.dramaramadan.net/api/episodes/show.php?id=${episodeId}`;
        const response = await fetch(url, {
          headers: { 'User-Agent': 'okhttp/4.12.0' }
        });
        if (response.ok) {
          const data = await response.json();
          if (data && data.status === 'success' && data.data && data.data.watch_links) {
            return data.data.watch_links.map(link => ({
              quality: link.quality || 'HD',
              url: link.url
            }));
          }
        }
      } catch (e) {}
      return [];
    },

    // البحث
    async search(query) {
      if (!query) return { data: [] };
      try {
        const all = await this.getSeries({ limit: 100 });
        const filtered = all.data.filter(s => 
          s.title.toLowerCase().includes(query.toLowerCase()) ||
          (s.title_en && s.title_en.toLowerCase().includes(query.toLowerCase())) ||
          (s.description && s.description.toLowerCase().includes(query.toLowerCase()))
        );
        return { data: filtered };
      } catch (e) {
        return { data: [] };
      }
    },

    // جلب التصنيفات (من المسلسلات)
    async getCategories() {
      try {
        const all = await this.getSeries({ limit: 100 });
        const catMap = new Map();
        all.data.forEach(s => {
          if (s.categories) {
            s.categories.forEach(c => {
              catMap.set(c, (catMap.get(c) || 0) + 1);
            });
          }
        });
        const categories = Array.from(catMap.entries()).map(([name, count]) => ({
          id: name.replace(/\s/g, '_'),
          name: name,
          count: count
        }));
        return { data: categories.slice(0, 20) };
      } catch (e) {
        return { data: [] };
      }
    },

    // جلب الدول (من المسلسلات)
    async getCountries() {
      try {
        const all = await this.getSeries({ limit: 100 });
        const countryMap = new Map();
        all.data.forEach(s => {
          if (s.country) {
            countryMap.set(s.country, (countryMap.get(s.country) || 0) + 1);
          }
        });
        const countries = Array.from(countryMap.entries()).map(([name, count]) => ({
          code: name.substring(0, 2).toUpperCase(),
          name: name,
          count: count
        }));
        return { data: countries };
      } catch (e) {
        return { data: [] };
      }
    },

    // الحلقات الجديدة
    async getNewEpisodes() {
      return this.getLatestEpisode();
    }
  };

  window.IDLEB.api = api;
})();
