const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: false, // Name is not always required, e.g., for a system admin
  },
  username: { // Changed from email to username
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true, // Optional: usernames are often case-insensitive
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['Admin', 'Manager', 'Staff', 'Accountant', 'Tenant'], // Added new roles
    default: 'Tenant',
  },
  status: { // Added status field
    type: String,
    enum: ['active', 'blocked', 'inactive'],
    default: 'active', // Default to active, can be overridden during creation
  },
}, { timestamps: true });

// Pre-save hook to hash password before saving
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password for login
UserSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);