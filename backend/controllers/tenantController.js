const Tenant = require('../models/Tenant');
const Room = require('../models/Room');
const Booking = require('../models/Booking');
const mongoose = require('mongoose'); // Added mongoose import

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
    const incomingUpdates = req.body;
    const tenantToUpdate = await Tenant.findById(id);

    if (!tenantToUpdate) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    const originalRoomName = tenantToUpdate.room; // This is a NAME
    const originalBedNumber = tenantToUpdate.bedNumber;
    const originalStatus = tenantToUpdate.status;

    let processedUpdates = { ...incomingUpdates }; // Start with all incoming changes

    // Uniqueness checks for contact & aadhar
    if (processedUpdates.contact && processedUpdates.contact !== tenantToUpdate.contact) {
      const existingContact = await Tenant.findOne({ contact: processedUpdates.contact, _id: { $ne: id } });
      if (existingContact) {
        return res.status(400).json({ error: 'A tenant with this contact number already exists' });
      }
    }
    if (processedUpdates.aadharNumber && processedUpdates.aadharNumber !== tenantToUpdate.aadharNumber) {
      const existingAadhar = await Tenant.findOne({ aadharNumber: processedUpdates.aadharNumber, _id: { $ne: id } });
      if (existingAadhar) {
        return res.status(400).json({ error: 'Another tenant with this Aadhar number already exists' });
      }
    }

    // Handle intendedVacationDate
    if (processedUpdates.hasOwnProperty('intendedVacationDate')) {
      if (processedUpdates.intendedVacationDate && processedUpdates.intendedVacationDate !== '') {
        console.log(`Setting/updating intendedVacationDate for tenant ${tenantToUpdate.name} to ${processedUpdates.intendedVacationDate}`);
      } else {
        console.log(`Clearing intendedVacationDate for tenant ${tenantToUpdate.name}.`);
        processedUpdates.intendedVacationDate = null;
      }
    }

    // --- Start of new core logic for room and bed assignment ---

    // 1. Resolve Room ID to Room Document and Name
    let newRoomDoc = null; // Document of the NEW room, if specified by ID
    let finalTenantRoomName = originalRoomName; // What tenant.room will be set to

    if (incomingUpdates.room && typeof incomingUpdates.room === 'string' && mongoose.Types.ObjectId.isValid(incomingUpdates.room)) {
        console.log(`[tenantController - updateTenant] Received room ID in payload: ${incomingUpdates.room}`);
        newRoomDoc = await Room.findById(incomingUpdates.room);
        if (!newRoomDoc) {
            console.error(`[tenantController - updateTenant] Room.findById returned null for ID: ${incomingUpdates.room}.`);
            return res.status(404).json({ error: `New room with ID ${incomingUpdates.room} not found.` });
        }
        console.log(`[tenantController - updateTenant] Successfully found room by ID. Room Name: ${newRoomDoc.name}`);
        finalTenantRoomName = newRoomDoc.name; // Use the name of the resolved room
    } else if (incomingUpdates.hasOwnProperty('room') && !incomingUpdates.room) { // Explicitly unassigning room (e.g., room: null or room: '')
        console.log(`[tenantController - updateTenant] Tenant ${tenantToUpdate.name} is being explicitly unassigned from any room.`);
        finalTenantRoomName = null;
    } else if (incomingUpdates.room && typeof incomingUpdates.room === 'string' && !mongoose.Types.ObjectId.isValid(incomingUpdates.room)) {
        // If a string is provided for room but it's not a valid ObjectId
        console.warn(`[tenantController - updateTenant] Received room value '${incomingUpdates.room}' which is not a valid ObjectId and not empty. Treating as error.`);
        return res.status(400).json({ error: `Invalid room ID format: ${incomingUpdates.room}.` });
    }
    // If incomingUpdates.room was not provided, finalTenantRoomName remains originalRoomName by default.

    // 2. Determine Final Bed Number
    let finalTenantBedNumber = originalBedNumber;
    if (incomingUpdates.hasOwnProperty('bedNumber')) {
        finalTenantBedNumber = incomingUpdates.bedNumber;
    }
    // If tenant is not assigned to a room, they cannot have a bed number.
    if (finalTenantRoomName === null) {
        finalTenantBedNumber = null;
    }

    // 3. Handle Status Changes and Occupancy
    const newStatus = processedUpdates.status || originalStatus;

    // Scenario A: Tenant becomes Inactive
    if (newStatus === 'Inactive' && originalStatus === 'Active') {
        console.log(`Tenant ${tenantToUpdate.name} status changing from Active to Inactive.`);
        processedUpdates.moveOutDate = processedUpdates.moveOutDate ? new Date(processedUpdates.moveOutDate).toISOString() : new Date().toISOString();
        console.log(`moveOutDate for ${tenantToUpdate.name} set to ${processedUpdates.moveOutDate}`);
      
        const activeBooking = await Booking.findOne({ tenant: id, status: { $in: ['Active', 'Upcoming'] } }).sort({ startDate: -1 });
        if (activeBooking) {
            console.log(`Found active/upcoming booking ${activeBooking._id} for tenant ${tenantToUpdate.name}.`);
            activeBooking.endDate = new Date(processedUpdates.moveOutDate);
            activeBooking.status = 'Vacated';
            await activeBooking.save();
            console.log(`Booking ${activeBooking._id} updated with endDate: ${activeBooking.endDate} and status: ${activeBooking.status}.`);
            
            const roomFromBooking = await Room.findById(activeBooking.room); // Booking.room is an ID
            if (roomFromBooking) {
                if (roomFromBooking.occupancy.current > 0) {
                    roomFromBooking.occupancy.current -= 1;
                    roomFromBooking.isBooked = (roomFromBooking.occupancy.current >= roomFromBooking.occupancy.max);
                    await roomFromBooking.save();
                    console.log(`Decremented occupancy for room ${roomFromBooking.name} (via booking). New current: ${roomFromBooking.occupancy.current}`);
                }
            } else {
                console.warn(`Could not find room with ID ${activeBooking.room} from booking to decrement occupancy.`);
            }
        } else {
            console.log(`No active/upcoming booking found for tenant ${tenantToUpdate.name} to update upon deactivation.`);
            if (originalRoomName) { 
                const roomToUpdateOccupancy = await Room.findOne({ name: originalRoomName });
                if (roomToUpdateOccupancy && roomToUpdateOccupancy.occupancy.current > 0) {
                    roomToUpdateOccupancy.occupancy.current -= 1;
                    roomToUpdateOccupancy.isBooked = (roomToUpdateOccupancy.occupancy.current >= roomToUpdateOccupancy.occupancy.max);
                    await roomToUpdateOccupancy.save();
                    console.log(`Decremented occupancy for room ${originalRoomName} (no active booking). New current: ${roomToUpdateOccupancy.occupancy.current}`);
                }
            }
        }
        finalTenantRoomName = null; // Inactive tenant has no room
        finalTenantBedNumber = null;  // Inactive tenant has no bed
    }
    // Scenario B: Tenant becomes Active (from Inactive or other non-Active states)
    else if (newStatus === 'Active' && originalStatus !== 'Active') {
        console.log(`Tenant ${tenantToUpdate.name} status changing to Active from ${originalStatus}.`);
        if (finalTenantRoomName) { // A room is assigned
            const roomToOccupy = newRoomDoc || await Room.findOne({ name: finalTenantRoomName });
            if (roomToOccupy) {
                if (roomToOccupy.occupancy.current < roomToOccupy.occupancy.max) {
                    roomToOccupy.occupancy.current += 1;
                    roomToOccupy.isBooked = (roomToOccupy.occupancy.current >= roomToOccupy.occupancy.max);
                    await roomToOccupy.save();
                    console.log(`Incremented occupancy for room ${finalTenantRoomName}. New current: ${roomToOccupy.occupancy.current}`);
                } else {
                    return res.status(400).json({ error: `Cannot activate tenant into full room ${finalTenantRoomName}.` });
                }
            } else {
                console.error(`Error: Room ${finalTenantRoomName} not found when activating tenant ${tenantToUpdate.name}.`);
                return res.status(404).json({ error: `Room ${finalTenantRoomName} not found.` });
            }
        } else { // Becoming active but no room assigned
            finalTenantBedNumber = null; // No room, so no bed
        }
        processedUpdates.moveOutDate = null; // Clear moveOutDate when becoming active
    }
    // Scenario C: Tenant is Active (or another non-Inactive status) and Room/Bed might change
    else if (newStatus === originalStatus && (newStatus === 'Active' || newStatus === 'Pending Allocation' /* other relevant statuses */) ) {
        if (finalTenantRoomName !== originalRoomName) { // Room assignment is changing
            console.log(`Tenant ${tenantToUpdate.name} (Status: ${newStatus}) room changing from '${originalRoomName || 'N/A'}' to '${finalTenantRoomName || 'N/A'}'.`);
            // Vacate original room
            if (originalRoomName) {
                const oldRoom = await Room.findOne({ name: originalRoomName });
                if (oldRoom) {
                    if (oldRoom.occupancy.current > 0) {
                        oldRoom.occupancy.current -= 1;
                        oldRoom.isBooked = (oldRoom.occupancy.current >= oldRoom.occupancy.max);
                        await oldRoom.save();
                        console.log(`Decremented occupancy for old room ${originalRoomName}. New current: ${oldRoom.occupancy.current}`);
                    }
                } else {
                    console.warn(`Old room ${originalRoomName} not found during vacancy for tenant ${tenantToUpdate.name}.`);
                }
            }
            // Occupy new room
            if (finalTenantRoomName) {
                const roomToOccupy = newRoomDoc || await Room.findOne({ name: finalTenantRoomName });
                if (roomToOccupy) {
                    if (roomToOccupy.occupancy.current < roomToOccupy.occupancy.max) {
                        roomToOccupy.occupancy.current += 1;
                        roomToOccupy.isBooked = (roomToOccupy.occupancy.current >= roomToOccupy.occupancy.max);
                        await roomToOccupy.save();
                        console.log(`Incremented occupancy for new room ${finalTenantRoomName}. New current: ${roomToOccupy.occupancy.current}`);
                    } else {
                        console.error(`Cannot move tenant ${tenantToUpdate.name} to full room ${finalTenantRoomName}.`);
                        // Potentially revert old room decrement if a transaction system was in place.
                        return res.status(400).json({ error: `Cannot move tenant to full room ${finalTenantRoomName}. Old room occupancy may have been altered.` });
                    }
                } else {
                     console.error(`Error: New room ${finalTenantRoomName} not found for active tenant ${tenantToUpdate.name}.`);
                    return res.status(404).json({ error: `New room ${finalTenantRoomName} not found.` });
                }
            }
            // If finalTenantRoomName is null here, it means unassignment. Old room is vacated. Bed number already set to null.
        } else if (finalTenantRoomName && incomingUpdates.hasOwnProperty('bedNumber') && finalTenantBedNumber !== originalBedNumber) {
            // Room is the same, but bed number changed. No occupancy change needed.
            console.log(`Tenant ${tenantToUpdate.name} bed number in room ${finalTenantRoomName} changing from ${originalBedNumber || 'N/A'} to ${finalTenantBedNumber || 'N/A'}.`);
        }
    }

    // 4. Set final tenant document fields in processedUpdates
    processedUpdates.room = finalTenantRoomName;
    processedUpdates.bedNumber = finalTenantBedNumber;
    
    // --- End of new core logic ---

    // Handle accommodationType & bookingHistory (existing logic)
    if (processedUpdates.accommodationType === 'daily' && processedUpdates.bookingHistory) {
      console.warn("Consider moving daily bookingHistory updates to a dedicated booking endpoint.");
      if (Array.isArray(processedUpdates.bookingHistory)) {
        // This $push operation should ideally be part of the main update if possible,
        // or handled carefully to avoid race conditions if tenantToUpdate is saved before this.
        // For now, keeping as separate update, but Object.assign followed by save is generally preferred.
        await Tenant.findByIdAndUpdate(id, { $push: { bookingHistory: { $each: processedUpdates.bookingHistory } } });
      } else {
        console.error("bookingHistory is not an array, cannot push.");
      }
      delete processedUpdates.bookingHistory; // Remove after handling to prevent direct set by Object.assign
    }

    Object.assign(tenantToUpdate, processedUpdates);
    await tenantToUpdate.save();
    res.status(200).json(tenantToUpdate);

  } catch (error) {
    console.error(`Error in updateTenant for ID ${req.params.id}:`, error);
    res.status(500).json({ error: error.message });
  }
};

