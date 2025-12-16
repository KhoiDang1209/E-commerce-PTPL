import api from './api';

export const paymentService = {
  createPayment: async ({ orderId, paymentMethod }) => {
    const response = await api.post('/payments', { orderId, paymentMethod });
    return response.data;
  },
};


