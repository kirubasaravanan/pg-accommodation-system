const Tenant = require('../models/Tenant');
const Room = require('../models/Room');
const Booking = require('../models/Booking');
const mongoose = require('mongoose'); 
const path = require('path'); 
const fs = require('fs'); 

const ensureUploadDirExists = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

const getTenants = async (req, res) => {
  try {
    const tenants = await Tenant.find().populate('room'); // Populate room details
    res.status(200).json(tenants);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const addTenant = async (req, res) => {
  try {
    console.log("[tenantController-addTenant] req.body:", JSON.stringify(req.body, null, 2));

    const { 
      name, 
      contact, 
      email, 
      room, // Expected to be room ID
      bedNumber, // Added bedNumber
      status, 
      moveInDate, 
      moveOutDate, 
      accommodationType, 
      rentPaidStatus, 
      rentDueDate, 
      rentPaymentDate, 
      aadharNumber,
      remarks,
      intendedVacationDate,
      customRent,
      dob, // Added dob
      emergencyContact, // Added emergencyContact
      preferredRoomType // Added preferredRoomType
    } = req.body;

    let securityDepositData = {};
    if (req.body.securityDeposit && typeof req.body.securityDeposit === 'string') {
      try {
        securityDepositData = JSON.parse(req.body.securityDeposit);
      } catch (parseError) {
        console.error("[tenantController-addTenant] Error parsing securityDeposit JSON:", parseError);
        return res.status(400).json({ error: 'Invalid format for securityDeposit' });
      }
    } else if (req.body.securityDeposit && typeof req.body.securityDeposit === 'object') {
      // If it's already an object (e.g. not from FormData)
      securityDepositData = req.body.securityDeposit;
    }


    if (!name || !contact || !email) {
      console.warn("[tenantController-addTenant] Validation failed: Name, contact, and email are required.");
      return res.status(400).json({ error: 'Name, contact, and email are required' });
    }

    const existingContact = await Tenant.findOne({ contact });
    if (existingContact) {
      console.warn(`[tenantController-addTenant] Validation failed: Contact number ${contact} already exists.`);
      return res.status(400).json({ error: 'A tenant with this contact number already exists' });
    }
    if (aadharNumber) {
      const existingAadhar = await Tenant.findOne({ aadharNumber });
      if (existingAadhar) {
        console.warn(`[tenantController-addTenant] Validation failed: Aadhar number ${aadharNumber} already exists.`);
        return res.status(400).json({ error: 'A tenant with this Aadhar number already exists' });
      }
    }

    const tenantDataObject = { 
      name, 
      contact, 
      email, 
      room: null, // Initialize room as null
      bedNumber, 
      status: 'Pending Allocation', // Default status
      moveInDate, 
      moveOutDate, 
      accommodationType, 
      rentPaidStatus, 
      rentDueDate, 
      rentPaymentDate, 
      aadharNumber,
      remarks,
      intendedVacationDate,
      customRent,
      dob,
      emergencyContact,
      preferredRoomType,
      securityDeposit: {
        amount: securityDepositData.amount ? parseFloat(securityDepositData.amount) : 0,
        refundableType: securityDepositData.refundableType || 'fully',
        conditions: securityDepositData.conditions || ''
      }
    };
    
    console.log("[tenantController-addTenant] Tenant data to be created:", JSON.stringify(tenantDataObject, null, 2));

    const newTenant = await Tenant.create(tenantDataObject);
    console.log(`[tenantController-addTenant] Tenant ${newTenant.name} created with ID ${newTenant._id}. Initial room: ${newTenant.room}, Initial status: ${newTenant.status}`);
    
    // Room assignment and occupancy update logic
    if (room && mongoose.Types.ObjectId.isValid(room)) {
      const roomDoc = await Room.findById(room);
      if (roomDoc) {
        console.log(`[tenantController-addTenant] Found room ${roomDoc.name} (ID: ${roomDoc._id}) for assignment. Current: ${roomDoc.occupancy.current}, Max: ${roomDoc.occupancy.max}`);
        if (roomDoc.occupancy.current < roomDoc.occupancy.max) {
          newTenant.room = roomDoc._id; // Assign valid room ID
          newTenant.status = req.body.status || 'Active'; // Set to 'Active' or provided status from req.body
          roomDoc.occupancy.current += 1;
          roomDoc.isBooked = (roomDoc.occupancy.current >= roomDoc.occupancy.max);
          await roomDoc.save();
          await newTenant.save(); // Save tenant with updated room and status
          console.log(`[tenantController-addTenant] Tenant ${newTenant.name} assigned to room ${roomDoc.name}. Occupancy updated. New status: ${newTenant.status}`);
        } else {
          console.warn(`[tenantController-addTenant] Room ${roomDoc.name} (ID: ${roomDoc._id}) is full. Tenant ${newTenant.name} remains 'Pending Allocation'.`);
          // Tenant's room remains null, status remains 'Pending Allocation'
        }
      } else {
        console.warn(`[tenantController-addTenant] Room with ID ${room} not found. Tenant ${newTenant.name} remains 'Pending Allocation'.`);
        // Tenant's room remains null, status remains 'Pending Allocation'
      }
    } else if (room) { // Room ID provided but invalid format
      console.warn(`[tenantController-addTenant] Provided room value '${room}' is not a valid ObjectId. Tenant ${newTenant.name} remains 'Pending Allocation'.`);
      // Tenant's room remains null, status remains 'Pending Allocation'
    } else { // No room ID provided
        console.log(`[tenantController-addTenant] No room provided for tenant ${newTenant.name}. Status remains 'Pending Allocation'.`);
    }

    // Repopulate tenant to ensure all fields are fresh before sending, especially if status/room changed
    const finalTenant = await Tenant.findById(newTenant._id).populate('room');
    console.log(`[tenantController-addTenant] Final state of newTenant before sending response: ID=${finalTenant._id}, Name=${finalTenant.name}, Room=${JSON.stringify(finalTenant.room)}, Status=${finalTenant.status}, Bed=${finalTenant.bedNumber}`);
    res.status(201).json(finalTenant);
  } catch (error) {
    console.error("[tenantController-addTenant] Error:", error); 
    res.status(500).json({ error: error.message });
  }
};

const updateTenant = async (req, res) => {
  try {
    console.log("[tenantController-updateTenant] req.params.id:", req.params.id);
    console.log("[tenantController-updateTenant] req.body:", JSON.stringify(req.body, null, 2));
    // console.log("[tenantController-updateTenant] req.files:", JSON.stringify(req.files, null, 2)); // If files are ever re-introduced

    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ error: 'Invalid tenant ID format' });
    }

    const tenantToUpdate = await Tenant.findById(id);
    if (!tenantToUpdate) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    const incomingUpdates = { ...req.body };
    let processedUpdates = { ...incomingUpdates }; // Clone to modify

    // Parse securityDeposit if it's a stringified JSON
    if (processedUpdates.securityDeposit && typeof processedUpdates.securityDeposit === 'string') {
      try {
        const parsedSecurityDeposit = JSON.parse(processedUpdates.securityDeposit);
        processedUpdates.securityDeposit = {
          amount: parsedSecurityDeposit.amount !== undefined ? parseFloat(parsedSecurityDeposit.amount) : tenantToUpdate.securityDeposit.amount,
          refundableType: parsedSecurityDeposit.refundableType || tenantToUpdate.securityDeposit.refundableType,
          conditions: parsedSecurityDeposit.conditions !== undefined ? parsedSecurityDeposit.conditions : tenantToUpdate.securityDeposit.conditions,
        };
      } catch (parseError) {
        console.error("[tenantController-updateTenant] Error parsing securityDeposit JSON:", parseError);
        return res.status(400).json({ error: 'Invalid format for securityDeposit' });
      }
    } else if (processedUpdates.securityDeposit && typeof processedUpdates.securityDeposit === 'object') {
      // If it's already an object, ensure all parts are handled correctly, merging with existing
      processedUpdates.securityDeposit = {
        amount: processedUpdates.securityDeposit.amount !== undefined ? parseFloat(processedUpdates.securityDeposit.amount) : tenantToUpdate.securityDeposit.amount,
        refundableType: processedUpdates.securityDeposit.refundableType || tenantToUpdate.securityDeposit.refundableType,
        conditions: processedUpdates.securityDeposit.conditions !== undefined ? processedUpdates.securityDeposit.conditions : tenantToUpdate.securityDeposit.conditions,
      };
    }


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
    
    const originalRoomId = tenantToUpdate.room ? tenantToUpdate.room.toString() : null;
    const newRoomId = processedUpdates.room ? processedUpdates.room.toString() : null;
    const originalStatus = tenantToUpdate.status;
    const newStatus = processedUpdates.status || originalStatus;

    console.log(`[tenantController-updateTenant] Original Room ID: ${originalRoomId}, New Room ID: ${newRoomId}`);
    console.log(`[tenantController-updateTenant] Original Status: ${originalStatus}, New Status: ${newStatus}`);

    // Handle room and status changes for occupancy
    if (newStatus === 'Inactive' && originalStatus === 'Active') {
        console.log(`[tenantController-updateTenant] Tenant ${tenantToUpdate.name} becoming Inactive.`);
        processedUpdates.moveOutDate = processedUpdates.moveOutDate ? new Date(processedUpdates.moveOutDate).toISOString() : new Date().toISOString();
        if (originalRoomId && mongoose.Types.ObjectId.isValid(originalRoomId)) {
            const roomDoc = await Room.findById(originalRoomId);
            if (roomDoc && roomDoc.occupancy.current > 0) {
                roomDoc.occupancy.current -= 1;
                roomDoc.isBooked = (roomDoc.occupancy.current >= roomDoc.occupancy.max);
                await roomDoc.save();
                console.log(`[tenantController-updateTenant] Occupancy decremented for room ${roomDoc.name} due to tenant inactivation.`);
            }
        }
        processedUpdates.room = null; // Unassign room
        processedUpdates.bedNumber = null; // Unassign bed
    } else if (newStatus === 'Active' && originalStatus !== 'Active') {
        console.log(`[tenantController-updateTenant] Tenant ${tenantToUpdate.name} becoming Active.`);
        if (newRoomId && mongoose.Types.ObjectId.isValid(newRoomId)) {
            const roomDoc = await Room.findById(newRoomId);
            if (roomDoc) {
                if (roomDoc.occupancy.current < roomDoc.occupancy.max) {
                    roomDoc.occupancy.current += 1;
                    roomDoc.isBooked = (roomDoc.occupancy.current >= roomDoc.occupancy.max);
                    await roomDoc.save();
                    console.log(`[tenantController-updateTenant] Occupancy incremented for room ${roomDoc.name} due to tenant activation.`);
                } else {
                    return res.status(400).json({ error: `Cannot activate tenant into full room ${roomDoc.name}.` });
                }
            } else {
                 return res.status(404).json({ error: `Room with ID ${newRoomId} not found for activation.` });
            }
        } else if (newRoomId) { // newRoomId is present but not valid ObjectId
            return res.status(400).json({ error: `Invalid Room ID ${newRoomId} for activation.` });
        } else { // Becoming active but no room assigned
            console.log(`[tenantController-updateTenant] Tenant ${tenantToUpdate.name} activated without room assignment. Status will be Active, room null.`);
            processedUpdates.room = null;
            processedUpdates.bedNumber = null;
        }
        processedUpdates.moveOutDate = null;
    } else if (newRoomId !== originalRoomId && newStatus === 'Active') { // Room change while active
        console.log(`[tenantController-updateTenant] Tenant ${tenantToUpdate.name} room changing from ${originalRoomId} to ${newRoomId} while Active.`);
        // Vacate old room
        if (originalRoomId && mongoose.Types.ObjectId.isValid(originalRoomId)) {
            const oldRoomDoc = await Room.findById(originalRoomId);
            if (oldRoomDoc && oldRoomDoc.occupancy.current > 0) {
                oldRoomDoc.occupancy.current -= 1;
                oldRoomDoc.isBooked = (oldRoomDoc.occupancy.current >= oldRoomDoc.occupancy.max);
                await oldRoomDoc.save();
                console.log(`[tenantController-updateTenant] Occupancy decremented for old room ${oldRoomDoc.name}.`);
            }
        }
        // Occupy new room
        if (newRoomId && mongoose.Types.ObjectId.isValid(newRoomId)) {
            const newRoomDoc = await Room.findById(newRoomId);
            if (newRoomDoc) {
                if (newRoomDoc.occupancy.current < newRoomDoc.occupancy.max) {
                    newRoomDoc.occupancy.current += 1;
                    newRoomDoc.isBooked = (newRoomDoc.occupancy.current >= newRoomDoc.occupancy.max);
                    await newRoomDoc.save();
                    console.log(`[tenantController-updateTenant] Occupancy incremented for new room ${newRoomDoc.name}.`);
                } else {
                    // Revert old room decrement if possible (or use transactions)
                    // For now, return error. Tenant room will not be updated.
                    if (originalRoomId && mongoose.Types.ObjectId.isValid(originalRoomId)) {
                        const oldRoomDoc = await Room.findById(originalRoomId);
                        if (oldRoomDoc) { oldRoomDoc.occupancy.current +=1; await oldRoomDoc.save(); } // Attempt to revert
                    }
                    return res.status(400).json({ error: `Cannot move tenant to full room ${newRoomDoc.name}.` });
                }
            } else {
                 return res.status(404).json({ error: `New room with ID ${newRoomId} not found.` });
            }
        } else if (newRoomId) { // newRoomId is present but not valid ObjectId
             return res.status(400).json({ error: `Invalid New Room ID ${newRoomId}.` });
        } else { // Unassigning room (newRoomId is null)
            processedUpdates.bedNumber = null; // No room, so no bed
            console.log(`[tenantController-updateTenant] Tenant ${tenantToUpdate.name} unassigned from room.`);
        }
    } else if (newRoomId === null && originalRoomId !== null && newStatus === 'Active') { // Explicitly unassigning room for an active tenant
        console.log(`[tenantController-updateTenant] Tenant ${tenantToUpdate.name} is being explicitly unassigned from room ${originalRoomId}.`);
        if (originalRoomId && mongoose.Types.ObjectId.isValid(originalRoomId)) {
            const oldRoomDoc = await Room.findById(originalRoomId);
            if (oldRoomDoc && oldRoomDoc.occupancy.current > 0) {
                oldRoomDoc.occupancy.current -= 1;
                oldRoomDoc.isBooked = (oldRoomDoc.occupancy.current >= oldRoomDoc.occupancy.max);
                await oldRoomDoc.save();
                console.log(`[tenantController-updateTenant] Occupancy decremented for old room ${oldRoomDoc.name} due to unassignment.`);
            }
        }
        processedUpdates.bedNumber = null;
    }


    // If status is 'Pending Allocation', ensure room and bed are null
    if (processedUpdates.status === 'Pending Allocation') {
        if (processedUpdates.room || processedUpdates.bedNumber) { // If a room was assigned but status is pending
            console.log(`[tenantController-updateTenant] Tenant ${tenantToUpdate.name} status is 'Pending Allocation'. Clearing room/bed assignment.`);
            // If there was a room previously, decrement its occupancy if it wasn't handled above
            if (originalRoomId && originalRoomId !== newRoomId && mongoose.Types.ObjectId.isValid(originalRoomId)) {
                 const roomToVacate = await Room.findById(originalRoomId);
                 if (roomToVacate && roomToVacate.occupancy.current > 0) {
                    // This logic might be redundant if handled by status changes above, but acts as a safeguard
                    // roomToVacate.occupancy.current -=1;
                    // await roomToVacate.save();
                    // console.log(`[tenantController-updateTenant] Safeguard: Decremented occupancy for ${roomToVacate.name} as tenant moves to Pending Allocation.`);
                 }
            }
        }
        processedUpdates.room = null;
        processedUpdates.bedNumber = null;
    }


    const updatedTenant = await Tenant.findByIdAndUpdate(id, processedUpdates, { new: true, runValidators: true });
    if (!updatedTenant) { // Should have been caught by findById earlier, but as a safeguard
        return res.status(404).json({ error: 'Tenant not found after update attempt.' });
    }
    console.log("[tenantController-updateTenant] Tenant updated successfully:", JSON.stringify(updatedTenant, null, 2));
    res.status(200).json(updatedTenant);
  } catch (error) {
    console.error("[tenantController-updateTenant] Error:", error);
    if (error.name === 'ValidationError') {
        return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
};

const deleteTenant = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ error: 'Invalid tenant ID format' });
    }
    const tenant = await Tenant.findById(id);

    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    // If tenant was in a room, decrement occupancy
    if (tenant.room && tenant.status === 'Active' && mongoose.Types.ObjectId.isValid(tenant.room)) {
      const roomDoc = await Room.findById(tenant.room);
      if (roomDoc && roomDoc.occupancy.current > 0) {
        roomDoc.occupancy.current -= 1;
        roomDoc.isBooked = (roomDoc.occupancy.current >= roomDoc.occupancy.max);
        await roomDoc.save();
        console.log(`[tenantController-deleteTenant] Occupancy decremented for room ${roomDoc.name} after deleting tenant ${tenant.name}`);
      }
    }

    await Tenant.findByIdAndDelete(id);
    console.log(`[tenantController-deleteTenant] Tenant with ID ${id} deleted successfully.`);
    res.status(200).json({ message: 'Tenant deleted successfully' });
  } catch (error) {
    console.error("[tenantController-deleteTenant] Error:", error);
    res.status(500).json({ error: error.message });
  }
};

