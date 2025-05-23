const Tenant = require('../models/Tenant');
const Room = require('../models/Room');
const Booking = require('../models/Booking');

const getTenants = async (req, res) => {
  try {
    const tenants = await Tenant.find();
    res.status(200).json(tenants);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const addTenant = async (req, res) => {
  try {
    const { 
      name, 
      contact, 
      email, 
      room, // This is expected to be a room ID or name string
      status, 
      moveInDate, 
      moveOutDate, 
      accommodationType, 
      // bookingHistory, // bookingHistory is usually managed by booking operations, not direct tenant creation
      rentPaidStatus, 
      rentDueDate, 
      rentPaymentDate, 
      aadharNumber,
      securityDeposit, // Expect securityDeposit as an object
      remarks, // Added remarks
      intendedVacationDate, // Added intendedVacationDate
      customRent // Added customRent
    } = req.body;

    if (!name || !contact || !email) {
      return res.status(400).json({ error: 'Name, contact, and email are required' });
    }
    const existingContact = await Tenant.findOne({ contact });
    if (existingContact) {
      return res.status(400).json({ error: 'A tenant with this contact number already exists' });
    }
    if (aadharNumber) {
      const existingAadhar = await Tenant.findOne({ aadharNumber });
      if (existingAadhar) {
        return res.status(400).json({ error: 'A tenant with this Aadhar number already exists' });
      }
    }

    // Construct tenantData ensuring securityDeposit is handled correctly
    const tenantData = { 
      name, 
      contact, 
      email, 
      room, 
      status, 
      moveInDate, 
      moveOutDate, 
      accommodationType, 
      rentPaidStatus, 
      rentDueDate, 
      rentPaymentDate, 
      aadharNumber,
      remarks, // Added remarks
      intendedVacationDate, // Added intendedVacationDate
      customRent, // Added customRent
      securityDeposit: { // Ensure securityDeposit is an object
        amount: securityDeposit?.amount,
        refundableType: securityDeposit?.refundableType || 'fully', // Default if not provided
        conditions: securityDeposit?.conditions || '' // Default if not provided
      }
      // bookingHistory should not be set directly here unless specifically intended for initial setup
    };

    const newTenant = await Tenant.create(tenantData);
    
    // If a room is assigned during tenant creation, update room occupancy
    if (room) { // Assuming 'room' contains the room's ID or a unique name
      // If 'room' is an ID:
      // await Room.findByIdAndUpdate(room, { $inc: { 'occupancy.current': 1 } });
      // If 'room' is a name (as suggested by previous logic in updateTenant):
      const roomDoc = await Room.findOne({ name: room }); // Or use _id if 'room' is an ID
      if (roomDoc) {
        if (roomDoc.occupancy.current < roomDoc.occupancy.max) {
          roomDoc.occupancy.current += 1;
          if (roomDoc.occupancy.current >= roomDoc.occupancy.max) {
            roomDoc.isBooked = true;
          }
          await roomDoc.save();
        } else {
          // Optionally handle the case where the room is full, though this should ideally be checked client-side too
          console.warn(`Attempted to add tenant to full room: ${room}`);
          // Decide if this should be an error or just a warning
        }
      } else {
        console.warn(`Room with identifier ${room} not found during tenant creation.`);
      }
    }
    res.status(201).json(newTenant);
  } catch (error) {
    console.error("Error in addTenant:", error); // Added console log for debugging
    res.status(500).json({ error: error.message });
  }
};

const updateTenant = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const tenantToUpdate = await Tenant.findById(id);

    if (!tenantToUpdate) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    if (updates.hasOwnProperty('intendedVacationDate')) {
      if (updates.intendedVacationDate && updates.intendedVacationDate !== '') {
        console.log(`Setting/updating intendedVacationDate for tenant ${tenantToUpdate.name} to ${updates.intendedVacationDate}`);
      } else {
        console.log(`Clearing intendedVacationDate for tenant ${tenantToUpdate.name}.`);
        updates.intendedVacationDate = null;
      }
    }

    const originalStatus = tenantToUpdate.status;
    const originalRoomName = tenantToUpdate.room;

    if (updates.contact && updates.contact !== tenantToUpdate.contact) {
      const existingContact = await Tenant.findOne({ contact: updates.contact, _id: { $ne: id } });
      if (existingContact) {
        return res.status(400).json({ error: 'A tenant with this contact number already exists' });
      }
    }
    if (updates.aadharNumber && updates.aadharNumber !== tenantToUpdate.aadharNumber) {
      const existingAadhar = await Tenant.findOne({ aadharNumber: updates.aadharNumber, _id: { $ne: id } });
      if (existingAadhar) {
        return res.status(400).json({ error: 'Another tenant with this Aadhar number already exists' });
      }
    }

    if (updates.status === 'Inactive' && originalStatus === 'Active') {
      console.log(`Tenant ${tenantToUpdate.name} status changing from Active to Inactive.`);
      updates.moveOutDate = updates.moveOutDate || new Date();
      console.log(`moveOutDate for ${tenantToUpdate.name} set to ${updates.moveOutDate}`);
      const activeBooking = await Booking.findOne({ tenant: id, status: { $in: ['Active', 'Upcoming'] } }).sort({ startDate: -1 });
      if (activeBooking) {
        console.log(`Found active/upcoming booking ${activeBooking._id} for tenant ${tenantToUpdate.name}.`);
        activeBooking.endDate = updates.moveOutDate;
        activeBooking.status = 'Vacated';
        await activeBooking.save();
        console.log(`Booking ${activeBooking._id} updated with endDate: ${activeBooking.endDate} and status: ${activeBooking.status}.`);
        const roomFromBooking = await Room.findById(activeBooking.room);
        if (roomFromBooking) {
          if (roomFromBooking.occupancy.current > 0) {
            roomFromBooking.occupancy.current -= 1;
            if (roomFromBooking.occupancy.current < roomFromBooking.occupancy.max) {
              roomFromBooking.isBooked = false;
            }
            await roomFromBooking.save();
            console.log(`Decremented occupancy for room ${roomFromBooking.name}. New current: ${roomFromBooking.occupancy.current}`);
          }
        } else {
          console.warn(`Could not find room with ID ${activeBooking.room} to decrement occupancy.`);
        }
      } else {
        console.log(`No active/upcoming booking found for tenant ${tenantToUpdate.name} to update upon deactivation.`);
        if (originalRoomName) {
          const roomToUpdateOccupancy = await Room.findOne({ name: originalRoomName });
          if (roomToUpdateOccupancy && roomToUpdateOccupancy.occupancy.current > 0) {
            roomToUpdateOccupancy.occupancy.current -= 1;
            if (roomToUpdateOccupancy.occupancy.current < roomToUpdateOccupancy.occupancy.max) {
              roomToUpdateOccupancy.isBooked = false;
            }
            await roomToUpdateOccupancy.save();
            console.log(`Decremented occupancy for room ${originalRoomName} (no active booking found). New current: ${roomToUpdateOccupancy.occupancy.current}`);
          }
        }
      }
      updates.room = null;
    } else if (updates.status === 'Active' && originalStatus === 'Inactive') {
      console.log(`Tenant ${tenantToUpdate.name} status changing from Inactive to Active.`);
      if (updates.room && updates.room !== originalRoomName) {
        const roomToUpdateOccupancy = await Room.findOne({ name: updates.room });
        if (roomToUpdateOccupancy) {
          if (roomToUpdateOccupancy.occupancy.current < roomToUpdateOccupancy.occupancy.max) {
            roomToUpdateOccupancy.occupancy.current += 1;
            if (roomToUpdateOccupancy.occupancy.current >= roomToUpdateOccupancy.occupancy.max) {
              roomToUpdateOccupancy.isBooked = true;
            }
            await roomToUpdateOccupancy.save();
            console.log(`Incremented occupancy for new room ${updates.room}. New current: ${roomToUpdateOccupancy.occupancy.current}`);
          } else {
            return res.status(400).json({ error: `Cannot activate tenant into full room ${updates.room}.` });
          }
        }
      }
      updates.moveOutDate = null;
    }

    if (updates.room !== undefined && updates.room !== originalRoomName && (updates.status === 'Active' || (!updates.status && originalStatus === 'Active'))) {
      console.log(`Tenant ${tenantToUpdate.name} room changing from ${originalRoomName || 'N/A'} to ${updates.room || 'N/A'}.`);
      if (originalRoomName) {
        const oldRoomOccupancy = await Room.findOne({ name: originalRoomName });
        if (oldRoomOccupancy && oldRoomOccupancy.occupancy.current > 0) {
          oldRoomOccupancy.occupancy.current -= 1;
          oldRoomOccupancy.isBooked = false;
          await oldRoomOccupancy.save();
          console.log(`Decremented occupancy for old room ${originalRoomName}. New current: ${oldRoomOccupancy.occupancy.current}`);
        }
      }
      if (updates.room) {
        const newRoomOccupancy = await Room.findOne({ name: updates.room });
        if (newRoomOccupancy) {
          if (newRoomOccupancy.occupancy.current < newRoomOccupancy.occupancy.max) {
            newRoomOccupancy.occupancy.current += 1;
            if (newRoomOccupancy.occupancy.current >= newRoomOccupancy.occupancy.max) {
              newRoomOccupancy.isBooked = true;
            }
            await newRoomOccupancy.save();
            console.log(`Incremented occupancy for new room ${updates.room}. New current: ${newRoomOccupancy.occupancy.current}`);
          } else {
            return res.status(400).json({ error: `Cannot move tenant to full room ${updates.room}.` });
          }
        } else {
          return res.status(404).json({ error: `New room ${updates.room} not found.` });
        }
      }
    }

    if (updates.accommodationType === 'daily' && updates.bookingHistory) {
      console.warn("Consider moving daily bookingHistory updates to a dedicated booking endpoint.");
      await Tenant.findByIdAndUpdate(id, { $push: { bookingHistory: { $each: updates.bookingHistory } } });
      delete updates.bookingHistory;
    }

    const finalUpdatedTenant = await Tenant.findByIdAndUpdate(id, updates, { new: true });
    console.log('Tenant updated successfully:', finalUpdatedTenant);
    res.status(200).json(finalUpdatedTenant);
  } catch (error) {
    console.error('Error updating tenant:', error);
    res.status(500).json({ error: error.message });
  }
};

