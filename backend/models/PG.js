const mongoose = require('mongoose');

const PGSchema = new mongoose.Schema({
  name: { type: String, required: true },
  location: { type: String, required: true },
  price: { type: Number, required: true },
  amenities: [String],
});

module.exports = mongoose.model('PG', PGSchema);