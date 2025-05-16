const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema({
  tenant: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
  room: { type: String, required: true }, // or ref: 'Room' if you want
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  accommodationType: { type: String, enum: ['monthly', 'daily'], default: 'monthly' },
  rentAmount: { type: Number, required: true },
  customRent: { type: Number }, // Optional per-tenant rent concession
  rentPaidStatus: { type: String, enum: ['paid', 'due', 'partial'], default: 'due' },
  rentDueDate: { type: Date },
  rentPaymentDate: { type: Date },
  securityDeposit: { type: Number, default: 0 },
  notes: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Booking', BookingSchema);
