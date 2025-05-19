const express = require('express');
const { getBookings, addBooking, updateBooking, deleteBooking } = require('../controllers/bookingController');
const router = express.Router();

router.get('/', getBookings);
router.post('/', addBooking);
router.put('/:id', updateBooking);
router.delete('/:id', deleteBooking);

module.exports = router;
