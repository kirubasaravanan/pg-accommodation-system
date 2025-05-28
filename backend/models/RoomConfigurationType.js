const mongoose = require('mongoose');

const roomConfigurationTypeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Configuration name is required.'],
    trim: true,
    unique: true,
  },
  baseSharingCapacity: {
    type: Number,
    required: [true, 'Base sharing capacity is required.'],
    min: [1, 'Base sharing capacity must be at least 1.'],
  },
  baseRent: {
    type: Number,
    required: [true, 'Base rent is required.'],
    min: [0, 'Base rent cannot be negative.'],
  },
  isConvertible: {
    type: Boolean,
    default: false,
  },
  convertedSharingCapacity: {
    type: Number,
    min: [1, 'Converted sharing capacity must be at least 1.'],
    // Required if isConvertible is true
    validate: {
      validator: function (value) {
        return !this.isConvertible || (this.isConvertible && typeof value === 'number');
      },
      message: 'Converted sharing capacity is required if the room type is convertible.',
    },
  },
  convertedRent: {
    type: Number,
    min: [0, 'Converted rent cannot be negative.'],
    // Required if isConvertible is true
    validate: {
      validator: function (value) {
        return !this.isConvertible || (this.isConvertible && typeof value === 'number');
      },
      message: 'Converted rent is required if the room type is convertible.',
    },
  },
  acStatus: {
    type: String,
    required: [true, 'AC status is required.'],
    enum: {
      values: ['AC (Standard)', 'AC (Customizable)', 'Non-AC (Standard)', 'Non-AC (Cooler Space)'],
      message: '{VALUE} is not a supported AC status.',
    },
  },
  dailyRate: {
    type: Number,
    default: 0,
  },
  description: {
    type: String,
    trim: true,
  },
  categoryName: {
    type: String,
    trim: true,
    // Optional: Add enum if you want to restrict values from a predefined list on the backend as well
    // enum: ["Private Mini", "Private Room", "Double Occupancy", "Three Occupancy", "Four Occupancy", "Five Occupancy"],
  },
}, { timestamps: true });

// Middleware to ensure converted fields are present if isConvertible is true
roomConfigurationTypeSchema.pre('save', function (next) {
  if (this.isConvertible) {
    if (this.convertedSharingCapacity == null) {
      this.invalidate('convertedSharingCapacity', 'Converted sharing capacity is required when isConvertible is true.');
    }
    if (this.convertedRent == null) {
      this.invalidate('convertedRent', 'Converted rent is required when isConvertible is true.');
    }
  }
  next();
});

module.exports = mongoose.model('RoomConfigurationType', roomConfigurationTypeSchema);
