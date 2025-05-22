const express = require('express');
const router = express.Router();
const {
  createRoomConfigurationType,
  getRoomConfigurationTypes,
  getRoomConfigurationTypeById,
  updateRoomConfigurationType,
  deleteRoomConfigurationType,
} = require('../controllers/roomConfigurationTypeController');
const { protect, admin } = require('../middleware/authMiddleware'); // Assuming you have admin middleware

// Route to create a new room configuration type and get all types
router
  .route('/')
  .post(protect, admin, createRoomConfigurationType) // Only admin can create
  .get(protect, admin, getRoomConfigurationTypes);    // Only admin can view all

// Route to get, update, and delete a specific room configuration type by ID
router
  .route('/:id')
  .get(protect, admin, getRoomConfigurationTypeById)    // Only admin can view by ID
  .put(protect, admin, updateRoomConfigurationType)     // Only admin can update
  .delete(protect, admin, deleteRoomConfigurationType); // Only admin can delete

module.exports = router;
