const Room = require('../models/Room');
const Tenant = require('../models/Tenant');
const Booking = require('../models/Booking');

exports.getSummary = async (req, res) => {
  try {
    // Total rooms
    const totalRooms = await Room.countDocuments();
    // Occupied rooms (at least one active tenant)
    const rooms = await Room.find();
    const tenants = await Tenant.find();
    const occupied = rooms.filter(room => tenants.some(t => t.room === room.name && t.status === 'Active')).length;
    const vacant = totalRooms - occupied;

    // Rent collection for current month
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    const bookings = await Booking.find({
      startDate: { $lte: monthEnd },
      endDate: { $gte: monthStart }
    });
    let rentCollected = 0, rentTotal = 0;
    bookings.forEach(b => {
      rentTotal += b.rentAmount || 0;
      if (b.rentPaidStatus === 'paid') rentCollected += b.rentAmount || 0;
    });

    // Complaints: Placeholder (replace with real complaints if model exists)
    const complaints = [
      'Leaking tap in 2A',
      'WiFi not working in 1C',
      'AC issue in 3F'
    ];

    res.json({
      totalRooms,
      occupied,
      vacant,
      rentCollected,
      rentTotal,
      complaints
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
