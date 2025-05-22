const express = require('express');
const { getTenants, addTenant, updateTenant, deleteTenant, allocateTenant, registerTenantV2, getTenantHistory, updateSecurityDeposit, allocateRoomToTenant } = require('../controllers/tenantController');
const { protect, admin } = require('../middleware/authMiddleware');
const router = express.Router();

router.get('/', protect, getTenants);
router.post('/', protect, addTenant);
router.put('/:id', protect, updateTenant);
router.delete('/:id', protect, deleteTenant);
router.post('/allocate', protect, admin, allocateTenant);
router.post('/register', protect, registerTenantV2);
router.post('/allocate-room', protect, admin, allocateRoomToTenant);
router.get('/:id/history', protect, getTenantHistory);
router.put('/:id/security-deposit', protect, updateSecurityDeposit);

module.exports = router;
