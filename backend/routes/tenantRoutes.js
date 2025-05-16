const express = require('express');
const { getTenants, addTenant, updateTenant, deleteTenant } = require('../controllers/tenantController');
const authenticate = require('../middleware/authMiddleware');
const router = express.Router();

router.get('/', getTenants);
router.post('/', addTenant);
router.put('/:id', authenticate, updateTenant);
router.delete('/:id', authenticate, deleteTenant);

module.exports = router;
