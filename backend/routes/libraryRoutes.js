// backend/routes/libraryRoutes.js

const express = require('express');
const router = express.Router();
const libraryController = require('../controllers/libraryController');
const requireAuth = require('../middleware/auth');

// All library routes require authentication
router.use(requireAuth);

router.get('/', libraryController.getLibrary);

module.exports = router;


