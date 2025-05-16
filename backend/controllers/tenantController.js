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
    const { name, contact, email, room, status } = req.body;
    if (!name || !contact || !email) {
      return res.status(400).json({ error: 'Name, contact, and email are required' });
    }
    const existing = await Tenant.findOne({ email });
    if (existing) {
      return res.status(400).json({ error: 'A tenant with this email already exists' });
    }
    const tenant = await Tenant.create({ name, contact, email, room, status });
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
    if (updates.email) {
      const existing = await Tenant.findOne({ email: updates.email, _id: { $ne: id } });
      if (existing) {
        return res.status(400).json({ error: 'A tenant with this email already exists' });
      }
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
