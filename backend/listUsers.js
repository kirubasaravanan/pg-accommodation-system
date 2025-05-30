
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User'); // Adjust path if your User model is elsewhere

const listUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('MongoDB connected for script.');

    const users = await User.find({}, 'name username role'); // Fetch only name, username, and role

    if (users.length === 0) {
      console.log('No users found in the database.');
    } else {
      console.log('Users found in the database:');
      users.forEach(user => {
        console.log(`- Name: ${user.name}, Username: ${user.username}, Role: ${user.role}`);
      });
    }
  } catch (error) {
    console.error('Error listing users:', error);
  } finally {
    await mongoose.disconnect();
    console.log('MongoDB disconnected for script.');
  }
};

listUsers();
