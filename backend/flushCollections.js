const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Define models (ensure these paths are correct)
const Room = require('./models/Room');
const Tenant = require('./models/Tenant');
const Booking = require('./models/Booking');

// Construct the absolute path to the .env file located in the same directory as this script
const envPath = path.resolve(__dirname, '.env');
console.log(`Attempting to load .env file from: ${envPath}`);

// Load environment variables
const dotenvResult = dotenv.config({ path: envPath });

if (dotenvResult.error) {
  console.error('Error loading .env file:', dotenvResult.error);
} else {
  console.log('.env file loaded successfully. Parsed values:', dotenvResult.parsed);
}

console.log(`MONGO_URI after dotenv.config(): "${process.env.MONGO_URI}"`); // Log the value

const flushData = async () => {
  if (!process.env.MONGO_URI) {
    console.error('MONGO_URI is undefined. Cannot connect to MongoDB. Please check your .env file and its path.');
    return; // Exit if MONGO_URI is not set
  }

  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected successfully.');

    // Flush Rooms
    const roomDeletionResult = await Room.deleteMany({});
    console.log(`Rooms flushed: ${roomDeletionResult.deletedCount} documents deleted.`);

    // Flush Tenants
    const tenantDeletionResult = await Tenant.deleteMany({});
    console.log(`Tenants flushed: ${tenantDeletionResult.deletedCount} documents deleted.`);

    // Flush Bookings
    const bookingDeletionResult = await Booking.deleteMany({});
    console.log(`Bookings flushed: ${bookingDeletionResult.deletedCount} documents deleted.`);

    console.log('All specified collections have been flushed.');
  } catch (error) {
    console.error('Error flushing data:', error);
  } finally {
    await mongoose.disconnect();
    console.log('MongoDB disconnected.');
  }
};

flushData();
