const mongoose = require('mongoose');
const Room = require('./models/Room');
require('dotenv').config();

const rooms = [
  { name: 'GB', type: '2 Sharing', location: 'Ground', price: 5800, occupancy: { current: 0, max: 2 } },
  { name: 'GC', type: '3 Sharing', location: 'Ground', price: 4800, occupancy: { current: 0, max: 3 } },
  { name: 'GD', type: '5 Sharing', location: 'Ground', price: 3800, occupancy: { current: 0, max: 5 } },
  { name: '1A', type: '3/4 Sharing', location: '1st', price: 4500, occupancy: { current: 0, max: 4 } },
  { name: '1B', type: '1/2 Sharing', location: '1st', price: 7500, occupancy: { current: 0, max: 2 } },
  { name: '1C', type: '1/2 Sharing', location: '1st', price: 7500, occupancy: { current: 0, max: 2 } },
  { name: '1D', type: '5 Sharing', location: '1st', price: 3800, occupancy: { current: 0, max: 5 } },
  { name: '1E', type: '3/4 Sharing', location: '1st', price: 4500, occupancy: { current: 0, max: 4 } },
  { name: '1F', type: '1/2 Sharing', location: '1st', price: 7500, occupancy: { current: 0, max: 2 } },
  { name: '1G', type: '1/2 Sharing', location: '1st', price: 7500, occupancy: { current: 0, max: 2 } },
  { name: '1H', type: '1/2 Sharing', location: '1st', price: 7500, occupancy: { current: 0, max: 2 } },
  { name: '1I', type: 'Private', location: '1st', price: 8500, occupancy: { current: 0, max: 1 } },
  { name: '2A', type: '3/4 Sharing', location: '2nd', price: 4500, occupancy: { current: 0, max: 4 } },
  { name: '2B', type: '1/2 Sharing', location: '2nd', price: 7500, occupancy: { current: 0, max: 2 } },
  { name: '2C', type: '1/2 Sharing', location: '2nd', price: 7500, occupancy: { current: 0, max: 2 } },
  { name: '2D', type: '5 Sharing', location: '2nd', price: 3800, occupancy: { current: 0, max: 5 } },
  { name: '2E', type: '3/4 Sharing', location: '2nd', price: 4500, occupancy: { current: 0, max: 4 } },
  { name: '2F', type: '1/2 Sharing', location: '2nd', price: 7500, occupancy: { current: 0, max: 2 } },
  { name: '2G', type: '1/2 Sharing', location: '2nd', price: 7500, occupancy: { current: 0, max: 2 } },
  { name: '2H', type: '1/2 Sharing', location: '2nd', price: 7500, occupancy: { current: 0, max: 2 } },
  { name: '2I', type: 'Private', location: '2nd', price: 8500, occupancy: { current: 0, max: 1 } },
  { name: '3A', type: '3/4 Sharing', location: '3rd', price: 4500, occupancy: { current: 0, max: 4 } },
  { name: '3B', type: '1/2 Sharing', location: '3rd', price: 7500, occupancy: { current: 0, max: 2 } },
  { name: '3C', type: '1/2 Sharing', location: '3rd', price: 7500, occupancy: { current: 0, max: 2 } },
  { name: '3D', type: '5 Sharing', location: '3rd', price: 3800, occupancy: { current: 0, max: 5 } },
  { name: '3E', type: '3/4 Sharing', location: '3rd', price: 4500, occupancy: { current: 0, max: 4 } },
  { name: '3F', type: '1/2 Sharing', location: '3rd', price: 7500, occupancy: { current: 0, max: 2 } },
  { name: '3G', type: '1/2 Sharing', location: '3rd', price: 7500, occupancy: { current: 0, max: 2 } },
  { name: '3H', type: '1/2 Sharing', location: '3rd', price: 7500, occupancy: { current: 0, max: 2 } },
  { name: '3I', type: 'Private', location: '3rd', price: 8500, occupancy: { current: 0, max: 1 } },
];

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {
    console.log('MongoDB connected');
    await Room.insertMany(rooms);
    console.log('Rooms populated successfully');
    process.exit();
  })
  .catch((err) => {
    console.error('Error connecting to MongoDB:', err.message);
    process.exit(1);
  });
