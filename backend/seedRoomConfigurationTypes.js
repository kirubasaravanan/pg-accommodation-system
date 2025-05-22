// filepath: c:\\Users\\user\\pg-accommodation-system\\backend\\seedRoomConfigurationTypes.js
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path'); // Added path import
const RoomConfigurationType = require('./models/RoomConfigurationType');

dotenv.config({ path: path.resolve(__dirname, '.env') }); // Load environment variables from backend/.env

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/pg-accommodation';

const roomConfigurationTypesToSeed = [
  {
    name: "Standard Single Non-AC", // Renamed
    baseSharingCapacity: 1,
    baseRent: 7500,
    isConvertible: false, // Simplified
    convertedSharingCapacity: null,
    convertedRent: null,
    acStatus: "Non-AC (Standard)",
    dailyRate: 500, // Added daily rate
    description: "Standard single occupancy non-AC room."
  },
  {
    name: "Standard Double Non-AC", // Renamed
    baseSharingCapacity: 2,
    baseRent: 5800, // Per person
    isConvertible: false, // Simplified
    convertedSharingCapacity: null,
    convertedRent: null,
    acStatus: "Non-AC (Standard)",
    dailyRate: 400, // Added daily rate
    description: "Standard double occupancy non-AC room."
  },
  {
    name: "Standard Triple Non-AC", // Renamed
    baseSharingCapacity: 3,
    baseRent: 4800, // Per person
    isConvertible: false, // Simplified
    convertedSharingCapacity: null,
    convertedRent: null,
    acStatus: "Non-AC (Standard)",
    dailyRate: 300, // Added daily rate
    description: "Standard triple occupancy non-AC room."
  },
  {
    name: "Deluxe Double AC", // New Type
    baseSharingCapacity: 2,
    baseRent: 7500, // Example rent, per person
    isConvertible: false,
    convertedSharingCapacity: null,
    convertedRent: null,
    acStatus: "Non-AC (Standard)", // Changed to Non-AC as per user
    dailyRate: 400, // Added daily rate (based on 2-sharing, non-AC)
    description: "Deluxe double occupancy room. Currently Non-AC."
  },
  {
    name: "Convertible 5-to-4 Sharing Non-AC", // Kept for variety
    baseSharingCapacity: 5,
    baseRent: 3800, // Per person
    isConvertible: true,
    convertedSharingCapacity: 4,
    convertedRent: 4500, // Per person
    acStatus: "Non-AC (Standard)",
    dailyRate: 300, // Added daily rate (based on 3+ sharing)
    description: "Non-AC room, base five sharing, convertible to four sharing (e.g., D-series)."
  }
];

const seedRoomConfigTypes = async () => { // Renamed function
  try {
    console.log('Seed script attempting to connect to MONGO_URI:', MONGO_URI);
    console.log('Connecting to MongoDB for Room Configuration Types:', MONGO_URI);
    await mongoose.connect(MONGO_URI); // Removed useNewUrlParser and useUnifiedTopology
    console.log('MongoDB connected for seeding room configuration types.');

    for (let typeData of roomConfigurationTypesToSeed) {
      // Ensure acStatus is Non-AC for all types as per user instruction
      typeData.acStatus = "Non-AC (Standard)";
      
      const existingType = await RoomConfigurationType.findOne({ name: typeData.name });
      if (!existingType) {
        await RoomConfigurationType.create(typeData);
        console.log(`Created room configuration type: ${typeData.name} with daily rate ${typeData.dailyRate}`);
      } else {
        // If type exists, update it with the new dailyRate and ensure acStatus is correct
        await RoomConfigurationType.updateOne({ name: typeData.name }, { $set: { dailyRate: typeData.dailyRate, acStatus: typeData.acStatus } }, { upsert: false });
        console.log(`Updated/Verified room configuration type: ${typeData.name} with daily rate ${typeData.dailyRate}`);
      }
    }

    console.log('Room configuration types seeding completed.');
  } catch (error) {
    console.error('Error seeding room configuration types:', error);
  } finally {
    if (mongoose.connection.readyState === 1) { 
        await mongoose.disconnect();
        console.log('MongoDB disconnected after seeding room configuration types.');
    }
  }
};

seedRoomConfigTypes(); // Called the renamed function
