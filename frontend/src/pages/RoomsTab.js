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
  getTenantsForRoom,
  rentForecast, 
  totalCapacity, 
  totalOccupiedBeds, 
  totalVacantBeds,
}) => {

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
        typeof room.roomConfigurationType === 'object' && 
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
          <td colSpan={9}>
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
          <th>Vacant Spots</th>
          <th>Tenants</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {(rooms || []).map((room) => {
          const tenantsInRoom = getTenantsForRoom ? getTenantsForRoom(room.name) : [];
          const currentOccupancy = typeof room.occupancy.current === 'number' ? room.occupancy.current : (tenantsInRoom.length || 0);
          const maxOccupancy = typeof room.occupancy.max === 'number' ? room.occupancy.max : 0;
          const vacantSpots = maxOccupancy - currentOccupancy;
          const overOccupied = currentOccupancy > maxOccupancy;
          
          return (
            <tr key={room._id} style={overOccupied ? { background: '#ffeaea' } : {}}>
              <td>{room.name}</td>
              <td>{room.roomConfigurationType ? room.roomConfigurationType.name : (room.type || 'N/A')}</td>
              <td>{room.location}</td>
              <td>₹{room.price}</td>
              <td>{maxOccupancy || 'N/A'}</td>
              <td>{currentOccupancy}</td>
              <td>{vacantSpots < 0 ? 0 : vacantSpots}</td>
              <td>{tenantsInRoom.map(t => (<span key={t._id} style={{ display: 'inline-block', marginRight: 8 }}>{t.name}</span>))}</td>
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
