const mongoose = require('mongoose');

const RoomSchema = new mongoose.Schema({
  name: { type: String, required: true },
  location: { type: String, required: true },
  price: { type: Number, required: true },
  type: { type: String, enum: ['Private Mini', 'Private', 'Double Occupancy', 'Triple Occupancy', 'Four Occupancy', 'Five Occupancy'], required: true },
  occupancy: {
    current: { type: Number, default: 0 },
    max: { type: Number, required: true },
  },
  isBooked: { type: Boolean, default: false },
  blocked: { type: Boolean, default: false }, // New field to indicate if the room is blocked
});

module.exports = mongoose.model('Room', RoomSchema);