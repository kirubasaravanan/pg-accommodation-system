const Tenant = require('../models/Tenant');
const Room = require('../models/Room');

exports.getTenants = async (req, res) => {
  try {
    const tenants = await Tenant.find();
    res.status(200).json(tenants);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.addTenant = async (req, res) => {
  try {
    const { name, contact, email, room, status, moveInDate, moveOutDate, accommodationType, bookingHistory, rentPaidStatus, rentDueDate, rentPaymentDate } = req.body;
    if (!name || !contact || !email) {
      return res.status(400).json({ error: 'Name, contact, and email are required' });
    }
    const existing = await Tenant.findOne({ contact });
    if (existing) {
      return res.status(400).json({ error: 'A tenant with this contact number already exists' });
    }
    const tenant = await Tenant.create({ name, contact, email, room, status, moveInDate, moveOutDate, accommodationType, bookingHistory, rentPaidStatus, rentDueDate, rentPaymentDate });
    // If assigned to a room, increment occupancy
    if (room) {
      await Room.findOneAndUpdate(
        { name: room },
        { $inc: { 'occupancy.current': 1 } }
      );
    }
    res.status(201).json(tenant);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateTenant = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const oldTenant = await Tenant.findById(id);
    if (!oldTenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }
    if (updates.contact) {
      const existing = await Tenant.findOne({ contact: updates.contact, _id: { $ne: id } });
      if (existing) {
        return res.status(400).json({ error: 'A tenant with this contact number already exists' });
      }
    }
    // If status is set to Inactive, set moveOutDate to now if not already set
    if (updates.status === 'Inactive' && !oldTenant.moveOutDate) {
      updates.moveOutDate = new Date();
    }
    // If room assignment changed, update occupancy for both old and new rooms
    if (typeof updates.room !== 'undefined' && updates.room !== oldTenant.room) {
      if (oldTenant.room) {
        await Room.findOneAndUpdate(
          { name: oldTenant.room },
          { $inc: { 'occupancy.current': -1 } }
        );
      }
      if (updates.room) {
        await Room.findOneAndUpdate(
          { name: updates.room },
          { $inc: { 'occupancy.current': 1 } }
        );
      }
    }
    // If accommodationType is daily and bookingHistory is provided, add booking entry
    if (updates.accommodationType === 'daily' && updates.bookingHistory) {
      await Tenant.findByIdAndUpdate(id, { $push: { bookingHistory: { $each: updates.bookingHistory } } });
      delete updates.bookingHistory;
    }
    const updatedTenant = await Tenant.findByIdAndUpdate(id, updates, { new: true });
    res.status(200).json(updatedTenant);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteTenant = async (req, res) => {
  try {
    const { id } = req.params;
    const tenant = await Tenant.findByIdAndDelete(id);
    if (!tenant) return res.status(404).json({ error: 'Tenant not found' });
    // If tenant was assigned to a room, decrement occupancy
    if (tenant.room) {
      await Room.findOneAndUpdate(
        { name: tenant.room },
        { $inc: { 'occupancy.current': -1 } }
      );
    }
    res.status(200).json({ message: 'Tenant deleted successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