// This function seems to be for a more direct allocation, might need review based on UI flow
const allocateTenant = async (req, res) => {
  try {
    const { tenantId, roomId, bedNumber } = req.body; // Added bedNumber

    if (!mongoose.Types.ObjectId.isValid(tenantId) || !mongoose.Types.ObjectId.isValid(roomId)) {
        return res.status(400).json({ error: 'Invalid tenant or room ID format' });
    }

    const tenant = await Tenant.findById(tenantId);
    const room = await Room.findById(roomId);

    if (!tenant || !room) {
      return res.status(404).json({ error: 'Tenant or Room not found' });
    }

    if (room.occupancy.current >= room.occupancy.max) {
      return res.status(400).json({ error: 'Room is full' });
    }

    // If tenant was previously in another active room, vacate it
    if (tenant.room && tenant.status === 'Active' && tenant.room.toString() !== roomId) {
        const oldRoom = await Room.findById(tenant.room);
        if (oldRoom && oldRoom.occupancy.current > 0) {
            oldRoom.occupancy.current -=1;
            oldRoom.isBooked = (oldRoom.occupancy.current >= oldRoom.occupancy.max);
            await oldRoom.save();
            console.log(`[tenantController-allocateTenant] Vacated old room ${oldRoom.name} for tenant ${tenant.name}`);
        }
    }
    
    tenant.room = roomId;
    tenant.bedNumber = bedNumber; // Assign bed number
    tenant.status = 'Active'; // Ensure status is active
    tenant.moveInDate = tenant.moveInDate || new Date(); // Set move-in date if not already set

    room.occupancy.current += 1;
    room.isBooked = (room.occupancy.current >= room.occupancy.max);

    await tenant.save();
    await room.save();
    console.log(`[tenantController-allocateTenant] Tenant ${tenant.name} allocated to room ${room.name}, bed ${bedNumber}. Occupancy: ${room.occupancy.current}/${room.occupancy.max}`);

    res.status(200).json({ message: 'Tenant allocated successfully', tenant, room });
  } catch (error) {
    console.error("[tenantController-allocateTenant] Error:", error);
    res.status(500).json({ error: error.message });
  }
};