const deleteTenant = async (req, res) => {
  try {
    const { id } = req.params;
    const tenantToDelete = await Tenant.findByIdAndDelete(id);
    if (!tenantToDelete) return res.status(404).json({ error: 'Tenant not found' });
    if (tenantToDelete.room) {
      const activeBooking = await Booking.findOne({ tenant: id, status: { $in: ['Active', 'Upcoming'] } }).sort({ startDate: -1 });
      let roomNameToDecrement = tenantToDelete.room;
      let roomObjectIdToDecrement = null;
      if (activeBooking && activeBooking.room) {
        roomObjectIdToDecrement = activeBooking.room;
        const roomDoc = await Room.findById(activeBooking.room);
        if (roomDoc) roomNameToDecrement = roomDoc.name;
      }
      const roomToUpdateQuery = roomObjectIdToDecrement ? { _id: roomObjectIdToDecrement } : { name: roomNameToDecrement };
      const roomUpdated = await Room.findOneAndUpdate(roomToUpdateQuery, { $inc: { 'occupancy.current': -1 } }, { new: true });
      if (roomUpdated) {
        console.log(`Decremented occupancy for room ${roomUpdated.name}. New current: ${roomUpdated.occupancy.current}`);
        if (roomUpdated.occupancy.current < roomUpdated.occupancy.max) {
          roomUpdated.isBooked = false;
          await roomUpdated.save();
        }
      } else {
        console.warn(`Could not find room to decrement occupancy: Query ${JSON.stringify(roomToUpdateQuery)}`);
      }
      if (activeBooking) {
        activeBooking.endDate = new Date();
        activeBooking.status = 'Cancelled';
        await activeBooking.save();
        console.log(`Booking ${activeBooking._id} marked as Cancelled due to tenant deletion.`);
      }
    }
    res.status(200).json({ message: 'Tenant deleted successfully' });
  } catch (error) {
    console.error('Error deleting tenant:', error);
    res.status(400).json({ error: error.message });
  }
};

