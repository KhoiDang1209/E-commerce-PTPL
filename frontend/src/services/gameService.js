import api from './api';

export const gameService = {
  getGames: async (params = {}) => {
    const response = await api.get('/games', { params });
    return response.data;
  },

  getGameById: async (appId) => {
    const response = await api.get(`/games/${appId}`);
    return response.data;
  },

  searchGamesAutocomplete: async (query, params = {}, signal = null) => {
    const config = {
      params: { q: query, ...params },
    };
    if (signal) {
      config.signal = signal;
    }
    const response = await api.get('/games/search/autocomplete', config);
    return response.data;
  },

  searchGames: async (query, params = {}, signal = null) => {
    const config = {
      params: { q: query, ...params },
    };
    if (signal) {
      config.signal = signal;
    }
    const response = await api.get('/games/search', config);
    return response.data;
  },

  getRecommendedGames: async () => {
    const response = await api.get('/games/recommended');
    return response.data;
  },

  getFeaturedGames: async () => {
    const response = await api.get('/games/featured');
    return response.data;
  },

  getDiscountedGames: async () => {
    const response = await api.get('/games/discounted');
    return response.data;
  },

  getGamesByGenre: async (genreId, params = {}) => {
    const response = await api.get(`/games/genre/${genreId}`, { params });
    return response.data;
  },

  getGamesByCategory: async (categoryId, params = {}) => {
    const response = await api.get(`/games/category/${categoryId}`, { params });
    return response.data;
  },
};
