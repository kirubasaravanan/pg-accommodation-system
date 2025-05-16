const mongoose = require('mongoose');

const RoomSchema = new mongoose.Schema({
  name: { type: String, required: true },
  location: { type: String, required: true },
  price: { type: Number, required: true },
  type: { type: String, enum: ['2 Sharing', '3Sharing', '5sharing', '3/4sharing', '1/2sharing', 'Private'], required: true },
  occupancy: {
    current: { type: Number, default: 0 },
    max: { type: Number, required: true },
  },
  isBooked: { type: Boolean, default: false },
  blocked: { type: Boolean, default: false }, // New field to indicate if the room is blocked
});

module.exports = mongoose.model('Room', RoomSchema);