const deleteTenant = async (req, res) => {
  try {
    const { id } = req.params;
    const tenant = await Tenant.findByIdAndDelete(id);
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }
    // Adjust room occupancy if tenant was in a room
    if (tenant.room) {
      const room = await Room.findOne({ name: tenant.room });
      if (room && room.occupancy.current > 0) {
        room.occupancy.current -= 1;
        room.isBooked = (room.occupancy.current >= room.occupancy.max);
        await room.save();
      }
    }
    res.status(200).json({ message: 'Tenant deleted successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const getTenantById = async (req, res) => {
  try {
    const { id } = req.params;
    const tenant = await Tenant.findById(id);
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }
    res.status(200).json(tenant);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Placeholder functions if they don't exist, otherwise ensure they are correctly defined.
const allocateTenant = async (req, res) => {
  const { tenantId, roomId, bedNumber, moveInDate } = req.body;
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    if (!tenantId || !roomId || !bedNumber || !moveInDate) {
      return res.status(400).json({ error: 'Tenant ID, Room ID, Bed Number, and Move-in Date are required.' });
    }

    const tenant = await Tenant.findById(tenantId).session(session);
    if (!tenant) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ error: 'Tenant not found' });
    }
    if (tenant.status === 'Active' && tenant.room) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ error: `Tenant ${tenant.name} is already active in room ${tenant.room}. Please update existing record or deactivate first.` });
    }

    const room = await Room.findById(roomId).session(session);
    if (!room) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ error: 'Room not found' });
    }

    if (room.occupancy.current >= room.occupancy.max) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ error: `Room ${room.name} is already full.` });
    }

    // Check if bed is already occupied by another active tenant in the same room
    const existingTenantInBed = await Tenant.findOne({ 
      room: room.name, // Assuming tenant.room stores room name
      bedNumber: bedNumber, 
      status: 'Active',
      _id: { $ne: tenantId } // Exclude the current tenant if they are being reactivated into the same bed
    }).session(session);

    if (existingTenantInBed) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ error: `Bed ${bedNumber} in room ${room.name} is already occupied by ${existingTenantInBed.name}.` });
    }

    // Update tenant details
    tenant.room = room.name; // Store room name
    tenant.bedNumber = bedNumber;
    tenant.status = 'Active';
    tenant.moveInDate = new Date(moveInDate);
    tenant.moveOutDate = null; // Clear any previous moveOutDate
    // tenant.rentDueDate = calculateNextRentDueDate(new Date(moveInDate), tenant.monthlyRentCyclePreference); // Placeholder for rent due date logic

    // Update room occupancy
    room.occupancy.current += 1;
    if (room.occupancy.current >= room.occupancy.max) {
      room.isBooked = true;
    }

    // Create a booking record
    const booking = new Booking({
      tenant: tenant._id,
      room: room._id, // Store room ID in booking
      bedNumber: bedNumber,
      startDate: new Date(moveInDate),
      // endDate: null, // Or set based on agreement
      status: 'Active', // Booking status
      rentAmount: tenant.customRent || room.price, // Use custom rent if available, else room price
    });

    await tenant.save({ session });
    await room.save({ session });
    await booking.save({ session });

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({ 
      message: 'Tenant allocated successfully and booking created.', 
      tenant,
      booking 
    });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Error in allocateTenant:", error);
    res.status(500).json({ error: error.message });
  }
};

