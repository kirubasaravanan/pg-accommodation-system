const express = require('express');
const { getRooms, addRoom, updateRoom, deleteRoom, getRoomById, getAvailableRooms, getAvailableRoomTypes } = require('../controllers/roomController');
const { protect } = require('../middleware/authMiddleware');
const router = express.Router();

router.get('/available', getAvailableRooms);
router.get('/available-types', getAvailableRoomTypes);
router.get('/:id', getRoomById);
router.get('/', getRooms);
router.post('/', protect, addRoom);
router.put('/:id', protect, updateRoom);
router.delete('/:id', protect, deleteRoom);

module.exports = router;