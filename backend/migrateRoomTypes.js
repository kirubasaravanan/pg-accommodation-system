const mongoose = require('mongoose');
const Room = require('./models/Room');
const RoomConfigurationType = require('./models/RoomConfigurationType');
const dotenv = require('dotenv');
const path = require('path'); // Added path

// Load environment variables if you have a .env file
dotenv.config({ path: path.resolve(__dirname, '.env') }); // Corrected path to backend/.env

const MONGODB_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/pg-accommodation'; // Changed to process.env.MONGO_URI

async function migrateRoomTypes() {
  try {
    await mongoose.connect(MONGODB_URI, {
      // useNewUrlParser: true, // Removed as it's deprecated
      // useUnifiedTopology: true, // Removed as it's deprecated
    });
    console.log('MongoDB Connected for migration...');

    const roomsToMigrate = await Room.find({ 
      roomConfigurationType: { $exists: false }, 
      type: { $exists: true, $ne: null } 
    });

    if (roomsToMigrate.length === 0) {
      console.log('No rooms found needing migration (type exists, but roomConfigurationType does not).');
      return;
    }

    console.log(`Found ${roomsToMigrate.length} rooms to potentially migrate...`);
    let migratedCount = 0;
    let notFoundCount = 0;

    for (const room of roomsToMigrate) {
      console.log(`Processing room: ${room.name} (ID: ${room._id}), current type: "${room.type}"`);
      
      // Attempt to find a matching RoomConfigurationType by name
      // This assumes the old 'type' string matches a 'name' in RoomConfigurationType
      const configType = await RoomConfigurationType.findOne({ name: room.type });

      if (configType) {
        room.roomConfigurationType = configType._id;
        
        // Optional: Update room's price and max occupancy to match the configType
        // Only do this if you are sure the configType is the source of truth
        // room.price = configType.price; // Assuming RoomConfigurationType has a price field
        // room.occupancy.max = configType.maxOccupancy; // Assuming RoomConfigurationType has maxOccupancy

        await room.save();
        console.log(`  Successfully migrated room "${room.name}". Assigned RoomConfigurationType: "${configType.name}" (ID: ${configType._id})`);
        migratedCount++;
      } else {
        console.log(`  WARNING: No RoomConfigurationType found with name matching "${room.type}" for room "${room.name}". Manual review needed.`);
        notFoundCount++;
      }
    }

    console.log('\nMigration Summary:');
    console.log(`  Successfully migrated rooms: ${migratedCount}`);
    console.log(`  Rooms needing manual review (config type not found): ${notFoundCount}`);

  } catch (error) {
    console.error('Error during migration:', error);
  } finally {
    await mongoose.disconnect();
    console.log('MongoDB Disconnected.');
  }
}

migrateRoomTypes();
