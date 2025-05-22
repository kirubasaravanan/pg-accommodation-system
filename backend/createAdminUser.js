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
    console.log('Connected. Checking for existing admin user...');

    const existingAdmin = await User.findOne({ username: 'Admin' });
    if (existingAdmin) {
      console.log('Admin user already exists. Updating status to active if necessary.');
      if (existingAdmin.status !== 'active') {
        existingAdmin.status = 'active';
        await existingAdmin.save();
        console.log('Admin user status updated to active.');
      }
    } else {
      console.log('Admin user not found. Creating admin user...');
      // If you still want to drop the collection, uncomment the next line
      // await mongoose.connection.db.dropCollection('users').catch(() => {});
      // console.log('Dropped users collection (if it existed).');
      const user = new User({
        name: 'Admin',
        username: 'Admin', // Changed from email to username
        password: 'Admin123',
        role: 'Admin', // Ensure role is 'Admin' to match enum and logic
        status: 'active' // Set status to active
      });
      await user.save();
      console.log('Admin user created:', user);
    }
    process.exit(0);
  } catch (e) {
    console.error('Error in admin user setup:', e);
    process.exit(1);
  }
}

createAdmin();
