import api from './api';

export const adminService = {
  login: async (credentials) => {
    const response = await api.post('/admin/login', credentials);
    return response.data;
  },

  // Get dashboard statistics (uses session-based auth)
  getDashboardStats: async () => {
    const response = await api.get('/admin/stats');
    // Trả về { orders: number, users: number, games: number }
    return response.data; 
  },
};
