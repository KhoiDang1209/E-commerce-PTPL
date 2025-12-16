const express = require('express');
const adminController = require('../controllers/adminController');
const router = express.Router();

const requireAdmin = require('../middleware/requireAdmin'); // Giả định tên middleware

router.post('/login', adminController.login);

// 🔥 [CẬP NHẬT] Tuyến đường mới: Lấy số liệu thống kê dashboard, yêu cầu quyền admin
router.get('/stats', requireAdmin, adminController.getStats);
// 🔥 [THÊM] Tuyến đường mới: Lấy danh sách đơn hàng gần đây
router.get('/recent-orders', requireAdmin, adminController.getRecentOrders);
// Get all orders
router.get('/orders', requireAdmin, adminController.getAllOrders);
// Get all users
router.get('/users', requireAdmin, adminController.getAllUsers);
// Get all games
router.get('/games', requireAdmin, adminController.getAllGames);
// Get pending payments
router.get('/payments/pending', requireAdmin, adminController.getPendingPayments);
// Update payment status
router.put('/payments/:id/status', requireAdmin, adminController.updatePaymentStatus);

module.exports = router;