import React from 'react';

const RoomsTab = ({
  rooms,
  roomForm,
  roomConfigurationTypes,
  handleRoomFormChange,
  handleAddRoom,
  handleEditRoom, 
  handleDeleteRoom,
  setRoomForm,
  getTenantsForRoom, // This function should provide tenant objects including 'intendedVacationDate' and 'isActive' status
  rentForecast, 
  totalCapacity, 
  totalOccupiedBeds, 
  totalVacantBeds,
}) => {

  // Helper function for consistent and safe date formatting
  const formatDateSafely = (dateInput) => {
    if (!dateInput) return '';
    try {
      const date = new Date(dateInput);
      if (isNaN(date.getTime())) {
        // console.warn("Invalid date for formatting:", dateInput); // Optional: for debugging
        return 'Invalid Date';
      }
      // Apply timezone adjustment to prevent date shift with toLocaleDateString
      const offset = date.getTimezoneOffset();
      const adjustedDate = new Date(date.getTime() + (offset * 60 * 1000));
      return adjustedDate.toLocaleDateString();
    } catch (e) {
      // console.error("Error formatting date:", dateInput, e); // Optional: for debugging
      return 'Error';
    }
  };

  // Calculate unoccupied rooms grouped by type
  const unoccupiedRoomsByType = (rooms || []).reduce((acc, room) => {
    if (!room || typeof room.occupancy !== 'object' || room.occupancy === null) {
      return acc;
    }
    const currentOccupancy = typeof room.occupancy.current === 'number' ? room.occupancy.current : 0;
    const maxOccupancy = typeof room.occupancy.max === 'number' ? room.occupancy.max : 0;
    const hasVacantSpots = (maxOccupancy - currentOccupancy) > 0;

    if (hasVacantSpots && 
        room.roomConfigurationType && 
        typeof room.roomConfigurationType === 'object' && // Ensure it's an object before accessing name
        typeof room.roomConfigurationType.name === 'string' && 
        room.roomConfigurationType.name.trim() !== '') {
      const typeName = room.roomConfigurationType.name;
      if (typeof room.name === 'string' && room.name.trim() !== '') {
        if (!acc[typeName]) {
          acc[typeName] = [];
        }
        acc[typeName].push(room.name);
      }
    }
    return acc;
  }, {});

  const totalRoomsCount = rooms ? rooms.length : 0;

  return (
  <>
    {/* Rent Forecast Display */}
    <div style={{ background: '#e3f2fd', padding: '10px 15px', marginBottom: 15, fontWeight: 'bold', fontSize: '1.1em', textAlign: 'center', borderRadius: 4 }}>
      Rent Forecast for Occupied Beds: ₹{rentForecast ? rentForecast.toLocaleString() : '0'}
    </div>

    {/* Dynamically generated list of unoccupied rooms by type */}
    <div style={{ background: '#f9fbe7', padding: '8px 12px', marginBottom: 8, fontWeight: 500, color: '#666', borderRadius: 4 }}>
      Unoccupied Rooms: 
      {Object.entries(unoccupiedRoomsByType).length > 0 ? (
        Object.entries(unoccupiedRoomsByType).map(([typeName, roomNames]) => (
          <span key={typeName} style={{ color: '#1976d2', marginLeft: 12 }}>
            ({typeName}) - {roomNames.join(', ')}
          </span>
        ))
      ) : (
        <span style={{ marginLeft: 5 }}>All rooms are fully occupied or no rooms available.</span>
      )}
    </div>

    {/* Form for adding a new room */}
    <form onSubmit={handleAddRoom} style={{ marginBottom: 20 }}>
      <input name="name" placeholder="Room Name" value={roomForm.name} onChange={handleRoomFormChange} required />
      <input name="location" placeholder="Location" value={roomForm.location} onChange={handleRoomFormChange} required />
      
      <select 
        name="roomConfigurationType" 
        value={roomForm.roomConfigurationType || ''} 
        onChange={handleRoomFormChange} 
        required
      >
        <option value="">Select Configuration Type</option>
        {roomConfigurationTypes && roomConfigurationTypes.map(configType => (
          <option key={configType._id} value={configType._id}>{configType.name}</option>
        ))}
      </select>

      <input name="price" type="number" placeholder="Price" value={roomForm.price} readOnly style={{ background: '#eee' }} />
      <input name="occupancy.max" type="number" placeholder="Max Occupancy" value={roomForm.occupancy.max} readOnly style={{ background: '#eee' }} />
      
      <button type="submit">Add Room</button>
      <button type="button" onClick={() => { 
        setRoomForm({ name: '', location: '', price: '', roomConfigurationType: '', occupancy: { current: 0, max: '' } }); 
      }} style={{ marginLeft: 8 }}>Clear Form</button>
    </form>

    <div style={{ marginBottom: 12 }}>
      {/* Buttons removed as per previous discussion, functionality to be re-evaluated */}
    </div>

    <table className="room-table">
      <thead>
        <tr style={{ background: '#e3f2fd', fontWeight: 'bold' }}>
          <td colSpan={10}> {/* Increased colspan for the new column */}
            Total Rooms: {totalRoomsCount} | Total Capacity: {totalCapacity || 0} | Occupied Beds: {totalOccupiedBeds || 0} | Vacant Beds: {totalVacantBeds || 0}
          </td>
        </tr>
      </thead>
    </table>
    <table className="room-table">
      <thead>
        <tr>
          <th>Room Name</th>
          <th>Type</th>
          <th>Location</th>
          <th>Price (per occupant)</th>
          <th>Max Occupancy</th>
          <th>Current Occupancy</th>
          <th>Vacant Beds</th> {/* Renamed from Vacant Spots */}
          <th>Availability</th> {/* New Column */}
          <th>Tenants</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {(rooms || []).map((room) => {
          if (!room || !room._id) return null; // Add a guard for undefined room object or missing _id
          const tenantsInRoom = getTenantsForRoom ? getTenantsForRoom(room._id) : []; // Use room._id
          
          // --- BEGIN LOGGING ---
          console.log(`[RoomsTab] Processing room: ${room.name} (ID: ${room._id})`);
          console.log(`[RoomsTab] Tenants for room ${room.name}:`, JSON.stringify(tenantsInRoom, null, 2));
          tenantsInRoom.forEach(t => console.log(`[RoomsTab] Tenant details: ID: ${t._id}, Name: ${t.name}, Room from tenant object: ${JSON.stringify(t.room)}`));
          // --- END LOGGING ---

          // Ensure maxOccupancy is a non-negative number, defaulting to 0
          const maxOccupancy = (room.occupancy && typeof room.occupancy.max === 'number' && room.occupancy.max >= 0) 
                             ? room.occupancy.max 
                             : 0;

          // Ensure currentOccupancy is a non-negative number
          // It should ideally not exceed maxOccupancy if data is consistent
          let currentOccupancy = (room.occupancy && typeof room.occupancy.current === 'number' && room.occupancy.current >= 0)
                                   ? room.occupancy.current
                                   : tenantsInRoom.filter(t => t.status === 'Active').length;
          
          // Clamp currentOccupancy to be at most maxOccupancy, though ideally backend should ensure this
          currentOccupancy = Math.min(currentOccupancy, maxOccupancy);

          // Calculate vacantBeds, ensuring it's not negative
          const vacantBeds = Math.max(0, maxOccupancy - currentOccupancy);
          const overOccupied = currentOccupancy > maxOccupancy; // This should ideally be false with the clamping above

          let availabilityStatus = '';
          let earliestVacationDateStr = '';

          const activeTenantsWithIntendedVacationDate = tenantsInRoom.filter(
            tenant => (tenant.isActive !== false) && tenant.intendedVacationDate
          );

          if (activeTenantsWithIntendedVacationDate.length > 0) {
            // Sort by date to find the earliest
            activeTenantsWithIntendedVacationDate.sort((a, b) => new Date(a.intendedVacationDate) - new Date(b.intendedVacationDate));
            // Use the helper function for formatting
            earliestVacationDateStr = formatDateSafely(activeTenantsWithIntendedVacationDate[0].intendedVacationDate);
          }
          
          if (earliestVacationDateStr && earliestVacationDateStr !== 'Invalid Date' && earliestVacationDateStr !== 'Error') {
            // If a tenant is vacating, the room will be available soon.
            availabilityStatus = `Available Soon (tentatively from ${earliestVacationDateStr})`;
          } else if (vacantBeds > 0) {
            availabilityStatus = 'Available';
          } else {
            availabilityStatus = 'Occupied';
          }
          
          return (
            <tr key={room._id} style={overOccupied ? { background: '#ffeaea' } : {}}>
              <td>{room.name || 'N/A'}</td>
              <td>{room.roomConfigurationType && typeof room.roomConfigurationType === 'object' ? room.roomConfigurationType.name : (typeof room.roomConfigurationType === 'string' ? room.roomConfigurationType : 'N/A')}</td>
              <td>{room.location || 'N/A'}</td>
              <td>₹{typeof room.price === 'number' ? room.price : 'N/A'}</td>
              <td>{maxOccupancy}</td>
              <td>{currentOccupancy}</td>
              <td>{vacantBeds}</td>
              <td style={{ fontWeight: availabilityStatus.startsWith('Available Soon') ? 'bold' : 'normal', color: availabilityStatus.startsWith('Available Soon') ? 'orange' : (availabilityStatus === 'Available' ? 'green' : 'red') }}>
                {availabilityStatus}
              </td>
              <td>
                {(tenantsInRoom || []).map(tenant => {
                  if (!tenant || !tenant._id) return null; // Guard for invalid tenant object
                  const isActiveTenant = tenant.status === 'Active'; 
                  const showAsVacating = isActiveTenant && tenant.intendedVacationDate;
                  
                  const vacationDateDisplay = tenant.intendedVacationDate ? formatDateSafely(tenant.intendedVacationDate) : '';

                  return (
                    <span 
                      key={tenant._id} 
                      style={{ 
                        display: 'inline-block', 
                        marginRight: '8px',
                        marginBottom: '4px', // Add some bottom margin for wrapped tenant lists
                        padding: '2px 6px', 
                        borderRadius: '4px', 
                        border: isActiveTenant ? '1px solid transparent' : '1px dashed #ccc',
                        textDecoration: showAsVacating ? 'line-through' : 'none',
                        color: isActiveTenant ? (showAsVacating ? '#c65102' : 'inherit') : '#757575', // Darker orange for vacating, grey for inactive
                        fontStyle: !isActiveTenant ? 'italic' : 'normal',
                        backgroundColor: !isActiveTenant ? '#f5f5f5' : (showAsVacating ? '#fff3e0' : 'transparent'),
                        fontSize: '0.9em' // Slightly smaller font for tenant names
                      }}
                    >
                      {tenant.name}
                      {showAsVacating && vacationDateDisplay && vacationDateDisplay !== 'Invalid Date' && vacationDateDisplay !== 'Error' ? ` (vacating ${vacationDateDisplay})` : ''}
                      {!isActiveTenant ? ' (Inactive)' : ''}
                    </span>
                  );
                })}
              </td>
              <td>
                <button onClick={() => handleEditRoom(room)}>Edit</button>
                <button onClick={() => handleDeleteRoom(room._id)} style={{ marginLeft: 8 }}>Delete</button>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  </>
);}

export default RoomsTab;
