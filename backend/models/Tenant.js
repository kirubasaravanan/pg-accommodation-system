const mongoose = require('mongoose');

const TenantSchema = new mongoose.Schema({
  name: { type: String, required: true },
  contact: { type: String, required: true, unique: true },
  email: { type: String, required: true },
  room: { type: String, default: '' }, // room name or id
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
  moveInDate: { type: Date },
  moveOutDate: { type: Date },
  accommodationType: { type: String, enum: ['monthly', 'daily'], default: 'monthly' },
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
