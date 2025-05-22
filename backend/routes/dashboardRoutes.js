const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { protect, admin } = require('../middleware/authMiddleware'); // Correctly import protect and admin

// Assuming dashboard routes require at least login, and potentially admin for some
// For now, let's apply protect to all, and admin if it seems appropriate (can be refined)
router.get('/summary', protect, dashboardController.getSummary);
router.get('/tenant-financial-summary', protect, dashboardController.getTenantFinancialSummary);
// If these were admin-only, it would be: protect, admin, dashboardController.getSummary

module.exports = router;
