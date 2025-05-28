const Room = require('../models/Room');
const RoomConfigurationType = require('../models/RoomConfigurationType');
const Tenant = require('../models/Tenant'); // Added Tenant model

exports.getRooms = async (req, res) => {
  try {
    console.log('Fetching rooms from database...');
    const rooms = await Room.find().populate('roomConfigurationType');
    console.log('Rooms fetched:', rooms);
    res.status(200).json(rooms);
  } catch (error) {
    console.error('Error fetching rooms:', error.message);
    res.status(400).json({ error: error.message });
  }
};

exports.addRoom = async (req, res) => {
  try {
    const { name, location, price, /* type, */ occupancy, roomConfigurationTypeId } = req.body; // Removed type

    if (!name || !location || price === undefined || !occupancy || occupancy.max === undefined || !roomConfigurationTypeId) {
      return res.status(400).json({ error: 'Name, location, price, occupancy.max, and roomConfigurationTypeId are required' });
    }

    if (occupancy.current !== undefined && occupancy.current > occupancy.max) {
      return res.status(400).json({ error: 'Current occupancy cannot exceed maximum occupancy' });
    }

    const roomData = { 
      name, 
      location, 
      price, 
      // type, // Removed type
      occupancy,
      roomConfigurationType: roomConfigurationTypeId
    };

    const room = await Room.create(roomData);
    const populatedRoom = await Room.findById(room._id).populate('roomConfigurationType');
    res.status(201).json(populatedRoom);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateRoom = async (req, res) => {
  try {
    const { id } = req.params;
    const { bedAssignments, ...roomUpdates } = req.body;

    if (roomUpdates.hasOwnProperty('roomConfigurationTypeId') && !roomUpdates.roomConfigurationTypeId) {
      return res.status(400).json({ message: 'roomConfigurationTypeId cannot be empty if provided for update as roomConfigurationType is required.' });
    } else if (roomUpdates.roomConfigurationTypeId) {
      roomUpdates.roomConfigurationType = roomUpdates.roomConfigurationTypeId;
    }
    if (roomUpdates.hasOwnProperty('roomConfigurationTypeId')){
        delete roomUpdates.roomConfigurationTypeId;
    }
    if (roomUpdates.hasOwnProperty('type')) {
      delete roomUpdates.type; 
    }

    const roomToUpdate = await Room.findById(id);
    if (!roomToUpdate) {
      return res.status(404).json({ message: 'Room not found' });
    }
    const roomIdentifierForTenant = roomToUpdate.name; 

    let newOccupancyCount = 0;
    const tenantUpdatePromises = [];

    const tenantsCurrentlyInThisRoom = await Tenant.find({ room: roomToUpdate.name });
    const newAssignedTenantIdsInRequest = [];

    if (bedAssignments && Array.isArray(bedAssignments)) {
      bedAssignments.forEach((tenantIdOrNull, index) => {
        const bedNumberStr = String(index + 1); 

        if (tenantIdOrNull) { 
          const tenantId = tenantIdOrNull.toString();
          newOccupancyCount++;
          newAssignedTenantIdsInRequest.push(tenantId);

          const existingTenantRecord = tenantsCurrentlyInThisRoom.find(t => t._id.toString() === tenantId);

          if (existingTenantRecord) {
            if (existingTenantRecord.bedNumber !== bedNumberStr || existingTenantRecord.status !== 'Active' || existingTenantRecord.room !== roomIdentifierForTenant) {
              tenantUpdatePromises.push(
                Tenant.findByIdAndUpdate(tenantId, {
                  room: roomIdentifierForTenant,
                  bedNumber: bedNumberStr,
                  status: 'Active'
                })
              );
            }
          } else {
            // Tenant is new to this room. We assume any previous room unassignment is handled by updateTenant or a dedicated service.
            tenantUpdatePromises.push(
              Tenant.findByIdAndUpdate(tenantId, {
                room: roomIdentifierForTenant,
                bedNumber: bedNumberStr,
                status: 'Active'
                // previousRoom field handling removed for now, will be managed by tenant update logic if needed
              })
            );
          }
        }
      });

      const tenantsToUnassignCompletely = tenantsCurrentlyInThisRoom.filter(
        tenant => !newAssignedTenantIdsInRequest.includes(tenant._id.toString())
      );

      tenantsToUnassignCompletely.forEach(tenantToUnassign => {
        tenantUpdatePromises.push(
          Tenant.findByIdAndUpdate(tenantToUnassign._id, {
            room: '', 
            bedNumber: '', 
            status: 'Pending Allocation' 
          })
        );
      });

    } else if (bedAssignments === undefined) {
      newOccupancyCount = tenantsCurrentlyInThisRoom.filter(t => t.status === 'Active').length;
    }

    if (roomUpdates.occupancy) {
      roomUpdates.occupancy.current = newOccupancyCount;
    } else {
      roomUpdates.occupancy = { ...roomToUpdate.occupancy, current: newOccupancyCount };
    }

    const maxOccupancy = roomUpdates.occupancy?.max !== undefined ? parseInt(roomUpdates.occupancy.max, 10) : parseInt(roomToUpdate.occupancy?.max, 10);
    if (newOccupancyCount > maxOccupancy) {
      return res.status(400).json({ message: `Cannot assign ${newOccupancyCount} tenants to a room with max capacity ${maxOccupancy}.` });
    }
    
    await Promise.all(tenantUpdatePromises);

    const updatedRoom = await Room.findByIdAndUpdate(id, roomUpdates, { new: true }).populate('roomConfigurationType');

    if (!updatedRoom) {
      return res.status(404).json({ message: 'Room not found after update attempt' });
    }

    res.status(200).json(updatedRoom);
  } catch (error) {
    console.error('Error updating room:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

exports.deleteRoom = async (req, res) => {
  try {
    const { id } = req.params;
    const room = await Room.findByIdAndDelete(id);
    if (!room) return res.status(404).json({ error: 'Room not found' });
    res.status(200).json({ message: 'Room deleted successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getRoomById = async (req, res) => {
  try {
    const { id } = req.params;
    const room = await Room.findById(id).populate('roomConfigurationType');
    if (!room) return res.status(404).json({ error: 'Room not found' });
    res.status(200).json(room);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getAvailableRooms = async (req, res) => {
  try {
    const { roomConfigurationTypeId } = req.query;
    if (!roomConfigurationTypeId) {
      return res.status(400).json({ status: 'error', message: 'Room configuration type ID is required.' });
    }
    const availableRooms = await Room.find({
      roomConfigurationType: roomConfigurationTypeId,
      blocked: false,
      $expr: { $lt: ["$occupancy.current", "$occupancy.max"] }
    }).populate('roomConfigurationType');

    res.status(200).json({ status: 'success', data: availableRooms });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

exports.getAvailableRoomTypes = async (req, res) => {
  try {
    const availableRooms = await Room.find({
      blocked: false,
      $expr: { $lt: ["$occupancy.current", "$occupancy.max"] },
      roomConfigurationType: { $ne: null }
    }).populate('roomConfigurationType');

    if (!availableRooms || availableRooms.length === 0) {
      return res.status(200).json({ status: 'success', data: [] });
    }

    const uniqueConfigTypes = {};
    availableRooms.forEach(room => {
      if (room.roomConfigurationType) {
        const config = room.roomConfigurationType;
        if (!uniqueConfigTypes[config._id.toString()]) {
          uniqueConfigTypes[config._id.toString()] = {
            _id: config._id.toString(),
            name: config.name,
          };
        }
      }
    });

    const availableTypes = Object.values(uniqueConfigTypes);

    res.status(200).json({ status: 'success', data: availableTypes });
  } catch (error) {
    console.error('Error fetching available room types:', error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch available room types: ' + error.message });
  }
};