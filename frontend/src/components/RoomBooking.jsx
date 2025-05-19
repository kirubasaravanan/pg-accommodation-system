import React, { useMemo, useState } from 'react';
import SummaryCard from './SummaryCard';

const RoomBooking = ({ rooms = [], tenants = [], loading, error, onEditRoom, onAssignTenant }) => {
  const [filterVacant, setFilterVacant] = useState(false);

  // DEBUG: Print rooms and tenants to verify rendering
  console.log('RoomBooking render:', { rooms, tenants, loading, error });

  // Calculate summary from rooms prop
  const summary = useMemo(() => {
    if (error) return { totalRooms: '—', vacantRooms: '—', vacantBeds: '—', totalCapacity: '—' };
    const totalRooms = rooms.length;
    // Calculate current occupancy for each room based on tenants
    const getCurrentOccupancy = room => tenants.filter(t => t.room === room.name).length;
    const vacantRooms = rooms.filter(r => (r.occupancy.max - getCurrentOccupancy(r)) > 0).length;
    const vacantBeds = rooms.reduce((acc, room) => acc + (room.occupancy.max - getCurrentOccupancy(room)), 0);
    const totalCapacity = rooms.reduce((acc, room) => acc + (room.occupancy.max || 0), 0);
    return { totalRooms, vacantRooms, vacantBeds, totalCapacity };
  }, [rooms, tenants, error]);

  // Always render summary cards and table headers, even if loading or error
  return (
    <div>
      {/* Room Summary Cards */}
      <div style={{ display: 'flex', gap: 24, marginBottom: 24 }}>
        <SummaryCard label="Total Rooms" value={summary.totalRooms} color="#466fa6" />
        <SummaryCard label="Vacant Rooms" value={summary.vacantRooms} color="#43a047" />
        <SummaryCard label="Vacant Beds" value={summary.vacantBeds} color="#43a047" />
        <SummaryCard label="Total Capacity" value={summary.totalCapacity} color="#7a8ca7" />
      </div>
      {/* Filters */}
      <div style={{ marginBottom: 16 }}>
        <label>
          <input
            type="checkbox"
            checked={filterVacant}
            onChange={e => setFilterVacant(e.target.checked)}
            style={{ marginRight: 8 }}
            disabled={!!error || loading}
          />
          Show only vacant rooms
        </label>
      </div>
      {/* Room Table */}
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 16, background: '#f7faff', borderRadius: 12 }}>
        <thead>
          <tr style={{ color: '#7a8ca7', fontWeight: 600 }}>
            <th style={{ textAlign: 'left', padding: 8 }}>Room Name</th>
            <th style={{ textAlign: 'left', padding: 8 }}>Type</th>
            <th style={{ textAlign: 'left', padding: 8 }}>Location</th>
            <th style={{ textAlign: 'right', padding: 8 }}>Price</th>
            <th style={{ textAlign: 'center', padding: 8 }}>Max Occupancy</th>
            <th style={{ textAlign: 'center', padding: 8 }}>Current Occupancy</th>
            <th style={{ textAlign: 'center', padding: 8 }}>Vacant Beds</th>
            <th style={{ textAlign: 'left', padding: 8 }}>Tenants</th>
            <th style={{ textAlign: 'center', padding: 8 }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan={9} style={{ textAlign: 'center', color: '#888', padding: 24 }}>Loading rooms...</td></tr>
          ) : ((filterVacant ? rooms.filter(r => r.occupancy.max - tenants.filter(t => t.room === r.name).length > 0) : rooms).length === 0 ? (
            <tr>
              <td colSpan={9} style={{ textAlign: 'center', color: '#888', padding: 24 }}>
                {error ? 'Unable to load rooms.' : 'No rooms found.'}
              </td>
            </tr>
          ) : (
            (filterVacant ? rooms.filter(r => r.occupancy.max - tenants.filter(t => t.room === r.name).length > 0) : rooms).map(room => {
              // Calculate current occupancy based on tenants assigned to this room
              const currentOccupancy = tenants.filter(t => t.room === room.name).length;
              const vacantBeds = room.occupancy.max - currentOccupancy;
              let vacantColor = '#43a047';
              if (vacantBeds === 0) vacantColor = '#e53935';
              else if (vacantBeds < room.occupancy.max) vacantColor = '#fbc02d';
              return (
                <tr key={room._id} style={{ borderTop: '1px solid #e3eaf2' }}>
                  <td style={{ padding: 8 }}>{room.name}</td>
                  <td style={{ padding: 8 }}>{room.type}</td>
                  <td style={{ padding: 8 }}>{room.location}</td>
                  <td style={{ padding: 8, textAlign: 'right' }}>₹{room.price}</td>
                  <td style={{ padding: 8, textAlign: 'center' }}>{room.occupancy.max}</td>
                  <td style={{ padding: 8, textAlign: 'center' }}>{currentOccupancy}</td>
                  <td style={{ padding: 8, textAlign: 'center', color: vacantColor, fontWeight: 700 }}>{vacantBeds}</td>
                  <td style={{ padding: 8 }}>
                    {tenants.filter(t => t.room === room.name).map(t => t.name).join(', ') || '-'}
                  </td>
                  <td style={{ padding: 8, textAlign: 'center' }}>
                    <button style={{ marginRight: 8 }} onClick={() => onEditRoom(room)}>Edit</button>
                  </td>
                </tr>
              );
            })
          ))}
        </tbody>
      </table>
      {/* DEBUG: Print a visible message in the UI to confirm rendering */}
      {(!rooms || rooms.length === undefined) && (
        React.createElement('div', { style: { color: 'red', fontWeight: 700 } }, 'RoomBooking component rendered, but no rooms prop received!')
      )}
      {rooms.length === 0 && (
        React.createElement('div', { style: { color: 'blue', fontWeight: 700 } }, 'RoomBooking component rendered, rooms array is empty!')
      )}
    </div>
  );
};

export default RoomBooking;