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

exports.getTenantFinancialSummary = async (req, res) => {
  try {
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    // 1. Rent forecast for the month (from active bookings this month)
    const activeBookingsThisMonth = await Booking.find({
      // Assuming bookings have a tenant status or link to tenant to check active status
      // If not, this might need adjustment or rely on tenant status directly
      // For now, let's assume all bookings are for active tenants or filter later
      rentDueDate: { $gte: currentMonthStart, $lte: currentMonthEnd },
      // Add other conditions if necessary, e.g., booking status
    });

    let rentForecastThisMonth = 0;
    activeBookingsThisMonth.forEach(booking => {
      rentForecastThisMonth += booking.rentAmount || 0;
    });

    // 2. Rent received this month
    let rentReceivedThisMonth = 0;
    activeBookingsThisMonth.forEach(booking => {
      if (booking.rentPaidStatus === 'Paid') {
        rentReceivedThisMonth += booking.rentAmount || 0;
      }
    });

    // 3. Rent pending this month
    const rentPendingThisMonth = rentForecastThisMonth - rentReceivedThisMonth;

    // 4. Total security deposit collected
    const allTenants = await Tenant.find({});
    let totalSecurityDepositCollected = 0;
    allTenants.forEach(tenant => {
      if (tenant.securityDeposit && typeof tenant.securityDeposit.amount === 'number') {
        totalSecurityDepositCollected += tenant.securityDeposit.amount;
      }
    });

    res.status(200).json({
      rentForecastThisMonth,
      rentReceivedThisMonth,
      rentPendingThisMonth,
      totalSecurityDepositCollected,
    });

  } catch (error) {
    console.error('Error fetching tenant financial summary:', error);
    res.status(500).json({ message: 'Failed to fetch tenant financial summary', error: error.message });
  }
};
