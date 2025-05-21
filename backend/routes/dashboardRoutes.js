const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/summary', authMiddleware, dashboardController.getSummary);
router.get('/tenant-financial-summary', authMiddleware, dashboardController.getTenantFinancialSummary);

module.exports = router;
