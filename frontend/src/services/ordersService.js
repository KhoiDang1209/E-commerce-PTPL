import api from './api';

export const ordersService = {
  getOrders: async () => {
    const response = await api.get('/orders');
    return response.data;
  },

  getOrderById: async (orderId) => {
    const response = await api.get(`/orders/${orderId}`);
    return response.data;
  },
};

