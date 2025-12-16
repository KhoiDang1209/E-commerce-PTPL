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

  // 🔥 [THÊM] Hàm mới: Lấy danh sách đơn hàng gần đây
  getRecentOrders: async () => {
    const response = await api.get('/admin/recent-orders');
    return response.data; // { success, data: [...] }
  },

  // Get all orders
  getAllOrders: async (params = {}) => {
    const response = await api.get('/admin/orders', { params });
    return response.data;
  },

  // Get pending payments
  getPendingPayments: async (params = {}) => {
    const response = await api.get('/admin/payments/pending', { params });
    return response.data;
  },

  // Update payment status
  updatePaymentStatus: async (paymentId, payment_status) => {
    const response = await api.put(`/admin/payments/${paymentId}/status`, { payment_status });
    return response.data;
  },

  // Get all users
  getAllUsers: async (params = {}) => {
    const response = await api.get('/admin/users', { params });
    return response.data;
  },

  // Get all games
  getAllGames: async (params = {}) => {
    const response = await api.get('/admin/games', { params });
    return response.data;
  },

};