const allocateTenant = async (req, res) => {
  try {
    const totalRooms = await Room.countDocuments();
    if (totalRooms > 30) {
      return res.status(400).json({ error: 'Total rooms cannot exceed 30.' });
    }
    const tenants = await Tenant.find();
    if (tenants.length >= 80) {
      return res.status(400).json({ error: 'Maximum 80 tenants allowed.' });
    }
    const { tenantId, roomName } = req.body;
    const room = await Room.findOne({ name: roomName });
    if (!room) return res.status(404).json({ error: 'Room not found.' });
    if (room.occupancy.current >= room.occupancy.max) {
      return res.status(400).json({ error: 'Room is full.' });
    }
    const tenantData = await Tenant.findById(tenantId);
    if (!tenantData) return res.status(404).json({ error: 'Tenant not found.' });
    if (tenantData.room) {
      return res.status(400).json({ error: 'Tenant is already assigned to a room.' });
    }
    tenantData.room = roomName;
    room.occupancy.current += 1;
    if (room.occupancy.current >= room.occupancy.max) {
      room.isBooked = true;
    }
    await tenantData.save();
    await room.save();
    res.status(200).json({ message: 'Tenant allocated to room successfully.' });
  } catch (error) {
    console.error('Error allocating tenant:', error);
    res.status(500).json({ error: error.message });
  }
};

const getTenantHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const bookings = await Booking.find({ tenant: id }).sort({ startDate: -1 });
    if (!bookings || bookings.length === 0) {
      return res.status(404).json({ message: "No history found for this tenant." });
    }
    res.status(200).json(bookings);
  } catch (error) {
    console.error('Error fetching tenant history:', error);
    res.status(500).json({ error: error.message });
  }
};

const updateSecurityDeposit = async (req, res) => {
  try {
    const { id } = req.params;
    const { securityDepositAmount, securityDepositStatus } = req.body;
    const tenant = await Tenant.findByIdAndUpdate(id, { 'paymentDetails.securityDeposit.amount': securityDepositAmount, 'paymentDetails.securityDeposit.status': securityDepositStatus }, { new: true });
    if (!tenant) {
      return res.status(404).json({ message: "Tenant not found." });
    }
    res.status(200).json({ message: "Security deposit updated successfully.", tenant });
  } catch (error) {
    console.error('Error updating security deposit:', error);
    res.status(500).json({ error: error.message });
  }
};

const allocateRoomToTenant = async (req, res) => {
  try {
    const { tenantId, roomId } = req.body;
    const tenant = await Tenant.findById(tenantId);
    const room = await Room.findById(roomId);
    if (!tenant) return res.status(404).json({ error: 'Tenant not found.' });
    if (!room) return res.status(404).json({ error: 'Room not found.' });
    if (room.occupancy.current >= room.occupancy.max) {
      return res.status(400).json({ error: 'Room is full.' });
    }
    tenant.room = room.name;
    await tenant.save();
    room.occupancy.current += 1;
    if (room.occupancy.current >= room.occupancy.max) {
      room.isBooked = true;
    }
    await room.save();
    res.status(200).json({ message: 'Room allocated to tenant successfully.', tenant, room });
  } catch (error) {
    console.error('Error allocating room to tenant:', error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getTenants,
  addTenant,
  updateTenant,
  deleteTenant,
  allocateTenant,
  getTenantHistory,
  updateSecurityDeposit,
  allocateRoomToTenant
};
