const Room = require('../models/Room');

exports.getRooms = async (req, res) => {
  try {
    const rooms = await Room.find();
    res.status(200).json(rooms);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.addRoom = async (req, res) => {
  try {
    const { name, location, price } = req.body;
    const room = await Room.create({ name, location, price });
    res.status(201).json(room);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};