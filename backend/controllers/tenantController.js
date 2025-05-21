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

exports.allocateTenant = async (req, res) => {
  try {
    // Enforce: max 80 tenants, 30 rooms, distribution rules
    const totalRooms = await Room.countDocuments();
    if (totalRooms > 30) {
      return res.status(400).json({ error: 'Total rooms cannot exceed 30.' });
    }
    const tenants = await Tenant.find();
    if (tenants.length >= 80) {
      return res.status(400).json({ error: 'Maximum 80 tenants allowed.' });
    }
    // Distribution
    const longTerm = tenants.filter(t => t.accommodationType === 'monthly' && (!t.moveOutDate || (new Date(t.moveOutDate) - new Date(t.moveInDate)) > 28 * 24 * 3600 * 1000)).length;
    const shortTerm = tenants.filter(t => t.accommodationType === 'monthly' && t.moveOutDate && (new Date(t.moveOutDate) - new Date(t.moveInDate)) <= 31 * 24 * 3600 * 1000).length;
    const daily = tenants.filter(t => t.accommodationType === 'daily').length;
    const longTermPct = longTerm / tenants.length;
    const shortTermPct = shortTerm / tenants.length;
    const dailyPct = daily / tenants.length;
    if (longTermPct < 0.7) return res.status(400).json({ error: 'At least 70% tenants must be long-term.' });
    if (shortTermPct < 0.2 || shortTermPct > 0.3) return res.status(400).json({ error: 'Short-term tenants must be 20-30%.' });
    if (dailyPct < 0.05 || dailyPct > 0.1) return res.status(400).json({ error: 'Daily tenants must be 5-10%.' });
    // Room allocation
    const { tenantId, roomName } = req.body;
    const room = await Room.findOne({ name: roomName });
    if (!room) return res.status(404).json({ error: 'Room not found.' });
    if (room.occupancy.current >= room.occupancy.max) {
      return res.status(400).json({ error: 'Room is full.' });
    }
    // Assign tenant
    const tenant = await Tenant.findById(tenantId);
    if (!tenant) return res.status(404).json({ error: 'Tenant not found.' });
    if (tenant.room) return res.status(400).json({ error: 'Tenant already assigned to a room.' });
    tenant.room = roomName;
    await tenant.save();
    room.occupancy.current += 1;
    await room.save();
    // Mark room as occupied if full
    if (room.occupancy.current === room.occupancy.max) {
      room.isBooked = true;
      await room.save();
    }
    res.status(200).json({ message: 'Tenant allocated successfully.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Register a new tenant and assign a room if available
exports.registerTenant = async (req, res) => {
  try {
    const { name, contact, aadhaar, email, accommodationType, preferredRoomType } = req.body;
    if (!name || !contact || !aadhaar || !email || !accommodationType || !preferredRoomType) {
      return res.status(400).json({ error: 'All fields are required.' });
    }
    // Check for existing tenant by contact or aadhaar
    const existing = await Tenant.findOne({ $or: [{ contact }, { email }] });
    if (existing) {
      return res.status(400).json({ error: 'A tenant with this contact or email already exists.' });
    }
    // Find available room of preferred type
    const room = await Room.findOne({ type: preferredRoomType, $expr: { $lt: ["$occupancy.current", "$occupancy.max"] } });
    if (!room) {
      return res.status(400).json({ error: 'No available room for selected type.' });
    }
    // Assign tenant to room
    const tenant = await Tenant.create({
      name,
      contact,
      aadhaar,
      email,
      room: room.name,
      status: 'Active',
      moveInDate: new Date(),
      accommodationType,
    });
    await Room.findByIdAndUpdate(room._id, { $inc: { 'occupancy.current': 1 } });
    res.status(201).json({ message: 'Registration successful', tenant });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getTenantHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const tenant = await Tenant.findById(id).populate('dailyBookings').populate('bookingHistory.room');
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }
    res.status(200).json(tenant);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.updateSecurityDeposit = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, refundableType, conditions } = req.body;

    const tenant = await Tenant.findById(id);
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    tenant.securityDeposit = { amount, refundableType, conditions };
    await tenant.save();

    res.status(200).json({ message: 'Security deposit updated successfully', tenant });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
