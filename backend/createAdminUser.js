// Script to create an admin user with username 'Admin' and password 'Admin123'
const mongoose = require('mongoose');
const User = require('./models/User');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

// Use remote MongoDB URI from .env or fallback
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/pg-accommodation';

async function createAdmin() {
  try {
    console.log('Connecting to MongoDB:', MONGO_URI);
    await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('Connected. Dropping users collection...');
    await mongoose.connection.db.dropCollection('users').catch(() => {});
    console.log('Dropped users collection. Creating admin user...');
    const user = new User({
      name: 'Admin',
      email: 'Admin',
      password: 'Admin123',
      role: 'admin',
    });
    await user.save();
    console.log('Admin user created:', user);
    process.exit(0);
  } catch (e) {
    console.error('Error creating admin user:', e);
    process.exit(1);
  }
}

createAdmin();
