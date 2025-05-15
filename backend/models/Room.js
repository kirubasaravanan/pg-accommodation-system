const mongoose = require('mongoose');

const RoomSchema = new mongoose.Schema({
  name: { type: String, required: true },
  location: { type: String, required: true },
  price: { type: Number, required: true },
  type: { type: String, enum: ['private', '2-sharing', '3-sharing', '4-sharing', '5-sharing'], required: true },
  occupancy: {
    current: { type: Number, default: 0 },
    max: { type: Number, required: true },
  },
  isBooked: { type: Boolean, default: false },
});

module.exports = mongoose.model('Room', RoomSchema);