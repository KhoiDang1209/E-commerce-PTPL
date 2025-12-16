// backend/controllers/paymentController.js

const queries = require('../db/helpers/queries');
const { sendSuccess, sendError } = require('../utils/response');

/**
 * Create a payment for an existing order
 * POST /api/payments
 */
const createPayment = async (req, res) => {
  try {
    const userId = req.user.id;
    const isAdmin = req.user?.role === 'admin';
    const { orderId, paymentMethod } = req.body || {};

    if (!orderId || !paymentMethod) {
      return sendError(res, 'orderId and paymentMethod are required', 'VALIDATION_ERROR', 400);
    }

    const order = await queries.orders.getOrderById(orderId);
    if (!order) {
      return sendError(res, 'Order not found', 'NOT_FOUND', 404);
    }

    if (!isAdmin && order.user_id !== userId) {
      return sendError(res, 'Access denied', 'ACCESS_DENIED', 403);
    }

    if (order.order_status !== 'pending') {
      return sendError(res, 'Order is not payable', 'INVALID_STATUS', 400);
    }

    const paymentMethodRow = await queries.payments.getPaymentMethodByName(paymentMethod);
    if (!paymentMethodRow) {
      return sendError(res, 'Payment method not supported', 'PAYMENT_METHOD_NOT_FOUND', 400);
    }

    const existingPayment = await queries.payments.getPaymentByOrderId(orderId);
    if (existingPayment) {
      // If payment already initiated, return it; otherwise block duplicate creation.
      if (existingPayment.payment_status === 'initiated') {
        return sendSuccess(res, { payment: existingPayment }, 'Payment already initiated for this order');
      }
      return sendError(res, 'Payment already exists for this order', 'PAYMENT_EXISTS', 400);
    }

    const payment = await queries.payments.createPayment({
      orderId: order.id,
      paymentMethodId: paymentMethodRow.id,
      paymentPrice: order.total_price,
    });

    return sendSuccess(res, { payment }, 'Payment created');
  } catch (error) {
    console.error('Create payment error:', error);
    return sendError(res, 'Internal server error', 'INTERNAL_ERROR', 500);
  }
};

module.exports = {
  createPayment,
};


