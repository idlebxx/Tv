/* ============================================
   api.js — fetch wrapper with AllOrigins Proxy
============================================ */

(function () {
  'use strict';

  let { API_BASE, USE_MOCK } = window.IDLEB_CONFIG;

  function getFullImageUrl(path) {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    return `https://admin.dramaramadan.net${path}`;
  }

  async function fetchJSON(path, params) {
    let baseUrl = API_BASE + path;
    
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') searchParams.append(k, v);
      });
      const queryString = searchParams.toString();
      if (queryString) baseUrl += '?' + queryString;
    }
    
    console.log('[api] Fetching:', baseUrl);
    
    try {
      const res = await fetch(baseUrl, { 
        headers: { 
          'Accept': 'application/json',
          'User-Agent': 'okhttp/4.12.0'
        }
      });
      
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      let data = await res.json();
      
      // AllOrigins يلف البيانات في خاصية contents
      if (data.contents) {
        data = JSON.parse(data.contents);
      }
      
      return data;
    } catch (e) {
      console.warn('[api] fetch error:', e.message);
      throw e;
    }
  }

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

  const api = {
    async getSeries(params = {}) {
      try {
        const defaultParams = {
          page: params.page || 1,
          limit: params.limit || 20,
          app_version: '9',
          sort_by: params.sort_by || 'newest'
        };
        
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

    async getSeriesById(id) {
      try {
        const response = await fetchJSON('/series/' + id);
        if (response && response.status === 'success' && response.data) {
          return { data: transformSeries(response.data) };
        }
        throw new Error('Series not found');
      } catch (e) {
        const all = await this.getSeries({ limit: 100 });
        const found = all.data.find(s => s.id === id);
        if (found) return { data: found };
        return null;
      }
    },

    async getLatest() {
      return this.getSeries({ sort_by: 'newest', limit: 20 });
    },

    async getTopRated() {
      return this.getSeries({ sort_by: 'top_rated', limit: 20 });
    },

    async getMostWatched() {
      return this.getSeries({ sort_by: 'most_viewed', limit: 20 });
    },

    async getLatestEpisode() {
      return this.getSeries({ sort_by: 'latest_episode', limit: 20 });
    },

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
              video_url: null,
              duration: e.duration || 45,
              views: e.views_count || 0,
              release_date: e.release_date || new Date().toISOString()
            }))
          };
        }
      } catch (e) {}
      return { data: [] };
    },

    async getWatchLinks(episodeId) {
      try {
        const proxyUrl = 'https://api.allorigins.win/raw?url=';
        const targetUrl = `https://admin.dramaramadan.net/api/episodes/show.php?id=${episodeId}`;
        const url = proxyUrl + encodeURIComponent(targetUrl);
        
        const response = await fetch(url, {
          headers: { 
            'User-Agent': 'okhttp/4.12.0',
            'Accept': 'application/json'
          }
        });
        
        if (response.ok) {
          let data = await response.json();
          if (data.contents) {
            data = JSON.parse(data.contents);
          }
          if (data && data.status === 'success' && data.data && data.data.watch_links) {
            return data.data.watch_links.map(link => ({
              quality: link.quality || 'HD',
              url: link.url
            }));
          }
        }
      } catch (e) {
        console.error('[api] Error getting watch links:', e);
      }
      return [];
    },

    async search(query) {
      if (!query) return { data: [] };
      try {
        const all = await this.getSeries({ limit: 100 });
        const filtered = all.data.filter(s => 
          s.title.toLowerCase().includes(query.toLowerCase()) ||
          (s.title_en && s.title_en.toLowerCase().includes(query.toLowerCase()))
        );
        return { data: filtered };
      } catch (e) {
        return { data: [] };
      }
    },

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
        return { data: Array.from(catMap.entries()).map(([name, count]) => ({
          id: name.replace(/\s/g, '_'),
          name: name,
          count: count
        })) };
      } catch (e) {
        return { data: [] };
      }
    },

    async getCountries() {
      try {
        const all = await this.getSeries({ limit: 100 });
        const countryMap = new Map();
        all.data.forEach(s => {
          if (s.country) {
            countryMap.set(s.country, (countryMap.get(s.country) || 0) + 1);
          }
        });
        return { data: Array.from(countryMap.entries()).map(([name, count]) => ({
          code: name.substring(0, 2).toUpperCase(),
          name: name,
          count: count
        })) };
      } catch (e) {
        return { data: [] };
      }
    },

    async getNewEpisodes() {
      return this.getLatestEpisode();
    }
  };

  window.IDLEB.api = api;
})();
