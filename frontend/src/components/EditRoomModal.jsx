import React from 'react';

const EditRoomModal = ({ editingRoom, tenants, handleCancelEditRoom, handleSaveRoom, setEditingRoom, fetchRooms, fetchTenants, handleAssignTenantToRoom }) => {
  if (!editingRoom) return null;

  // Updated modal background color to match the Admin Dashboard sidebar
  const modalStyle = {
    backgroundColor: '#6C8EBF', // Sidebar blue color
    color: 'white',
    padding: '20px',
    borderRadius: '8px',
  };

  // Updated styles for Bed labels and values
  const bedLabelStyle = {
    color: 'white', // White font for labels
    fontWeight: 'bold',
  };

  const bedValueStyle = {
    color: '#800000', // Dark maroon for values
    fontWeight: 'bold',
  };

  const removeButtonStyle = {
    background: 'none',
    border: 'none',
    color: '#FF0000', // Darker red for better visibility
    fontWeight: 'bold',
    fontSize: '20px', // Slightly larger font size
    cursor: 'pointer',
    marginLeft: 4,
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ ...modalStyle, minWidth: 320, boxShadow: '0 4px 32px rgba(0,0,0,0.12)' }}>
        {/* Updated modal close icon style for better visibility */}
        <button
          onClick={handleCancelEditRoom}
          style={{
            background: 'none',
            border: 'none',
            color: '#FFFFFF', // Darker white for better contrast
            fontSize: '24px', // Slightly larger font size
            fontWeight: 'bold',
            cursor: 'pointer',
            position: 'absolute',
            top: '10px',
            right: '10px',
          }}
        >
          &times;
        </button>
        <h3>Edit Room</h3>
        <form onSubmit={handleSaveRoom} autoComplete="off">
          <div style={{ marginBottom: 12 }}>
            <label>Name: <input value={editingRoom.name} readOnly style={{ marginLeft: 8, background: '#eee' }} /></label>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label>Location: <input value={editingRoom.location} readOnly style={{ marginLeft: 8, background: '#eee' }} /></label>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label>Type: <select value={editingRoom.type} onChange={e => {
              const newType = e.target.value;
              let newPrice = editingRoom.price;
              let newMax = editingRoom.occupancy.max;
              if (newType === 'Private Mini') { newPrice = 7500; newMax = 1; }
              else if (newType === 'Private') { newPrice = 8500; newMax = 1; }
              else if (newType === 'Double Occupancy') { newPrice = 5800; newMax = 2; }
              else if (newType === 'Triple Occupancy') { newPrice = 4800; newMax = 3; }
              else if (newType === 'Four Occupancy') { newPrice = 4000; newMax = 4; }
              else if (newType === 'Five Occupancy') { newPrice = 3800; newMax = 5; }
              setEditingRoom({ ...editingRoom, type: newType, price: newPrice, occupancy: { ...editingRoom.occupancy, max: newMax } });
            }} style={{ marginLeft: 8 }}>
              <option value="Private Mini">Private Mini</option>
              <option value="Private">Private</option>
              <option value="Double Occupancy">Double Occupancy</option>
              <option value="Triple Occupancy">Triple Occupancy</option>
              <option value="Four Occupancy">Four Occupancy</option>
              <option value="Five Occupancy">Five Occupancy</option>
            </select></label>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label>Price: <input type="number" value={editingRoom.price} readOnly style={{ marginLeft: 8, background: '#eee' }} /></label>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label>Max Occupancy: <input type="number" value={editingRoom.occupancy.max} readOnly style={{ marginLeft: 8, background: '#eee' }} /></label>
          </div>
          {/* Multi-tenant Assignment UI */}
          <div style={{ marginBottom: 12 }}>
            <label>Assign Tenants:</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 6 }}>
              {Array.from({ length: editingRoom.occupancy.max }).map((_, idx) => {
                const assignedTenants = tenants.filter(t => t.room === editingRoom.name);
                const tenant = assignedTenants[idx];
                return (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={bedLabelStyle}>Bed {idx + 1}:</span>
                    {tenant ? (
                      <>
                        <span style={bedValueStyle}>{tenant.name} ({tenant.contact})</span>
                        <button
                          type="button"
                          title="Remove tenant"
                          style={removeButtonStyle}
                          onClick={async () => {
                            const token = localStorage.getItem('token');
                            if (!token) { alert('You are not logged in. Please log in again.'); return; }
                            try {
                              await axios.put(`http://localhost:5000/api/tenants/${tenant._id}`, { ...tenant, room: '' }, {
                                headers: { Authorization: `Bearer ${token}` },
                              });
                              // Re-fetch rooms and tenants after removal
                              Promise.all([
                                fetchRooms(),
                                fetchTenants(),
                              ]).then(([roomsRes, tenantsRes]) => {
                                // You may want to update parent state here
                              });
                            } catch (err) {
                              alert('Failed to remove tenant from room.');
                            }
                          }}
                        >
                          ×
                        </button>
                      </>
                    ) : (
                      <>
                        <select
                          value={''}
                          onChange={e => {
                            if (e.target.value) {
                              handleAssignTenantToRoom(e.target.value, editingRoom);
                            }
                          }}
                          style={{ minWidth: 160 }}
                        >
                          <option value="">Assign tenant...</option>
                          {tenants.filter(t => t.status === 'Active' && (!t.room || t.room === '')).map(t => (
                            <option key={t._id} value={t._id}>{t.name} ({t.contact})</option>
                          ))}
                        </select>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
            <button type="submit" style={{ background: '#6b8bbd', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 24px', fontWeight: 600 }}>Save</button>
            <button type="button" onClick={handleCancelEditRoom} style={{ background: '#eee', color: '#333', border: 'none', borderRadius: 8, padding: '8px 24px', fontWeight: 600 }}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditRoomModal;
