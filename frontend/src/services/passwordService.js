import api from './api';

/**
 * Change user password
 * @param {Object} payload - { currentPassword, newPassword, rePassword }
 * @returns {Promise<Object>} API response
 */
export const changePassword = async (payload) => {
  try {
    const response = await api.post('/auth/change-password', payload);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export default { changePassword };