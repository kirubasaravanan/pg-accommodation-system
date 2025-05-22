const mongoose = require('mongoose');

const RoomSchema = new mongoose.Schema({
  name: { type: String, required: true },
  location: { type: String, required: true },
  price: { type: Number, required: true }, // Actual current rent for this room
  type: { 
    type: String, 
    enum: ['Private Mini', 'Private', 'Double Occupancy', 'Triple Occupancy', 'Four Occupancy', 'Five Occupancy'], 
    required: false // No longer strictly required if roomConfigurationType is used
  },
  occupancy: {
    current: { type: Number, default: 0 },
    max: { type: Number, required: true }, // Actual current max occupancy for this room
  },
  isBooked: { type: Boolean, default: false },
  blocked: { type: Boolean, default: false }, // Existing field to indicate if the room is blocked
  roomConfigurationType: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'RoomConfigurationType', 
    required: false 
  },
}, { timestamps: true }); // Added timestamps for createdAt and updatedAt

module.exports = mongoose.model('Room', RoomSchema);