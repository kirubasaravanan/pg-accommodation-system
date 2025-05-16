import React, { useState, useEffect } from 'react';
import './AdminDashboard.css';
import axios from 'axios';

// Room type change rules
const ROOM_TYPE_ALTERNATES = {
  'Private': ['Double Occupancy'],
  'Double Occupancy': ['Private'],
  'Triple Occupancy': ['Four Occupancy'],
  'Four Occupancy': ['Triple Occupancy', 'Five Occupancy'],
  'Five Occupancy': ['Four Occupancy'],
  'Private Mini': [],
};

const ROOM_TYPES = [
  'Private Mini',
  'Private',
  'Double Occupancy',
  'Triple Occupancy',
  'Four Occupancy',
  'Five Occupancy',
];

const AdminDashboard = () => {
  const [rooms, setRooms] = useState([]);
  const [activeTab, setActiveTab] = useState('rooms');
  const [tenants, setTenants] = useState([]);
  const [tenantForm, setTenantForm] = useState({ id: null, name: '', contact: '', email: '', room: '', status: 'Active' });
  const [editingTenantId, setEditingTenantId] = useState(null);
  const [roomForm, setRoomForm] = useState({ name: '', location: '', price: '', type: '', occupancy: { current: 0, max: '' } });
  const [editingRoomId, setEditingRoomId] = useState(null);
  const [error, setError] = useState('');

  // New state for assignment dropdown per room
  const [assignTenantState, setAssignTenantState] = useState({}); // { [roomName]: tenantId }
  const [showAssignButton, setShowAssignButton] = useState({}); // { [roomName]: boolean }

  useEffect(() => {
    axios.get('http://localhost:5000/api/rooms')
      .then((response) => setRooms(response.data))
      .catch((error) => setError('Failed to fetch rooms.'));
    axios.get('http://localhost:5000/api/tenants')
      .then((response) => setTenants(response.data))
      .catch(() => setTenants([]));
  }, []);

  // Room handlers
  const handleRoomFormChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('occupancy.')) {
      setRoomForm({
        ...roomForm,
        occupancy: {
          ...roomForm.occupancy,
          [name.split('.')[1]]: value,
        },
      });
    } else {
      setRoomForm({ ...roomForm, [name]: value });
    }
  };

  const handleAddRoom = (e) => {
    e.preventDefault();
    axios.post('http://localhost:5000/api/rooms', {
      ...roomForm,
      price: Number(roomForm.price),
      occupancy: {
        current: 0,
        max: Number(roomForm.occupancy.max),
      },
    })
      .then((response) => {
        setRooms([...rooms, response.data]);
        setRoomForm({ name: '', location: '', price: '', type: '', occupancy: { current: 0, max: '' } });
      })
      .catch(() => setError('Failed to add room.'));
  };

  const handleEditRoom = (room) => {
    setEditingRoomId(room._id);
    setRoomForm({ ...room, occupancy: { ...room.occupancy } });
  };

  const token = localStorage.getItem('token') || 'admin-token';
  const handleUpdateRoom = (e) => {
    e.preventDefault();
    const { _id, id, ...roomData } = roomForm;
    axios.put(`http://localhost:5000/api/rooms/${editingRoomId}`, {
      ...roomData,
      price: Number(roomForm.price),
      occupancy: {
        current: getTenantsForRoom(roomForm.name).length, // always sync with actual tenants
        max: Number(roomForm.occupancy.max),
      },
    }, {
      headers: { Authorization: token },
    })
      .then((response) => {
        setRooms(rooms.map((room) => (room._id === editingRoomId ? response.data : room)));
        setEditingRoomId(null);
        setRoomForm({ name: '', location: '', price: '', type: '', occupancy: { current: 0, max: '' } });
        setError('');
      })
      .catch((err) => {
        if (err.response && err.response.data && err.response.data.error) {
          setError('Failed to update room: ' + err.response.data.error);
        } else {
          setError('Failed to update room.');
        }
      });
  };

  const handleDeleteRoom = (roomId) => {
    axios.delete(`http://localhost:5000/api/rooms/${roomId}`)
      .then(() => setRooms(rooms.filter((room) => room._id !== roomId)))
      .catch(() => setError('Failed to delete room.'));
  };

  // Tenant handlers
  const handleAddTenant = (e) => {
    e.preventDefault();
    if (tenants.some(t => t.email === tenantForm.email)) {
      setError('A tenant with this email already exists.');
      return;
    }
    axios.post('http://localhost:5000/api/tenants', tenantForm)
      .then((response) => {
        setTenants([...tenants, response.data]);
        setTenantForm({ id: null, name: '', contact: '', email: '', room: '', status: 'Active' });
        setError('');
      })
      .catch(() => setError('Failed to add tenant.'));
  };
  const handleEditTenant = (tenant) => {
    setEditingTenantId(tenant._id);
    setTenantForm({ ...tenant });
  };
  const handleCancelEditTenant = () => {
    setEditingTenantId(null);
    setTenantForm({ id: null, name: '', contact: '', email: '', room: '', status: 'Active' });
    setError('');
  };
  const handleUpdateTenant = (e) => {
    e.preventDefault();
    const { _id, id, ...tenantData } = tenantForm;
    if (tenants.some(t => t.contact === tenantForm.contact && t._id !== editingTenantId)) {
      setError('A tenant with this contact number already exists.');
      return;
    }
    axios.put(`http://localhost:5000/api/tenants/${editingTenantId}`, tenantData, {
      headers: { Authorization: token },
    })
      .then((response) => {
        setTenants(tenants.map((t) => (t._id === editingTenantId ? response.data : t)));
        setEditingTenantId(null);
        setTenantForm({ id: null, name: '', contact: '', email: '', room: '', status: 'Active' });
        setError('');
      })
      .catch((err) => {
        if (err.response && err.response.data && err.response.data.error) {
          setError('Failed to update tenant: ' + err.response.data.error);
        } else {
          setError('Failed to update tenant.');
        }
      });
  };
  const handleDeleteTenant = (tenantId) => {
    axios.delete(`http://localhost:5000/api/tenants/${tenantId}`)
      .then(() => setTenants(tenants.filter((t) => t._id !== tenantId)))
      .catch(() => setError('Failed to delete tenant.'));
  };

  // Assign/Remove tenant to/from room (updated for button)
  const handleAssignTenantDropdown = (roomName, tenantId) => {
    setAssignTenantState({ ...assignTenantState, [roomName]: tenantId });
    setShowAssignButton({ ...showAssignButton, [roomName]: true });
  };
  const handleAssignTenantUpdate = (roomName) => {
    const tenantId = assignTenantState[roomName];
    if (!tenantId) return;
    const tenant = tenants.find(t => t._id === tenantId);
    if (!tenant) return;
    const { _id, id, ...tenantData } = tenant;
    axios.put(`http://localhost:5000/api/tenants/${tenantId}`, { ...tenantData, room: roomName }, {
      headers: { Authorization: token },
    })
      .then(() => {
        // Refetch both tenants and rooms for full sync
        Promise.all([
          axios.get('http://localhost:5000/api/tenants'),
          axios.get('http://localhost:5000/api/rooms'),
        ]).then(([tenantsRes, roomsRes]) => {
          setTenants(tenantsRes.data);
          setRooms(roomsRes.data);
          setAssignTenantState({ ...assignTenantState, [roomName]: '' });
          setShowAssignButton({ ...showAssignButton, [roomName]: false });
        });
        setError('');
      })
      .catch((err) => {
        if (err.response && err.response.data && err.response.data.error) {
          setError('Failed to assign tenant: ' + err.response.data.error);
        } else {
          setError('Failed to assign tenant.');
        }
      });
  };

  // Assign/Remove tenant to/from room (updated for button)
  // Use the same token as the login bypass in App.js
  const handleRemoveTenantFromRoom = (tenantId) => {
    const tenant = tenants.find(t => t._id === tenantId);
    if (!tenant) return;
    // Remove id field if present, to avoid immutable _id error
    const { _id, id, ...tenantData } = tenant;
    axios.put(`http://localhost:5000/api/tenants/${tenantId}`, { ...tenantData, room: '' }, {
      headers: { Authorization: token },
    })
      .then(() => {
        // Refetch both tenants and rooms for full sync
        Promise.all([
          axios.get('http://localhost:5000/api/tenants'),
          axios.get('http://localhost:5000/api/rooms'),
        ]).then(([tenantsRes, roomsRes]) => {
          setTenants(tenantsRes.data);
          setRooms(roomsRes.data);
        });
        setError('');
      })
      .catch((err) => {
        if (err.response && err.response.data && err.response.data.error) {
          setError('Failed to remove tenant from room: ' + err.response.data.error);
        } else {
          setError('Failed to remove tenant from room.');
        }
      });
  };

  // Helper: get tenants for a room
  const getTenantsForRoom = (roomName) => tenants.filter(t => t.room === roomName);

  // Only filter out GA (not GC)
  const filteredRooms = rooms.filter(room => room.name !== 'GA');

  // Tenant form change handler (restore if missing)
  const handleTenantFormChange = (e) => {
    const { name, value } = e.target;
    setTenantForm({ ...tenantForm, [name]: value });
  };

  return (
    <div className="admin-dashboard">
      <h1>Admin Dashboard</h1>
      {error && <div style={{ color: 'red', marginBottom: 10 }}>{error}</div>}
      <div style={{ marginBottom: 20 }}>
        <button
          onClick={() => setActiveTab('rooms')}
          style={{ marginRight: 10, fontWeight: activeTab === 'rooms' ? 'bold' : 'normal', padding: '8px 16px', borderRadius: 4, border: activeTab === 'rooms' ? '2px solid #4CAF50' : '1px solid #ccc', background: activeTab === 'rooms' ? '#e8f5e9' : '#fff' }}
        >
          Rooms
        </button>
        <button
          onClick={() => setActiveTab('tenants')}
          style={{ fontWeight: activeTab === 'tenants' ? 'bold' : 'normal', padding: '8px 16px', borderRadius: 4, border: activeTab === 'tenants' ? '2px solid #4CAF50' : '1px solid #ccc', background: activeTab === 'tenants' ? '#e8f5e9' : '#fff' }}
        >
          Tenants
        </button>
      </div>
      {activeTab === 'rooms' && (
        <>
          <form onSubmit={editingRoomId ? handleUpdateRoom : handleAddRoom} style={{ marginBottom: 20 }}>
            <input name="name" placeholder="Room Name" value={roomForm.name} onChange={handleRoomFormChange} required />
            <input name="location" placeholder="Location" value={roomForm.location} onChange={handleRoomFormChange} required />
            <input name="price" type="number" placeholder="Price" value={roomForm.price} onChange={handleRoomFormChange} required />
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
          <table className="room-table">
            <thead>
              <tr>
                <th>Room Name</th>
                <th>Location</th>
                <th>Price</th>
                <th>Type</th>
                <th>Max Occupancy</th>
                <th>Current Occupancy</th>
                <th>Tenants</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRooms.map((room) => {
                const tenantsInRoom = getTenantsForRoom(room.name);
                const canAssign = tenantsInRoom.length < room.occupancy.max;
                const overOccupied = tenantsInRoom.length > room.occupancy.max;
                return (
                  <tr key={room._id} style={overOccupied ? { background: '#ffeaea' } : {}}>
                    <td>{room.name}</td>
                    <td>{room.location}</td>
                    <td>₹{room.price}</td>
                    <td>{room.type || 'N/A'}</td>
                    <td>{room.occupancy.max || 'N/A'}</td>
                    <td>{tenantsInRoom.length} / {room.occupancy.max}</td>
                    <td>
                      {tenantsInRoom.map(t => (
                        <span key={t._id} style={{ display: 'inline-block', marginRight: 8 }}>
                          {t.name} <button onClick={() => handleRemoveTenantFromRoom(t._id)} title="Remove from room">x</button>
                        </span>
                      ))}
                      {canAssign && (
                        <>
                          <select
                            value={assignTenantState[room.name] || ''}
                            onChange={e => handleAssignTenantDropdown(room.name, e.target.value)}
                          >
                            <option value="">Assign tenant...</option>
                            {tenants.filter(t => !t.room).map(t => (
                              <option key={t._id} value={t._id}>{t.name} ({t.contact})</option>
                            ))}
                          </select>
                          {showAssignButton[room.name] && assignTenantState[room.name] && (
                            <button style={{ marginLeft: 8 }} onClick={() => handleAssignTenantUpdate(room.name)}>Update</button>
                          )}
                        </>
                      )}
                      {overOccupied && <div style={{ color: 'red', fontWeight: 'bold' }}>Over-occupied!</div>}
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
      )}
      {activeTab === 'tenants' && (
        <>
          <form onSubmit={editingTenantId ? handleUpdateTenant : handleAddTenant} style={{ marginBottom: 20 }}>
            <input name="name" placeholder="Name" value={tenantForm.name} onChange={handleTenantFormChange} required />
            <input name="contact" placeholder="Contact Number" value={tenantForm.contact} onChange={handleTenantFormChange} required />
            <input name="email" placeholder="Email (kept in DB)" value={tenantForm.email} onChange={handleTenantFormChange} required style={{ display: 'none' }} />
            <select name="room" value={tenantForm.room} onChange={handleTenantFormChange}>
              <option value="">Select Room (optional)</option>
              {rooms.map(room => (
                <option key={room._id} value={room.name}>{room.name} ({room.type}, {room.location})</option>
              ))}
            </select>
            <select name="status" value={tenantForm.status} onChange={handleTenantFormChange}>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
            <button type="submit">{editingTenantId ? 'Update Tenant' : 'Add Tenant'}</button>
            {editingTenantId && <button type="button" onClick={handleCancelEditTenant} style={{ marginLeft: 8 }}>Cancel</button>}
          </form>
          <table className="room-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Contact Number</th>
                <th>Room</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tenants.map((tenant) => (
                <tr key={tenant._id}>
                  <td>{tenant.name}</td>
                  <td>{tenant.contact}</td>
                  <td>{tenant.room}</td>
                  <td>{tenant.status}</td>
                  <td>
                    <button onClick={() => handleEditTenant(tenant)}>Edit</button>
                    <button onClick={() => handleDeleteTenant(tenant._id)} style={{ marginLeft: 8 }}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
};

export default AdminDashboard;