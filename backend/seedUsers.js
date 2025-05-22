// c:\\Users\\user\\pg-accommodation-system\\backend\\seedUsers.js
const mongoose = require('mongoose');
const User = require('./models/User'); // Adjusted path
const dotenv = require('dotenv');

// Load environment variables from .env file in the backend directory
dotenv.config();

const MONGODB_URI = process.env.MONGO_URI;

if (!MONGODB_URI) {
  console.error('Error: MONGO_URI is not defined in your .env file');
  process.exit(1);
}

const seedDatabase = async () => {
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected for seeding...');

    // Attempt to drop the old email_1 index
    try {
      await User.collection.dropIndex('email_1');
      console.log('Successfully dropped old email_1 index.');
    } catch (err) {
      // Log error if index doesn't exist or another issue occurs, but continue script
      console.log('Could not drop email_1 index (it might not exist, or another error occurred):', err.message);
    }

    // Clear existing users
    await User.deleteMany({});
    console.log('Existing users cleared.');

    // Create Admin User
    const adminUser = new User({
      username: 'Admin',
      name: 'Administrator', // Optional: provide a name
      password: 'Admin123',
      role: 'Admin',
    });
    await adminUser.save();
    console.log('Admin user (Admin/Admin123) created.');

    // Define other roles and default password for sample users
    const roles = ['Manager', 'Staff', 'Accountant', 'Tenant'];
    const defaultPassword = 'Password123';

    for (const role of roles) {
      for (let i = 1; i <= 2; i++) {
        const username = `${role.toLowerCase()}${i}`; // e.g., manager1, staff2
        const name = `${role} User ${i}`; // e.g., Manager User 1
        const userStatus = role === 'Tenant' ? 'blocked' : 'active'; // Block tenants by default

        const user = new User({
          username,
          name,
          password: defaultPassword,
          role,
          status: userStatus, // Set status
        });
        await user.save();
        console.log(`${role} user '${username}' (password: Password123, status: ${userStatus}) created.`);
      }
    }

    console.log('User seeding completed successfully.');
  } catch (error) {
    console.error('Error seeding users:', error);
  } finally {
    await mongoose.disconnect();
    console.log('MongoDB disconnected.');
  }
};

seedDatabase();
