const Room = require('../models/Room');

exports.getRooms = async (req, res) => {
  try {
    console.log('Fetching rooms from database...'); // Debug log
    const rooms = await Room.find();
    console.log('Rooms fetched:', rooms); // Debug log
    res.status(200).json(rooms);
  } catch (error) {
    console.error('Error fetching rooms:', error.message); // Debug log
    res.status(400).json({ error: error.message });
  }
};

exports.addRoom = async (req, res) => {
  try {
    const { name, location, price, type, occupancy } = req.body;

    if (!name || !location || !price || !type || !occupancy || !occupancy.max) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (occupancy.current > occupancy.max) {
      return res.status(400).json({ error: 'Current occupancy cannot exceed maximum occupancy' });
    }

    const room = await Room.create({ name, location, price, type, occupancy });
    res.status(201).json(room);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateRoom = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Update the room with the provided data
    const updatedRoom = await Room.findByIdAndUpdate(id, updates, { new: true });

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