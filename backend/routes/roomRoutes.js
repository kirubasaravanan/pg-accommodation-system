const express = require('express');
const { getRooms, addRoom, updateRoom, deleteRoom, getRoomById, getAvailableRooms, getAvailableRoomTypes } = require('../controllers/roomController');
const authenticate = require('../middleware/authMiddleware');
const router = express.Router();

router.get('/available', getAvailableRooms);
router.get('/available-types', getAvailableRoomTypes);
router.get('/:id', getRoomById);
router.get('/', getRooms);
router.post('/', addRoom);
router.put('/:id', authenticate, updateRoom);
router.delete('/:id', authenticate, deleteRoom);

module.exports = router;