const express = require('express');
const { register, login, getMe } = require('../controllers/authController'); // Added getMe
const { protect } = require('../middleware/authMiddleware'); // Import protect middleware
const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe); // Added protected /me route

module.exports = router;