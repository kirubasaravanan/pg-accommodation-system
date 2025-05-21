import React from 'react';

const RoomsTab = ({
  rooms,
  filteredRooms,
  roomForm,
  editingRoomId,
  editingRoomRowId,
  editingRoomForm,
  ROOM_TYPE_PRICES,
  ROOM_TYPES,
  ROOM_TYPE_ALTERNATES,
  handleRoomFormChange,
  handleAddRoom,
  handleUpdateRoom,
  handleEditRoom,
  handleDeleteRoom,
  setEditingRoomId,
  setRoomForm,
  setEditingRoomRowId,
  setEditingRoomForm,
  getTenantsForRoom,
  navigate,
  setShowAddRoomTypeModal,
  totalRooms,
  totalOccupied,
  totalVacant
}) => (
  <>
    <div style={{ background: '#f9fbe7', padding: '8px 12px', marginBottom: 8, fontWeight: 500, color: '#666', borderRadius: 4 }}>
      Unoccupied Rooms: <span style={{ color: '#1976d2' }}>(Five Occupancy)</span> - 1D, 2D, 3D <span style={{ color: '#1976d2', marginLeft: 12 }}>(Four Occupancy)</span> - 1E, 2A, 2E, 3A, 3E <span style={{ color: '#1976d2', marginLeft: 12 }}>(Private)</span> - 1B, 1C, 1F, 1G, 1H, 2C, 2F, 2G, 2H, 3B, 3C, 3F, 3G, 3H <span style={{ color: '#1976d2', marginLeft: 12 }}>(Private Mini)</span> - 1I, 2I, 3I
    </div>
    <form onSubmit={editingRoomId ? handleUpdateRoom : handleAddRoom} style={{ marginBottom: 20 }}>
      <input name="name" placeholder="Room Name" value={roomForm.name} onChange={handleRoomFormChange} required />
      <input name="location" placeholder="Location" value={roomForm.location} onChange={handleRoomFormChange} required />
      <input name="price" type="number" placeholder="Price" value={ROOM_TYPE_PRICES[roomForm.type] || ''} readOnly style={{ background: '#eee' }} />
      <select name="type" value={roomForm.type} onChange={handleRoomFormChange} required disabled={editingRoomId && roomForm.occupancy.current > 0}>
        <option value="">Select Type</option>
        {ROOM_TYPES.map(type => (
          <option key={type} value={type}>{type}</option>
        ))}
      </select>
      {/* If editing and occupancy is 0, show alternate type switcher */}
      {editingRoomId && roomForm.occupancy.current === 0 && ROOM_TYPE_ALTERNATES[roomForm.type] && ROOM_TYPE_ALTERNATES[roomForm.type].length > 0 && (
        <div style={{ margin: '8px 0' }}>
          <label>Change to: </label>
          <select onChange={e => setRoomForm({ ...roomForm, type: e.target.value })} value="">
            <option value="">Select alternate type</option>
            {ROOM_TYPE_ALTERNATES[roomForm.type].map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
      )}
      <input name="occupancy.max" type="number" placeholder="Max Occupancy" value={roomForm.occupancy.max} onChange={handleRoomFormChange} required />
      <button type="submit">{editingRoomId ? 'Update Room' : 'Add Room'}</button>
      {editingRoomId && <button type="button" onClick={() => { setEditingRoomId(null); setRoomForm({ name: '', location: '', price: '', type: '', occupancy: { current: 0, max: '' } }); }}>Cancel</button>}
    </form>
    <div style={{ marginBottom: 12 }}>
      <button onClick={() => navigate('/tariffs')} style={{ marginLeft: 12 }}>View Tariff Details</button>
      <button onClick={() => setShowAddRoomTypeModal(true)} style={{ marginLeft: 12 }}>Add Room Type</button>
      <button onClick={() => navigate('/reports')} style={{ marginLeft: 12, background: '#1976d2' }}>Reports</button>
    </div>
    <table className="room-table">
      <thead>
        <tr style={{ background: '#e3f2fd', fontWeight: 'bold' }}>
          <td colSpan={8}>
            Total Rooms: {totalRooms} | Occupied: {totalOccupied} | Vacant: {totalVacant}
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
          <th>Vacant</th>
          <th>Tenants</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {filteredRooms.map((room) => {
          const tenantsInRoom = getTenantsForRoom(room.name);
          const vacant = room.occupancy.max - tenantsInRoom.length;
          const overOccupied = tenantsInRoom.length > room.occupancy.max;
          const isEditing = editingRoomRowId === room._id;
          return (
            <tr key={room._id} style={overOccupied ? { background: '#ffeaea' } : {}}>
              {isEditing ? (
                <>
                  <td><input name="name" value={editingRoomForm.name} onChange={e => setEditingRoomForm({ ...editingRoomForm, name: e.target.value })} /></td>
                  <td>
                    <select name="type" value={editingRoomForm.type} onChange={e => {
                      const newType = e.target.value;
                      let newMax = editingRoomForm.occupancy?.max;
                      if (newType === 'Private' || newType === 'Private Mini') newMax = 1;
                      else if (newType === 'Double Occupancy') newMax = 2;
                      else if (newType === 'Triple Occupancy') newMax = 3;
                      else if (newType === 'Four Occupancy') newMax = 4;
                      else if (newType === 'Five Occupancy') newMax = 5;
                      setEditingRoomForm({ ...editingRoomForm, type: newType, occupancy: { ...editingRoomForm.occupancy, max: newMax } });
                    }}>
                      {[editingRoomForm.type, ...(ROOM_TYPE_ALTERNATES[editingRoomForm.type] || [])].filter((v, i, arr) => arr.indexOf(v) === i).map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </td>
                  <td><input name="location" value={editingRoomForm.location} onChange={e => setEditingRoomForm({ ...editingRoomForm, location: e.target.value })} /></td>
                  <td><input name="price" type="number" value={editingRoomForm.price} readOnly style={{ background: '#eee' }} /></td>
                  <td>
                    <input name="occupancy.max" type="number" value={editingRoomForm.occupancy?.max} readOnly style={{ background: '#eee' }} />
                  </td>
                  <td>{tenantsInRoom.length}</td>
                  <td>{vacant}</td>
                  <td>{tenantsInRoom.map(t => (<span key={t._id} style={{ display: 'inline-block', marginRight: 8 }}>{t.name}</span>))}</td>
                  <td>
                    <button onClick={() => handleSaveRoomInline(room._id)}>Save</button>
                    <button onClick={() => setEditingRoomRowId(null)} style={{ marginLeft: 8 }}>Cancel</button>
                  </td>
                </>
              ) : (
                <>
                  <td>{room.name}</td>
                  <td>{room.type || 'N/A'}</td>
                  <td>{room.location}</td>
                  <td>₹{room.price}</td>
                  <td>{room.occupancy.max || 'N/A'}</td>
                  <td>{tenantsInRoom.length}</td>
                  <td>{vacant}</td>
                  <td>{tenantsInRoom.map(t => (<span key={t._id} style={{ display: 'inline-block', marginRight: 8 }}>{t.name}</span>))}</td>
                  <td>
                    <button onClick={() => { setEditingRoomRowId(room._id); setEditingRoomForm(room); }}>Edit</button>
                    <button onClick={() => handleDeleteRoom(room._id)} style={{ marginLeft: 8 }}>Delete</button>
                  </td>
                </>
              )}
            </tr>
          );
        })}
      </tbody>
    </table>
  </>
);

export default RoomsTab;
