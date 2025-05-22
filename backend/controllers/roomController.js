const Room = require('../models/Room');

exports.getRooms = async (req, res) => {
  try {
    console.log('Fetching rooms from database...'); // Debug log
    const rooms = await Room.find().populate('roomConfigurationType'); // Added populate
    console.log('Rooms fetched:', rooms); // Debug log
    res.status(200).json(rooms);
  } catch (error) {
    console.error('Error fetching rooms:', error.message); // Debug log
    res.status(400).json({ error: error.message });
  }
};

exports.addRoom = async (req, res) => {
  try {
    const { name, location, price, type, occupancy, roomConfigurationTypeId } = req.body; // Added roomConfigurationTypeId

    // Basic validation - can be expanded
    if (!name || !location || price === undefined || !occupancy || occupancy.max === undefined) {
      return res.status(400).json({ error: 'Name, location, price, and occupancy.max are required' });
    }
    // If roomConfigurationTypeId is not provided, the old 'type' field might be required.
    // For now, we assume the frontend might still send 'type' or derive it.
    // If 'type' is not sent and no roomConfigurationTypeId, it might be an issue based on model's 'type' requirement.
    // Since we made 'type' not required in the model if roomConfigurationTypeId is used, this is okay.

    if (occupancy.current !== undefined && occupancy.current > occupancy.max) {
      return res.status(400).json({ error: 'Current occupancy cannot exceed maximum occupancy' });
    }

    const roomData = { 
      name, 
      location, 
      price, 
      type, // Keep type for now, could be used if no roomConfigurationTypeId
      occupancy,
      roomConfigurationType: roomConfigurationTypeId || undefined // Set to undefined if not provided
    };

    const room = await Room.create(roomData);
    // Populate after creating to return the full object in the response
    const populatedRoom = await Room.findById(room._id).populate('roomConfigurationType');
    res.status(201).json(populatedRoom);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateRoom = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body; // updates can include roomConfigurationTypeId

    // If roomConfigurationTypeId is explicitly set to null or an empty string, handle it
    if (updates.hasOwnProperty('roomConfigurationTypeId') && !updates.roomConfigurationTypeId) {
      updates.roomConfigurationType = null; // Or undefined, depending on desired behavior
    } else if (updates.roomConfigurationTypeId) {
      updates.roomConfigurationType = updates.roomConfigurationTypeId;
    }
    // Remove roomConfigurationTypeId from updates if it was just a placeholder for roomConfigurationType
    if (updates.hasOwnProperty('roomConfigurationTypeId')){
        delete updates.roomConfigurationTypeId;
    }


    // Update the room with the provided data
    const updatedRoom = await Room.findByIdAndUpdate(id, updates, { new: true }).populate('roomConfigurationType'); // Added populate

    if (!updatedRoom) {
      return res.status(404).json({ message: 'Room not found' });
    }

    res.status(200).json(updatedRoom);
  } catch (error) {
    console.error('Error updating room:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.deleteRoom = async (req, res) => {
  try {
    const { id } = req.params;
    const room = await Room.findByIdAndDelete(id);
    if (!room) return res.status(404).json({ error: 'Room not found' });
    res.status(200).json({ message: 'Room deleted successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getRoomById = async (req, res) => {
  try {
    const { id } = req.params;
    const room = await Room.findById(id).populate('roomConfigurationType'); // Added populate
    if (!room) return res.status(404).json({ error: 'Room not found' });
    res.status(200).json(room);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get available rooms by type
exports.getAvailableRooms = async (req, res) => {
  try {
    const { type } = req.query;
    if (!type) {
      return res.status(400).json({ status: 'error', message: 'Room type is required.' });
    }
    // Only return rooms where occupancy.current < occupancy.max, not blocked, not fully booked
    const availableRooms = await Room.find({
      type,
      blocked: false,
      $expr: { $lt: ["$occupancy.current", "$occupancy.max"] }
    });
    res.status(200).json({ status: 'success', data: availableRooms });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// Get distinct available room types
exports.getAvailableRoomTypes = async (req, res) => {
  try {
    const availableRoomObjects = await Room.aggregate([
      {
        $match: {
          blocked: false,
          $expr: { $lt: ["$occupancy.current", "$occupancy.max"] }
        }
      },
      {
        $group: {
          _id: "$type" // Group by type
        }
      },
      {
        $project: {
          _id: 0, // Exclude the default _id field from group
          type: "$_id" // Rename _id to type
        }
      }
    ]);
    const availableTypes = availableRoomObjects.map(rt => rt.type);
    res.status(200).json({ status: 'success', data: availableTypes });
  } catch (error) {
    console.error('Error fetching available room types:', error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch available room types: ' + error.message });
  }
};