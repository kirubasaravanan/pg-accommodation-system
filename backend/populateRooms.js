const mongoose = require('mongoose');
const Room = require('./models/Room');
const RoomConfigurationType = require('./models/RoomConfigurationType');
const dotenv = require('dotenv');
const path = require('path'); // Added path import

dotenv.config({ path: path.resolve(__dirname, '.env') }); // Load environment variables from backend/.env

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/pg-accommodation'; // Changed to MONGO_URI and 127.0.0.1

async function populateRooms() {
  try {
    console.log('Populate rooms script attempting to connect to MONGO_URI:', MONGO_URI); // Added log
    await mongoose.connect(MONGO_URI, {
      // useNewUrlParser: true, // Deprecated
      // useUnifiedTopology: true, // Deprecated
    });
    console.log('MongoDB connected for room population.');

    const roomConfigTypes = await RoomConfigurationType.find({});
    if (roomConfigTypes.length < 4) {
      console.error('Required RoomConfigurationTypes not found. Please ensure at least "Standard Single Non-AC", "Standard Double Non-AC", "Standard Triple Non-AC", and "Deluxe Double AC" are seeded.');
      await mongoose.disconnect();
      return;
    }

    const singleNonAc = roomConfigTypes.find(rc => rc.name === 'Standard Single Non-AC');
    const doubleNonAc = roomConfigTypes.find(rc => rc.name === 'Standard Double Non-AC');
    const tripleNonAc = roomConfigTypes.find(rc => rc.name === 'Standard Triple Non-AC');
    const deluxeDoubleAc = roomConfigTypes.find(rc => rc.name === 'Deluxe Double AC');

    if (!singleNonAc || !doubleNonAc || !tripleNonAc || !deluxeDoubleAc) {
        console.error('One or more specific required room configuration types are missing by name. Ensure "Standard Single Non-AC", "Standard Double Non-AC", "Standard Triple Non-AC", and "Deluxe Double AC" are correctly named and seeded.');
        await mongoose.disconnect();
        return;
    }

    const roomsToCreate = [
      // Ground Floor (G) - 7 rooms
      { name: 'G01', location: 'Ground Floor, Block A', roomConfigurationType: tripleNonAc._id },
      { name: 'G02', location: 'Ground Floor, Block A', roomConfigurationType: tripleNonAc._id },
      { name: 'G03', location: 'Ground Floor, Block A', roomConfigurationType: doubleNonAc._id },
      { name: 'G04', location: 'Ground Floor, Block B', roomConfigurationType: singleNonAc._id },
      { name: 'G05', location: 'Ground Floor, Block B', roomConfigurationType: doubleNonAc._id },
      { name: 'G06', location: 'Ground Floor, Block B', roomConfigurationType: tripleNonAc._id },
      { name: 'G07', location: 'Ground Floor, Block B', roomConfigurationType: doubleNonAc._id },

      // First Floor (F) - 8 rooms
      { name: 'F01', location: 'First Floor, Block A', roomConfigurationType: tripleNonAc._id },
      { name: 'F02', location: 'First Floor, Block A', roomConfigurationType: doubleNonAc._id },
      { name: 'F03', location: 'First Floor, Block A', roomConfigurationType: deluxeDoubleAc._id },
      { name: 'F04', location: 'First Floor, Block A', roomConfigurationType: singleNonAc._id },
      { name: 'F05', location: 'First Floor, Block B', roomConfigurationType: tripleNonAc._id },
      { name: 'F06', location: 'First Floor, Block B', roomConfigurationType: doubleNonAc._id },
      { name: 'F07', location: 'First Floor, Block B', roomConfigurationType: deluxeDoubleAc._id },
      { name: 'F08', location: 'First Floor, Block B', roomConfigurationType: doubleNonAc._id },

      // Second Floor (S) - 8 rooms
      { name: 'S01', location: 'Second Floor, Block A', roomConfigurationType: doubleNonAc._id },
      { name: 'S02', location: 'Second Floor, Block A', roomConfigurationType: deluxeDoubleAc._id },
      { name: 'S03', location: 'Second Floor, Block A', roomConfigurationType: singleNonAc._id },
      { name: 'S04', location: 'Second Floor, Block A', roomConfigurationType: deluxeDoubleAc._id },
      { name: 'S05', location: 'Second Floor, Block B', roomConfigurationType: tripleNonAc._id },
      { name: 'S06', location: 'Second Floor, Block B', roomConfigurationType: deluxeDoubleAc._id },
      { name: 'S07', location: 'Second Floor, Block B', roomConfigurationType: doubleNonAc._id },
      { name: 'S08', location: 'Second Floor, Block B', roomConfigurationType: deluxeDoubleAc._id },
      
      // Third Floor (T) - 6 rooms
      { name: 'T01', location: 'Third Floor, Block A', roomConfigurationType: singleNonAc._id },
      { name: 'T02', location: 'Third Floor, Block A', roomConfigurationType: deluxeDoubleAc._id },
      { name: 'T03', location: 'Third Floor, Block A', roomConfigurationType: doubleNonAc._id },
      { name: 'T04', location: 'Third Floor, Block B', roomConfigurationType: singleNonAc._id },
      { name: 'T05', location: 'Third Floor, Block B', roomConfigurationType: deluxeDoubleAc._id },
      { name: 'T06', location: 'Third Floor, Block B', roomConfigurationType: doubleNonAc._id },
    ]; // Total 7 + 8 + 8 + 6 = 29 rooms

    await Room.deleteMany({});
    console.log('Existing rooms cleared.');

    const roomsWithData = roomsToCreate.map(room => {
        let configTypeDetails;
        // Correctly find the config type details based on _id comparison
        if (singleNonAc && room.roomConfigurationType.equals(singleNonAc._id)) configTypeDetails = singleNonAc;
        else if (doubleNonAc && room.roomConfigurationType.equals(doubleNonAc._id)) configTypeDetails = doubleNonAc;
        else if (tripleNonAc && room.roomConfigurationType.equals(tripleNonAc._id)) configTypeDetails = tripleNonAc;
        else if (deluxeDoubleAc && room.roomConfigurationType.equals(deluxeDoubleAc._id)) configTypeDetails = deluxeDoubleAc;
        
        if (!configTypeDetails) {
            // Attempt to find by iterating through all fetched config types as a fallback
            configTypeDetails = roomConfigTypes.find(rc => rc._id.equals(room.roomConfigurationType));
        }

        if (!configTypeDetails) {
            console.warn(`Could not find config details for room ${room.name} with type ID ${room.roomConfigurationType}. Skipping direct price/occupancy set. Model pre-save hook should handle.`);
            return {
                ...room,
                // Rely on pre-save hook in Room model to set price and occupancy.max from type
                occupancy: { current: 0 } 
            };
        }

        return {
            ...room,
            price: configTypeDetails.baseRent, 
            occupancy: { 
                current: 0, 
                max: configTypeDetails.baseSharingCapacity 
            },
        };
    });

    await Room.insertMany(roomsWithData);
    console.log(`${roomsWithData.length} rooms have been successfully populated.`);

  } catch (error) {
    console.error('Error populating rooms:', error);
  } finally {
    if (mongoose.connection.readyState === 1) { 
        await mongoose.disconnect();
        console.log('MongoDB disconnected.');
    }
  }
}

populateRooms();
