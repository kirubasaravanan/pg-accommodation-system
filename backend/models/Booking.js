const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema({
  tenant: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
  room: { type: String, required: true }, // or ref: 'Room' if you want
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  accommodationType: { type: String, enum: ['monthly', 'daily'], default: 'monthly' },
  rentAmount: { type: Number, required: true },
  rentPaidStatus: { type: String, enum: ['paid', 'due', 'partial'], default: 'due' },
  status: { type: String, enum: ['Active', 'Upcoming', 'Completed', 'Vacated', 'Cancelled'], default: 'Upcoming' }, // New status field
  rentDueDate: { type: Date },
  rentPaymentDate: { type: Date },
  rentDetails: {
    rentType: { type: String, enum: ['daily', 'monthly'] }, // Added to distinguish
    dailyRate: Number,
    numberOfDays: Number,
    monthlyRate: Number,        // Added for monthly bookings
    numberOfMonths: Number,     // Added for monthly bookings
    calculatedRent: Number,     // Rent calculated by system (rate * units)
    customRentProvided: Number, // The custom rent value if provided by user
    finalRentAmount: Number,    // The actual rent amount for this booking (either calculated or custom)
    proRated: { type: Boolean, default: false },
    originalMonthlyRate: Number, // Full monthly rate if proRated
    daysInPartialMonth: Number,  // Days charged for if proRated
    totalDaysInBillingMonth: Number, // Total days in the month for pro-ration context
  },
  notes: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Booking', BookingSchema);
