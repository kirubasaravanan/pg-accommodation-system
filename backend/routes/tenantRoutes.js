const express = require('express');
const { getTenants, addTenant, updateTenant, deleteTenant, allocateTenant, registerTenant, getTenantHistory, updateSecurityDeposit } = require('../controllers/tenantController');
const authenticate = require('../middleware/authMiddleware');
const router = express.Router();

router.get('/', getTenants);
router.post('/', addTenant);
router.put('/:id', authenticate, updateTenant);
router.delete('/:id', authenticate, deleteTenant);
router.post('/allocate', allocateTenant);
router.post('/register', registerTenant); // Public registration endpoint
router.get('/:id/history', getTenantHistory);
router.put('/:id/security-deposit', updateSecurityDeposit);

module.exports = router;