const getTenantHistory = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ error: 'Invalid tenant ID format' });
    }
    // Example: Fetch bookings related to the tenant
    const bookings = await Booking.find({ tenant: id }).sort({ startDate: -1 });
    // This is a placeholder. Actual history might involve more complex aggregation
    // or a dedicated history model.
    res.status(200).json(bookings);
  } catch (error) {
    console.error("[tenantController-getTenantHistory] Error:", error);
    res.status(500).json({ error: error.message });
  }
};

const updateSecurityDeposit = async (req, res) => {
    const { id } = req.params; // Tenant ID
    const { amount, refundableType, conditions } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ error: 'Invalid tenant ID' });
    }

    try {
        const tenant = await Tenant.findById(id);
        if (!tenant) {
            return res.status(404).json({ error: 'Tenant not found' });
        }

        if (amount !== undefined) tenant.securityDeposit.amount = parseFloat(amount);
        if (refundableType) tenant.securityDeposit.refundableType = refundableType;
        if (conditions !== undefined) tenant.securityDeposit.conditions = conditions;
        
        await tenant.save();
        console.log(`[tenantController-updateSecurityDeposit] Security deposit updated for tenant ${tenant.name}`);
        res.status(200).json({ message: 'Security deposit updated successfully', securityDeposit: tenant.securityDeposit });
    } catch (error) {
        console.error('[tenantController-updateSecurityDeposit] Error:', error);
        res.status(500).json({ error: 'Failed to update security deposit' });
    }
};

