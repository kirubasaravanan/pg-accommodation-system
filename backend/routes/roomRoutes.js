const express = require('express');
const { getRooms, addRoom } = require('../controllers/roomController');
const router = express.Router();

router.get('/', getRooms);
router.post('/', addRoom);

module.exports = router;