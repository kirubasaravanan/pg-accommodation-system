import React from 'react';

const EditRoomModal = ({ 
  editingRoom, 
  tenants, 
  handleCancelEditRoom, 
  handleSaveRoom, 
  onFormChange, 
  roomConfigurationTypes 
}) => {
  if (!editingRoom) return null;

  const modalStyle = {
    backgroundColor: '#6C8EBF', 
    color: 'white',
    padding: '20px',
    borderRadius: '8px',
  };

  const bedLabelStyle = {
    color: 'white', 
    fontWeight: 'bold',
  };

  const bedValueStyle = {
    color: '#800000', 
    fontWeight: 'bold',
  };

  const removeButtonStyle = {
    background: 'none',
    border: 'none',
    color: '#FF0000', 
    fontWeight: 'bold',
    fontSize: '20px', 
    cursor: 'pointer',
    marginLeft: 4,
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ ...modalStyle, minWidth: 320, boxShadow: '0 4px 32px rgba(0,0,0,0.12)' }}>
        <button
          onClick={handleCancelEditRoom}
          style={{
            background: 'none',
            border: 'none',
            color: '#FFFFFF',
            fontSize: '24px',
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
            <label>Name: <input name="name" value={editingRoom.name || ''} onChange={onFormChange} style={{ marginLeft: 8 }} /></label>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label>Location: <input name="location" value={editingRoom.location || ''} onChange={onFormChange} style={{ marginLeft: 8 }} /></label>
          </div>
          
          {/* Room Configuration Type Dropdown */}
          <div style={{ marginBottom: 12 }}>
            <label>Configuration Type: 
              <select 
                name="roomConfigurationType" 
                value={editingRoom.roomConfigurationType || ''} 
                onChange={onFormChange} 
                style={{ marginLeft: 8 }}
              >
                <option value="">Select Configuration Type</option>
                {roomConfigurationTypes && roomConfigurationTypes.map(config => (
                  <option key={config._id} value={config._id}>{config.name}</option>
                ))}
              </select>
            </label>
          </div>

          <div style={{ marginBottom: 12 }}>
            <label>Price: <input type="number" name="price" value={editingRoom.price || ''} readOnly style={{ marginLeft: 8, background: '#eee' }} /></label>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label>Max Occupancy: <input type="number" name="occupancy.max" value={editingRoom.occupancy ? editingRoom.occupancy.max : ''} readOnly style={{ marginLeft: 8, background: '#eee' }} /></label>
          </div>

          {/* Displaying current occupancy - assuming this is for info only in edit modal */}
          <div style={{ marginBottom: 12 }}>
            <label>Current Occupancy: <input type="number" value={editingRoom.occupancy ? editingRoom.occupancy.current : 0} readOnly style={{ marginLeft: 8, background: '#eee' }} /></label>
          </div>

          {/* Tenant assignment UI - simplified or removed if not primary focus of this modal now */}
          {/* If keeping tenant assignment, ensure it uses editingRoom.occupancy.max */}
          {editingRoom.occupancy && editingRoom.occupancy.max > 0 && (
            <div style={{ marginBottom: 12 }}>
              <label>Assigned Tenants:</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 6 }}>
                {Array.from({ length: editingRoom.occupancy.max }).map((_, idx) => {
                  const currentRoomTenants = tenants ? tenants.filter(t => t.room === editingRoom._id || t.roomName === editingRoom.name) : [];
                  const tenantForBed = currentRoomTenants[idx]; // This is a simplification
                  return (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={bedLabelStyle}>Bed {idx + 1}:</span>
                      {tenantForBed ? (
                        <span style={bedValueStyle}>{tenantForBed.name}</span>
                      ) : (
                        <span style={{ color: 'lightgrey' }}>Vacant</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20 }}>
            <button type="button" onClick={handleCancelEditRoom} style={{ padding: '8px 12px', background: 'grey', color: 'white', border: 'none', borderRadius: 4 }}>Cancel</button>
            <button type="submit" style={{ padding: '8px 12px', background: 'green', color: 'white', border: 'none', borderRadius: 4 }}>Save Changes</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditRoomModal;
