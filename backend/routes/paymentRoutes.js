// backend/routes/paymentRoutes.js

const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const requireAuth = require('../middleware/auth');

// All payment routes require authentication
router.use(requireAuth);

router.post('/', paymentController.createPayment);

module.exports = router;