const getTenantHistory = async (req, res) => {
  const { tenantId } = req.params;
  try {
    if (!mongoose.Types.ObjectId.isValid(tenantId)) {
        return res.status(400).json({ error: 'Invalid Tenant ID format.' });
    }
    const tenant = await Tenant.findById(tenantId);
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    // Fetch booking history for the tenant
    // Sorting by startDate descending to get the most recent bookings first
    const bookings = await Booking.find({ tenant: tenantId })
                                  .populate('room', 'name location price') // Populate room details
                                  .sort({ startDate: -1 }); 

    // Potentially, you could fetch payment history, communication logs, etc.
    // For now, we'll just return booking history.

    res.status(200).json({
      tenantName: tenant.name,
      contact: tenant.contact,
      email: tenant.email,
      bookingHistory: bookings,
      // Add other relevant history data here in the future
    });

  } catch (error) {
    console.error(`Error fetching history for tenant ${tenantId}:`, error);
    res.status(500).json({ error: `Failed to get tenant history: ${error.message}` });
  }
};

const updateSecurityDeposit = async (req, res) => {
  const { tenantId } = req.params;
  const { amount, refundableType, conditions } = req.body;

  try {
    if (!mongoose.Types.ObjectId.isValid(tenantId)) {
        return res.status(400).json({ error: 'Invalid Tenant ID format.' });
    }

    const tenant = await Tenant.findById(tenantId);
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    // Validate security deposit data
    if (amount !== undefined && (typeof amount !== 'number' || amount < 0)) {
        return res.status(400).json({ error: 'Invalid security deposit amount.' });
    }
    if (refundableType && !['fully', 'partial', 'non-refundable'].includes(refundableType)) {
        return res.status(400).json({ error: 'Invalid refundable type for security deposit.' });
    }

    // Update only provided fields
    if (amount !== undefined) {
        tenant.securityDeposit.amount = amount;
    }
    if (refundableType) {
        tenant.securityDeposit.refundableType = refundableType;
    }
    if (conditions !== undefined) {
        tenant.securityDeposit.conditions = conditions;
    }
    
    await tenant.save();
    res.status(200).json({ 
        message: 'Security deposit updated successfully.', 
        securityDeposit: tenant.securityDeposit 
    });

  } catch (error) {
    console.error(`Error updating security deposit for tenant ${tenantId}:`, error);
    res.status(500).json({ error: `Failed to update security deposit: ${error.message}` });
  }
};