// This is similar to allocateTenant but might be used in a different context, e.g., directly from a room management UI.
// It's important to ensure these allocation functions are used consistently or consolidated.
const allocateRoomToTenant = async (req, res) => {
    const { tenantId, roomId } = req.params; // Note: tenantId and roomId from params
    const { bedNumber } = req.body; // bedNumber from body

    if (!mongoose.Types.ObjectId.isValid(tenantId) || !mongoose.Types.ObjectId.isValid(roomId)) {
        return res.status(400).json({ error: 'Invalid tenant or room ID format' });
    }
    
    try {
        const tenant = await Tenant.findById(tenantId);
        const room = await Room.findById(roomId);

        if (!tenant) return res.status(404).json({ error: 'Tenant not found' });
        if (!room) return res.status(404).json({ error: 'Room not found' });

        if (room.occupancy.current >= room.occupancy.max && tenant.room?.toString() !== roomId) { // Only block if moving to a new full room
            return res.status(400).json({ error: 'Room is full' });
        }

        // Vacate old room if tenant is moving and was active in another room
        if (tenant.room && tenant.room.toString() !== roomId && tenant.status === 'Active') {
            const oldRoom = await Room.findById(tenant.room);
            if (oldRoom && oldRoom.occupancy.current > 0) {
                oldRoom.occupancy.current -= 1;
                oldRoom.isBooked = (oldRoom.occupancy.current >= oldRoom.occupancy.max);
                await oldRoom.save();
                console.log(`[tenantController-allocateRoomToTenant] Vacated old room ${oldRoom.name} for tenant ${tenant.name}`);
            }
        }
        
        // Update tenant details
        tenant.room = roomId;
        tenant.bedNumber = bedNumber || tenant.bedNumber; // Keep old bedNumber if new one not provided
        tenant.status = 'Active';
        // tenant.moveInDate = tenant.moveInDate || new Date(); // Consider if moveInDate should be updated here

        // Update new room occupancy only if tenant is new to this room
        if (!tenant.room || tenant.room.toString() !== roomId || (tenant.room.toString() === roomId && originalStatus !== 'Active')) { // If tenant was not in this room or was not active
            if (room.occupancy.current < room.occupancy.max) { // Check again before incrementing
                 room.occupancy.current += 1;
                 room.isBooked = (room.occupancy.current >= room.occupancy.max);
            } else if (tenant.room?.toString() !== roomId) { // If trying to move to a new room that just became full
                 console.warn(`[tenantController-allocateRoomToTenant] Room ${room.name} became full before allocation.`);
                 // Potentially revert tenant.room and tenant.bedNumber if old room was vacated
                 return res.status(400).json({ error: `Room ${room.name} is full, allocation failed.`});
            }
        }
        
        await tenant.save();
        await room.save();
        console.log(`[tenantController-allocateRoomToTenant] Tenant ${tenant.name} allocated/updated to room ${room.name}, bed ${tenant.bedNumber}. Occupancy: ${room.occupancy.current}/${room.occupancy.max}`);

        res.status(200).json({ message: 'Tenant allocated to room successfully', tenant });
    } catch (error) {
        console.error('[tenantController-allocateRoomToTenant] Error:', error);
        res.status(500).json({ error: 'Failed to allocate room to tenant' });
    }
};


module.exports = {
  getTenants,
  addTenant,
  updateTenant,
  deleteTenant,
  allocateTenant, // For /api/tenants/allocate (body: tenantId, roomId, bedNumber)
  getTenantHistory,
  updateSecurityDeposit,
  allocateRoomToTenant // For /api/tenants/:tenantId/allocate-room/:roomId (body: bedNumber)
};
