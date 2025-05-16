const mongoose = require('mongoose');
const Room = require('./models/Room');
require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });

console.log('MONGO_URI:', process.env.MONGO_URI); // Debug log

const rooms = [
  { name: 'GB', type: 'Double Occupancy', location: 'Ground', price: 5800, occupancy: { current: 0, max: 2 } },
  { name: 'GC', type: 'Triple Occupancy', location: 'Ground', price: 4800, occupancy: { current: 0, max: 3 } },
  { name: 'GD', type: 'Five Occupancy', location: 'Ground', price: 3800, occupancy: { current: 0, max: 5 } },
  { name: '1A', type: 'Four Occupancy', location: '1st', price: 4000, occupancy: { current: 0, max: 4 } },
  { name: '1B', type: 'Private', location: '1st', price: 8500, occupancy: { current: 0, max: 1 } },
  { name: '1C', type: 'Private', location: '1st', price: 8500, occupancy: { current: 0, max: 1 } },
  { name: '1D', type: 'Five Occupancy', location: '1st', price: 3800, occupancy: { current: 0, max: 5 } },
  { name: '1E', type: 'Four Occupancy', location: '1st', price: 4000, occupancy: { current: 0, max: 4 } },
  { name: '1F', type: 'Private', location: '1st', price: 8500, occupancy: { current: 0, max: 1 } },
  { name: '1G', type: 'Private', location: '1st', price: 8500, occupancy: { current: 0, max: 1 } },
  { name: '1H', type: 'Private', location: '1st', price: 8500, occupancy: { current: 0, max: 1 } },
  { name: '1I', type: 'Private Mini', location: '1st', price: 7500, occupancy: { current: 0, max: 1 } },
  { name: '2A', type: 'Four Occupancy', location: '2nd', price: 4000, occupancy: { current: 0, max: 4 } },
  { name: '2B', type: 'Private', location: '2nd', price: 8500, occupancy: { current: 0, max: 1 } },
  { name: '2C', type: 'Private', location: '2nd', price: 8500, occupancy: { current: 0, max: 1 } },
  { name: '2D', type: 'Five Occupancy', location: '2nd', price: 3800, occupancy: { current: 0, max: 5 } },
  { name: '2E', type: 'Four Occupancy', location: '2nd', price: 4000, occupancy: { current: 0, max: 4 } },
  { name: '2F', type: 'Private', location: '2nd', price: 8500, occupancy: { current: 0, max: 1 } },
  { name: '2G', type: 'Private', location: '2nd', price: 8500, occupancy: { current: 0, max: 1 } },
  { name: '2H', type: 'Private', location: '2nd', price: 8500, occupancy: { current: 0, max: 1 } },
  { name: '2I', type: 'Private Mini', location: '2nd', price: 7500, occupancy: { current: 0, max: 1 } },
  { name: '3A', type: 'Four Occupancy', location: '3rd', price: 4000, occupancy: { current: 0, max: 4 } },
  { name: '3B', type: 'Private', location: '3rd', price: 8500, occupancy: { current: 0, max: 1 } },
  { name: '3C', type: 'Private', location: '3rd', price: 8500, occupancy: { current: 0, max: 1 } },
  { name: '3D', type: 'Five Occupancy', location: '3rd', price: 3800, occupancy: { current: 0, max: 5 } },
  { name: '3E', type: 'Four Occupancy', location: '3rd', price: 4000, occupancy: { current: 0, max: 4 } },
  { name: '3F', type: 'Private', location: '3rd', price: 8500, occupancy: { current: 0, max: 1 } },
  { name: '3G', type: 'Private', location: '3rd', price: 8500, occupancy: { current: 0, max: 1 } },
  { name: '3H', type: 'Private', location: '3rd', price: 8500, occupancy: { current: 0, max: 1 } },
  { name: '3I', type: 'Private Mini', location: '3rd', price: 7500, occupancy: { current: 0, max: 1 } },
];

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {
    console.log('MongoDB connected');
    await Room.deleteMany({}); // Clear existing rooms to avoid duplicates/schema issues
    await Room.insertMany(rooms);
    console.log('Rooms populated successfully');
    process.exit();
  })
  .catch((err) => {
    console.error('Error connecting to MongoDB:', err.message);
    process.exit(1);
  });
