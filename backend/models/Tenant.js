const mongoose = require('mongoose');

const BookingHistorySchema = new mongoose.Schema({
  room: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  rentPaidStatus: { type: String, enum: ['paid', 'due', 'partial'], default: 'due' },
  rentDueDate: { type: Date },
  rentPaymentDate: { type: Date },
}, { _id: false });

const TenantSchema = new mongoose.Schema({
  name: { type: String, required: true },
  contact: { type: String, required: true, unique: true },
  email: { type: String, required: true },
  room: { type: String, default: '' }, // room name or id
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
  moveInDate: { type: Date },
  moveOutDate: { type: Date },
  accommodationType: { type: String, enum: ['monthly', 'daily'], default: 'monthly' },
  bookingHistory: [BookingHistorySchema],
  rentPaidStatus: { type: String, enum: ['paid', 'due', 'partial'], default: 'due' },
  rentDueDate: { type: Date },
  rentPaymentDate: { type: Date },
});

module.exports = mongoose.model('Tenant', TenantSchema);
