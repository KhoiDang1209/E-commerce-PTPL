// backend/db/helpers/queries/coupons.js
const { query, queryOne } = require('../queryUtils');

/**
 * Coupon queries
 */

const couponsQueries = {
  /**
   * Get all coupons
   * @returns {Promise<Array>} Array of coupons
   */
  getAllCoupons: async () => {
    const queryText = 'SELECT * FROM coupons ORDER BY code';
    return await query(queryText);
  },

  /**
   * Get coupon by ID
   * @param {number} couponId - Coupon ID
   * @returns {Promise<Object|null>} Coupon object or null
   */
  getCouponById: async (couponId) => {
    const queryText = 'SELECT * FROM coupons WHERE id = $1';
    return await queryOne(queryText, [couponId]);
  },

  /**
   * Get coupon by code
   * @param {string} code - Coupon code
   * @returns {Promise<Object|null>} Coupon object or null
   */
  getCouponByCode: async (code) => {
    const queryText = 'SELECT * FROM coupons WHERE code = $1';
    return await queryOne(queryText, [code]);
  },

  /**
   * Create coupon
   * @param {Object} couponData - Coupon data
   * @returns {Promise<Object>} Created coupon
   */
  createCoupon: async (couponData) => {
    const { code, discount_type, value } = couponData;
    const queryText = `
      INSERT INTO coupons (code, discount_type, value)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    return await queryOne(queryText, [code, discount_type, value]);
  },

  /**
   * Check if user has used coupon
   * @param {number} userId - User ID
   * @param {number} couponId - Coupon ID
   * @returns {Promise<boolean>} True if used
   */
  hasUserUsedCoupon: async (userId, couponId) => {
    const queryText = 'SELECT id FROM user_coupon_usage WHERE user_id = $1 AND coupon_id = $2';
    const result = await queryOne(queryText, [userId, couponId]);
    return result !== null;
  },

  /**
   * Record coupon usage
   * @param {number} userId - User ID
   * @param {number} couponId - Coupon ID
   * @param {number} orderId - Order ID
   * @returns {Promise<Object>} Usage record
   */
  recordCouponUsage: async (userId, couponId, orderId) => {
    const queryText = `
      INSERT INTO user_coupon_usage (user_id, coupon_id, order_id)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    return await queryOne(queryText, [userId, couponId, orderId]);
  },

  /**
   * Calculate discount amount
   * @param {Object} coupon - Coupon object
   * @param {number} totalPrice - Total price
   * @returns {number} Discount amount
   */
  calculateDiscount: (coupon, totalPrice) => {
    if (coupon.discount_type === 'percentage') {
      return (totalPrice * coupon.value) / 100;
    } else if (coupon.discount_type === 'fixed_amount') {
      return Math.min(coupon.value, totalPrice);
    }
    return 0;
  },
};

module.exports = couponsQueries;

