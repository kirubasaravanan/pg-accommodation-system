const mongoose = require('mongoose');

const TenantSchema = new mongoose.Schema({
  name: { type: String, required: true },
  contact: { type: String, required: true, unique: true },
  email: { type: String, required: true },
  aadharNumber: { type: String, unique: true, sparse: true }, // Added Aadhar Number
  dob: { type: Date }, // Added Date of Birth
  bedNumber: { type: String }, // Added Bed Number (e.g., "1", "A1")
  room: { type: String, default: '' }, // room name or id
  status: { type: String, enum: ['Active', 'Inactive', 'Pending Allocation'], default: 'Active' }, // Added 'Pending Allocation'
  moveInDate: { type: Date },
  moveOutDate: { type: Date },
  intendedVacationDate: { type: Date, default: null }, // New field for notice of vacation
  accommodationType: { type: String, enum: ['monthly', 'daily'], default: 'monthly' },
  monthlyRentCyclePreference: { type: String, enum: ['moveInDate', 'calendarMonth'], default: 'moveInDate' }, // Added field
  estimatedMonthlyDailyStays: { type: Number, default: 0 }, // Added for forecasting
  rentPaidStatus: { type: String, enum: ['paid', 'due', 'partial'], default: 'due' },
  rentDueDate: { type: Date },
  rentPaymentDate: { type: Date },
  securityDeposit: {
    amount: { type: Number, default: 0 },
    refundableType: { type: String, enum: ['fully', 'partial', 'non-refundable'], default: 'fully' },
    conditions: { type: String, default: '' },
  },
});

module.exports = mongoose.model('Tenant', TenantSchema);
