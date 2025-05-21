const Booking = require('../models/Booking');
const Tenant = require('../models/Tenant');

// Get all bookings
exports.getBookings = async (req, res) => {
  try {
    const bookings = await Booking.find().populate('tenant');
    res.status(200).json(bookings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Add a booking
exports.addBooking = async (req, res) => {
  try {
    const booking = await Booking.create(req.body);
    res.status(201).json(booking);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Update a booking
exports.updateBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await Booking.findByIdAndUpdate(id, req.body, { new: true });
    res.status(200).json(updated);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Delete a booking
exports.deleteBooking = async (req, res) => {
  try {
    const { id } = req.params;
    await Booking.findByIdAndDelete(id);
    res.status(200).json({ message: 'Booking deleted' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Add a daily booking
exports.addDailyBooking = async (req, res) => {
  try {
    const { tenantId, date, room, dailyRate } = req.body;

    // Add to dailyBookings in Tenant model
    const tenant = await Tenant.findById(tenantId);
    tenant.dailyBookings.push({ date, room, rentPaidStatus: 'due' });
    await tenant.save();

    // Create a booking entry
    const booking = await Booking.create({
      tenant: tenantId,
      room,
      startDate: date,
      endDate: date,
      rentDetails: {
        dailyRate,
        numberOfDays: 1,
        totalRent: dailyRate,
      },
    });

    res.status(201).json(booking);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Calculate rent for monthly stays
exports.calculateMonthlyRent = async (req, res) => {
  try {
    const { tenantId, startDate, endDate, monthlyRate } = req.body;

    // Calculate the number of months
    const start = new Date(startDate);
    const end = new Date(endDate);
    const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());

    const totalRent = months * monthlyRate;

    res.status(200).json({ totalRent });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
