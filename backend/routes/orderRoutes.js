// backend/routes/orderRoutes.js

const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const requireAuth = require('../middleware/auth');

// All order routes require authentication
router.use(requireAuth);

router.get('/', orderController.getMyOrders);
router.get('/:id', orderController.getMyOrderById);

module.exports = router;