const allocateRoomToTenant = async (req, res) => {
  const { tenantId, roomId, bedNumber, moveInDate } = req.body; // Added moveInDate
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    if (!tenantId || !roomId || !bedNumber || !moveInDate) { // Added moveInDate check
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ error: 'Tenant ID, Room ID, Bed Number, and Move-in Date are required.' });
    }

    const tenant = await Tenant.findById(tenantId).session(session);
    if (!tenant) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ error: 'Tenant not found' });
    }

    const room = await Room.findById(roomId).session(session);
    if (!room) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ error: 'Room not found' });
    }
    
    // If tenant is already active in a different room, this might need specific handling
    // For now, this function assumes it's a new allocation or re-allocation after deactivation.
    if (tenant.status === 'Active' && tenant.room && tenant.room !== room.name) {
        // If tenant is active in another room, first vacate them from the old room.
        const oldRoom = await Room.findOne({ name: tenant.room }).session(session);
        if (oldRoom && oldRoom.occupancy.current > 0) {
            oldRoom.occupancy.current -= 1;
            oldRoom.isBooked = (oldRoom.occupancy.current >= oldRoom.occupancy.max);
            await oldRoom.save({ session });
            console.log(`[allocateRoomToTenant] Vacated tenant ${tenant.name} from old room ${oldRoom.name}`);
        }
    } else if (tenant.status === 'Active' && tenant.room === room.name && tenant.bedNumber === bedNumber) {
        // Tenant is already in this room and bed, no change needed for room/bed assignment itself.
        // However, we might still want to update moveInDate or create a new booking record if that's the intent.
        // For simplicity, we'll assume this function is for a *new* allocation or a *change* of room/bed.
        // If it's just a data update for an existing allocation, updateTenant might be more appropriate.
        console.log(`[allocateRoomToTenant] Tenant ${tenant.name} is already in room ${room.name}, bed ${bedNumber}. No change to room/bed assignment.`);
        // Potentially update moveInDate if provided and different
        if (moveInDate && new Date(tenant.moveInDate).toISOString().split('T')[0] !== new Date(moveInDate).toISOString().split('T')[0]) {
            tenant.moveInDate = new Date(moveInDate);
            // Consider if a new booking record should be created or existing one updated.
        }
        // Fall through to save tenant and potentially create booking if logic is added for it.
    }


    if (room.occupancy.current >= room.occupancy.max && !(tenant.status === 'Active' && tenant.room === room.name)) { 
      // Room is full, and the tenant is not already counted in this room's occupancy
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ error: `Room ${room.name} is already full.` });
    }

    const existingTenantInBed = await Tenant.findOne({ 
      room: room.name, 
      bedNumber: bedNumber, 
      status: 'Active',
      _id: { $ne: tenantId } 
    }).session(session);

    if (existingTenantInBed) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ error: `Bed ${bedNumber} in room ${room.name} is already occupied by ${existingTenantInBed.name}.` });
    }
    
    const wasPreviouslyInThisRoomAndBed = tenant.room === room.name && tenant.bedNumber === bedNumber && tenant.status === 'Active';

    // Update tenant details
    tenant.room = room.name;
    tenant.bedNumber = bedNumber;
    tenant.status = 'Active';
    tenant.moveInDate = new Date(moveInDate);
    tenant.moveOutDate = null;

    // Update room occupancy only if the tenant wasn't already active in this exact room and bed
    if (!wasPreviouslyInThisRoomAndBed) {
        // If the tenant was in a different room, or not active, or in a different bed in the same room, then increment.
        // The check for `room.occupancy.current < room.occupancy.max` is important here.
        // If the tenant was already in this room (e.g. changing beds within the same room), occupancy doesn't change.
        // This logic needs to be careful if the tenant is moving from another room (decrement old, increment new).
        // The earlier block handles vacating the old room.
        if (tenant.room !== room.name || tenant.bedNumber !== bedNumber || tenant.status !== 'Active') {
             // Only increment if the tenant is newly occupying this specific bed in this room
             // or moving from another room.
             // If they were already in this room but inactive, or changing beds, this logic is fine.
            if (room.occupancy.current < room.occupancy.max) {
                room.occupancy.current += 1;
                if (room.occupancy.current >= room.occupancy.max) {
                    room.isBooked = true;
                }
            } else {
                // This case should ideally be caught by the earlier check, but as a safeguard:
                await session.abortTransaction();
                session.endSession();
                return res.status(400).json({ error: `Cannot allocate to room ${room.name} as it is full (safeguard).` });
            }
        }
    }


    // Optional: Create or update a booking record.
    // For simplicity, this example focuses on tenant and room state.
    // A more robust implementation would create/update a Booking document here as well,
    // similar to `allocateTenant`.
    // For now, we'll assume a booking might be created separately or this is a simpler update.
    // Example:
    const newBooking = new Booking({
        tenant: tenant._id,
        room: room._id,
        bedNumber: bedNumber,
        startDate: new Date(moveInDate),
        status: 'Active',
        rentAmount: tenant.customRent || room.price,
    });
    await newBooking.save({ session });


    await tenant.save({ session });
    await room.save({ session });
    
    await session.commitTransaction();
    session.endSession();

    res.status(200).json({ 
      message: 'Room allocated to tenant successfully.', 
      tenant 
    });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Error in allocateRoomToTenant:", error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getTenants,
  addTenant,
  updateTenant,
  deleteTenant,
  getTenantById,
  allocateTenant, // Added export
  getTenantHistory, // Added export
  updateSecurityDeposit, // Added export
  allocateRoomToTenant, // Added export
};
