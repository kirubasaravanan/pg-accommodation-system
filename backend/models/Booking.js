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
  rentDetails: {
    dailyRate: Number,
    numberOfDays: Number,
    totalRent: Number,
  },
  securityDeposit: {
    amount: Number,
    refundableType: { type: String, enum: ['fully', 'partial', 'non-refundable'], default: 'fully' },
    conditions: String,
  },
  notes: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Booking', BookingSchema);
