// backend/db/helpers/queries/payments.js
const { query, queryOne, transaction, buildOrderClause, buildPaginationClause } = require('../queryUtils');

/**
 * Payment queries
 */

const paymentsQueries = {
  /**
   * Get all payments with order and payment method info
   * @param {Object} options - Query options (limit, offset, sortBy, order)
   * @returns {Promise<Array>} Array of payments
   */
  getAllPayments: async (options = {}) => {
    const { limit, offset, sortBy = 'payment_created', order = 'DESC' } = options;
    const orderClause = buildOrderClause(sortBy, order);
    const paginationClause = buildPaginationClause(limit, offset);

    const queryText = `
      SELECT 
        p.id,
        p.order_id,
        p.payment_method_id,
        p.payment_status,
        p.payment_price,
        p.payment_created,
        pm.payment_name,
        o.order_status,
        o.total_price AS order_total_price,
        u.email AS user_email,
        u.username AS user_username
      FROM payments p
      INNER JOIN payment_methods pm ON p.payment_method_id = pm.id
      INNER JOIN orders o ON p.order_id = o.id
      INNER JOIN users u ON o.user_id = u.id
      ${orderClause}
      ${paginationClause}
    `.trim();

    return await query(queryText);
  },

  /**
   * Get pending payments (status = 'initiated')
   * @param {Object} options - Query options (limit, offset, sortBy, order)
   * @returns {Promise<Array>} Array of pending payments
   */
  getPendingPayments: async (options = {}) => {
    const { limit, offset, sortBy = 'payment_created', order = 'DESC' } = options;
    const orderClause = buildOrderClause(sortBy, order);
    const paginationClause = buildPaginationClause(limit, offset);

    const queryText = `
      SELECT 
        p.id,
        p.order_id,
        p.payment_method_id,
        p.payment_status,
        p.payment_price,
        p.payment_created,
        pm.payment_name,
        o.order_status,
        o.total_price AS order_total_price,
        u.email AS user_email,
        u.username AS user_username
      FROM payments p
      INNER JOIN payment_methods pm ON p.payment_method_id = pm.id
      INNER JOIN orders o ON p.order_id = o.id
      INNER JOIN users u ON o.user_id = u.id
      WHERE p.payment_status = 'initiated'
      ${orderClause}
      ${paginationClause}
    `.trim();

    return await query(queryText);
  },

  /**
   * Get payment by ID
   * @param {number} paymentId - Payment ID
   * @returns {Promise<Object|null>} Payment object or null
   */
  getPaymentById: async (paymentId) => {
    const queryText = `
      SELECT 
        p.*,
        pm.payment_name,
        o.order_status,
        o.total_price AS order_total_price,
        u.email AS user_email,
        u.username AS user_username
      FROM payments p
      INNER JOIN payment_methods pm ON p.payment_method_id = pm.id
      INNER JOIN orders o ON p.order_id = o.id
      INNER JOIN users u ON o.user_id = u.id
      WHERE p.id = $1
    `;
    return await queryOne(queryText, [paymentId]);
  },

  /**
   * Find payment method by name (case-insensitive)
   * @param {string} methodName
   * @returns {Promise<Object|null>}
   */
  getPaymentMethodByName: async (methodName) => {
    const queryText = `
      SELECT id, payment_name
      FROM payment_methods
      WHERE LOWER(payment_name) = LOWER($1)
    `;
    return await queryOne(queryText, [methodName]);
  },

  /**
   * Get payment by order ID
   * @param {number} orderId - Order ID
   * @returns {Promise<Object|null>} Payment or null
   */
  getPaymentByOrderId: async (orderId) => {
    const queryText = `
      SELECT * FROM payments
      WHERE order_id = $1
      ORDER BY payment_created DESC
      LIMIT 1
    `;
    return await queryOne(queryText, [orderId]);
  },

  /**
   * Create payment record
   * @param {Object} data - payment data
   * @param {number} data.orderId
   * @param {number} data.paymentMethodId
   * @param {number} data.paymentPrice
   * @returns {Promise<Object>} Created payment
   */
  createPayment: async ({ orderId, paymentMethodId, paymentPrice }) => {
    const queryText = `
      INSERT INTO payments (order_id, payment_method_id, payment_status, payment_price)
      VALUES ($1, $2, 'initiated', $3)
      RETURNING *
    `;
    return await queryOne(queryText, [orderId, paymentMethodId, paymentPrice]);
  },

  /**
   * Update payment status
   * @param {number} paymentId - Payment ID
   * @param {string} status - New payment status
   * @returns {Promise<Object|null>} Updated payment or null
   */
  updatePaymentStatus: async (paymentId, status) => {
    const queryText = `
      UPDATE payments
      SET payment_status = $1
      WHERE id = $2
      RETURNING *
    `;
    return await queryOne(queryText, [status, paymentId]);
  },

  /**
   * Update payment status and order status in a transaction
   * @param {number} paymentId - Payment ID
   * @param {string} paymentStatus - New payment status
   * @param {number} orderId - Order ID
   * @param {string} orderStatus - New order status
   * @returns {Promise<Object|null>} Updated payment or null
   */
  updatePaymentAndOrderStatus: async (paymentId, paymentStatus, orderId, orderStatus) => {
    return await transaction(async (client) => {
      // Update payment status
      const paymentQuery = `
        UPDATE payments
        SET payment_status = $1
        WHERE id = $2
        RETURNING *
      `;
      const paymentResult = await client.query(paymentQuery, [paymentStatus, paymentId]);
      
      if (paymentResult.rows.length === 0) {
        throw new Error('Payment not found');
      }

      // Update order status if provided
      if (orderStatus) {
        const orderQuery = `
          UPDATE orders
          SET order_status = $1, updated_at = NOW()
          WHERE id = $2
          RETURNING user_id
        `;
        const orderRes = await client.query(orderQuery, [orderStatus, orderId]);
        const orderRow = orderRes.rows[0];

        // If order is now paid, grant games to user library
        if (orderStatus === 'paid' && orderRow) {
          // Fetch order items
          const itemsRes = await client.query(
            `SELECT app_id FROM order_items WHERE order_id = $1`,
            [orderId]
          );
          const appIds = itemsRes.rows.map((r) => r.app_id);

          for (const appId of appIds) {
            await client.query(
              `
                INSERT INTO user_game_library (user_id, app_id, order_id)
                VALUES ($1, $2, $3)
                ON CONFLICT (user_id, app_id) DO NOTHING
              `,
              [orderRow.user_id, appId, orderId]
            );
          }
        }
      }

      return paymentResult.rows[0];
    });
  },
};

module.exports = paymentsQueries;

