const express = require('express');
const { getRooms, addRoom, updateRoom, deleteRoom } = require('../controllers/roomController');
const authenticate = require('../middleware/authMiddleware');
const router = express.Router();

router.get('/', getRooms);
router.post('/', addRoom);
router.put('/:id', authenticate, updateRoom);
router.delete('/:id', authenticate, deleteRoom);

module.exports = router;