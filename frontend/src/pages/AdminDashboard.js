import React, { useState, useEffect } from 'react';
import './AdminDashboard.css';
import axios from 'axios';
import RentSecurityTab from './RentSecurityTab';
import { useNavigate } from 'react-router-dom';

// Room type alternates logic
const ROOM_TYPE_ALTERNATES = {
  'Private': ['Double Occupancy'],
  'Double Occupancy': ['Private'],
  'Triple Occupancy': ['Four Occupancy', 'Five Occupancy'],
  'Four Occupancy': ['Triple Occupancy', 'Five Occupancy'],
  'Five Occupancy': ['Four Occupancy', 'Triple Occupancy'],
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

const ACCOMMODATION_TYPES = ['monthly', 'daily'];
const RENT_STATUS = ['paid', 'due', 'partial'];

const ROOM_TYPE_PRICES = {
  'Private Mini': 7500,
  'Private': 8500,
  'Double Occupancy': 5800,
  'Triple Occupancy': 4800,
  'Four Occupancy': 4000,
  'Five Occupancy': 3800,
};

const AdminDashboard = () => {
  const [rooms, setRooms] = useState([]);
  const [activeTab, setActiveTab] = useState('rooms');
  const [tenants, setTenants] = useState([]);
  const [tenantForm, setTenantForm] = useState({ id: null, name: '', contact: '', email: '', room: '', status: 'Active', moveInDate: '', moveOutDate: '', accommodationType: 'monthly', rentPaidStatus: 'due', rentDueDate: '', rentPaymentDate: '', bookingHistory: [], customRent: '' });
  const [editingTenantId, setEditingTenantId] = useState(null);
  const [roomForm, setRoomForm] = useState({ name: '', location: '', price: '', type: '', occupancy: { current: 0, max: '' } });
  const [editingRoomId, setEditingRoomId] = useState(null);
  const [error, setError] = useState('');

  // New state for assignment dropdown per room
  const [assignTenantState, setAssignTenantState] = useState({}); // { [roomName]: tenantId }
  const [showAssignButton, setShowAssignButton] = useState({}); // { [roomName]: boolean }

  // New states for booking modal
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedTenantBookings, setSelectedTenantBookings] = useState([]);
  const [selectedTenantName, setSelectedTenantName] = useState('');

  // Add state for editingRoomRowId and editingRoomForm
  const [editingRoomRowId, setEditingRoomRowId] = useState(null);
  const [editingRoomForm, setEditingRoomForm] = useState({});

  // Add state for editingTenantRowId and editingTenantForm
  const [editingTenantRowId, setEditingTenantRowId] = useState(null);
  const [editingTenantForm, setEditingTenantForm] = useState({});

  // Add state for tariff details page and add room type modal
  const [showTariffPage, setShowTariffPage] = useState(false);
  const [showAddRoomTypeModal, setShowAddRoomTypeModal] = useState(false);

  const navigate = useNavigate();

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
    // Only send allowed fields
    const { _id, id, ...roomData } = roomForm;
    const payload = {
      name: roomData.name,
      location: roomData.location,
      price: Number(roomData.price),
      type: roomData.type,
      occupancy: {
        current: getTenantsForRoom(roomData.name).length,
        max: Number(roomData.occupancy.max),
      },
      isBooked: roomData.isBooked || false,
      blocked: roomData.blocked || false,
    };
    axios.put(`http://localhost:5000/api/rooms/${editingRoomId}`, payload, {
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
        setTenantForm({ id: null, name: '', contact: '', email: '', room: '', status: 'Active', moveInDate: '', moveOutDate: '', accommodationType: 'monthly', rentPaidStatus: 'due', rentDueDate: '', rentPaymentDate: '', bookingHistory: [], customRent: '' });
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
    setTenantForm({ id: null, name: '', contact: '', email: '', room: '', status: 'Active', moveInDate: '', moveOutDate: '', accommodationType: 'monthly', rentPaidStatus: 'due', rentDueDate: '', rentPaymentDate: '', bookingHistory: [], customRent: '' });
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
        setTenantForm({ id: null, name: '', contact: '', email: '', room: '', status: 'Active', moveInDate: '', moveOutDate: '', accommodationType: 'monthly', rentPaidStatus: 'due', rentDueDate: '', rentPaymentDate: '', bookingHistory: [], customRent: '' });
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

  // Helper: get available rooms for tenant assignment
  const getAvailableRooms = () => rooms.filter(room => room.occupancy.current < room.occupancy.max);

  // Only filter out GA (not GC)
  const filteredRooms = rooms.filter(room => room.name !== 'GA');

  // Tenant form change handler (restore if missing)
  const handleTenantFormChange = (e) => {
    const { name, value } = e.target;
    setTenantForm({ ...tenantForm, [name]: value });
  };

  const handleAddBooking = () => {
    if (!tenantForm.bookingRoom || !tenantForm.bookingStartDate || !tenantForm.bookingEndDate) return;
    setTenantForm({
      ...tenantForm,
      bookingHistory: [
        ...tenantForm.bookingHistory,
        {
          room: tenantForm.bookingRoom,
          startDate: tenantForm.bookingStartDate,
          endDate: tenantForm.bookingEndDate,
          rentPaidStatus: tenantForm.bookingRentPaidStatus || 'due',
          rentDueDate: tenantForm.bookingRentDueDate || '',
          rentPaymentDate: tenantForm.bookingRentPaymentDate || '',
        },
      ],
      bookingRoom: '',
      bookingStartDate: '',
      bookingEndDate: '',
      bookingRentPaidStatus: 'due',
      bookingRentDueDate: '',
      bookingRentPaymentDate: '',
    });
  };

  const handleViewBookings = (tenant) => {
    setSelectedTenantBookings(tenant.bookingHistory || []);
    setSelectedTenantName(tenant.name);
    setShowBookingModal(true);
  };
  const handleCloseBookingModal = () => {
    setShowBookingModal(false);
    setSelectedTenantBookings([]);
    setSelectedTenantName('');
  };

  // Add handleSaveRoomInline
  const handleSaveRoomInline = (roomId) => {
    // Only send allowed fields
    const { _id, id, ...roomData } = editingRoomForm;
    const payload = {
      name: roomData.name,
      location: roomData.location,
      price: Number(roomData.price),
      type: roomData.type,
      occupancy: {
        current: getTenantsForRoom(roomData.name).length,
        max: Number(roomData.occupancy.max),
      },
      isBooked: roomData.isBooked || false,
      blocked: roomData.blocked || false,
    };
    axios.put(`http://localhost:5000/api/rooms/${roomId}`, payload, {
      headers: { Authorization: token },
    })
      .then((response) => {
        setRooms(rooms.map((room) => (room._id === roomId ? response.data : room)));
        setEditingRoomRowId(null);
        setEditingRoomForm({});
        setError('');
      })
      .catch((err) => {
        setError('Failed to update room.');
      });
  };

  // Add handleSaveTenantInline
  const handleSaveTenantInline = (tenantId) => {
    axios.put(`http://localhost:5000/api/tenants/${tenantId}`, editingTenantForm, {
      headers: { Authorization: token },
    })
      .then((response) => {
        setTenants(tenants.map((t) => (t._id === tenantId ? response.data : t)));
        setEditingTenantRowId(null);
        setEditingTenantForm({});
        setError('');
      })
      .catch((err) => {
        setError('Failed to update tenant.');
      });
  };

  // Room summary row above table
  const totalRooms = filteredRooms.length;
  const totalOccupied = filteredRooms.reduce((sum, room) => sum + getTenantsForRoom(room.name).length, 0);
  const totalVacant = filteredRooms.reduce((sum, room) => sum + (room.occupancy.max - getTenantsForRoom(room.name).length), 0);

  return (
    <>
      <style>{`
        @media (max-width: 800px) {
          .admin-dashboard {
            padding: 0 !important;
          }
          .room-table {
            font-size: 14px !important;
            overflow-x: auto !important;
            display: block !important;
            max-width: 100vw !important;
          }
        }
        @media (max-width: 600px) {
          .admin-dashboard {
            padding: 0 !important;
          }
          .room-table {
            font-size: 13px !important;
            overflow-x: auto !important;
            display: block !important;
            max-width: 100vw !important;
          }
        }
      `}</style>
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
            style={{ marginRight: 10, fontWeight: activeTab === 'tenants' ? 'bold' : 'normal', padding: '8px 16px', borderRadius: 4, border: activeTab === 'tenants' ? '2px solid #4CAF50' : '1px solid #ccc', background: activeTab === 'tenants' ? '#e8f5e9' : '#fff' }}
          >
            Tenants
          </button>
          <button
            onClick={() => setActiveTab('rent')}
            style={{ fontWeight: activeTab === 'rent' ? 'bold' : 'normal', padding: '8px 16px', borderRadius: 4, border: activeTab === 'rent' ? '2px solid #4CAF50' : '1px solid #ccc', background: activeTab === 'rent' ? '#e8f5e9' : '#fff' }}
          >
            Rent & Security
          </button>
        </div>
        {activeTab === 'rooms' && (
          <>
            {/* Only show unoccupied rooms summary here, remove from other places */}
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
        )}
        {activeTab === 'tenants' && (
          <>
            <form onSubmit={editingTenantId ? handleUpdateTenant : handleAddTenant} style={{ marginBottom: 20 }}>
              <input name="name" placeholder="Name" value={tenantForm.name} onChange={handleTenantFormChange} required />
              <input name="contact" placeholder="Contact Number" value={tenantForm.contact} onChange={handleTenantFormChange} required />
              <input name="email" placeholder="Email (kept in DB)" value={tenantForm.email} onChange={handleTenantFormChange} required style={{ display: 'none' }} />
              <select name="room" value={tenantForm.room} onChange={handleTenantFormChange}>
                <option value="">Select Room</option>
                {rooms
                  .sort((a, b) => a.type.localeCompare(b.type) || a.name.localeCompare(b.name))
                  .filter(room => room.occupancy.current < room.occupancy.max)
                  .map(room => (
                    <option key={room._id} value={room.name}>
                      {room.name} ({room.type}, {room.location}) - {room.occupancy.max - room.occupancy.current} vacancy
                    </option>
                  ))}
              </select>
              <select name="status" value={tenantForm.status} onChange={handleTenantFormChange}>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
              <input name="moveInDate" type="date" placeholder="Move In Date (when tenant joins)" value={tenantForm.moveInDate} onChange={handleTenantFormChange} title="Date when tenant moves in" />
              <input name="moveOutDate" type="date" placeholder="Move Out Date (when tenant leaves)" value={tenantForm.moveOutDate} onChange={handleTenantFormChange} title="Date when tenant moves out" />
              <select name="accommodationType" value={tenantForm.accommodationType} onChange={handleTenantFormChange}>
                {ACCOMMODATION_TYPES.map(type => (
                  <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
                ))}
              </select>
              <select name="rentPaidStatus" value={tenantForm.rentPaidStatus} onChange={handleTenantFormChange}>
                {RENT_STATUS.map(status => (
                  <option key={status} value={status}>{status.charAt(0).toUpperCase() + status.slice(1)}</option>
                ))}
              </select>
              {/* Booking history for daily/weekly tenants */}
              {tenantForm.accommodationType === 'daily' && (
                <div style={{ margin: '10px 0', border: '1px solid #ccc', padding: 10, borderRadius: 4 }}>
                  <div><b>Booking History</b></div>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                    <select name="bookingRoom" value={tenantForm.bookingRoom || ''} onChange={handleTenantFormChange}>
                      <option value="">Room</option>
                      {getAvailableRooms().map(room => (
                        <option key={room._id} value={room.name}>{room.name}</option>
                      ))}
                    </select>
                    <input name="bookingStartDate" type="date" placeholder="Booking Start Date" value={tenantForm.bookingStartDate || ''} onChange={handleTenantFormChange} />
                    <input name="bookingEndDate" type="date" placeholder="Booking End Date" value={tenantForm.bookingEndDate || ''} onChange={handleTenantFormChange} />
                    <select name="bookingRentPaidStatus" value={tenantForm.bookingRentPaidStatus || 'due'} onChange={handleTenantFormChange}>
                      {RENT_STATUS.map(status => (
                        <option key={status} value={status}>{status.charAt(0).toUpperCase() + status.slice(1)}</option>
                      ))}
                    </select>
                    <input name="bookingRentDueDate" type="date" placeholder="Booking Rent Due Date" value={tenantForm.bookingRentDueDate || ''} onChange={handleTenantFormChange} />
                    <input name="bookingRentPaymentDate" type="date" placeholder="Booking Rent Payment Date" value={tenantForm.bookingRentPaymentDate || ''} onChange={handleTenantFormChange} />
                    <button type="button" onClick={handleAddBooking}>Add Booking</button>
                  </div>
                  <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                    {tenantForm.bookingHistory.map((b, idx) => (
                      <li key={idx} style={{ fontSize: 13 }}>
                        {b.room} | {b.startDate} to {b.endDate} | Status: {b.rentPaidStatus} | Due: {b.rentDueDate || '-'} | Paid: {b.rentPaymentDate || '-'}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
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
                  <th>Move In</th>
                  <th>Move Out</th>
                  <th>Type</th>
                  <th>Rent Status</th>
                  <th>Bookings</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {tenants.map((tenant) => {
                  const isEditing = editingTenantRowId === tenant._id;
                  return (
                    <tr key={tenant._id}>
                      {isEditing ? (
                        <>
                          <td><input name="name" value={editingTenantForm.name} onChange={e => setEditingTenantForm({ ...editingTenantForm, name: e.target.value })} /></td>
                          <td><input name="contact" value={editingTenantForm.contact} onChange={e => setEditingTenantForm({ ...editingTenantForm, contact: e.target.value })} /></td>
                          <td><input name="room" value={editingTenantForm.room} onChange={e => setEditingTenantForm({ ...editingTenantForm, room: e.target.value })} /></td>
                          <td>
                            <select name="status" value={editingTenantForm.status} onChange={e => setEditingTenantForm({ ...editingTenantForm, status: e.target.value })}>
                              <option value="Active">Active</option>
                              <option value="Inactive">Inactive</option>
                            </select>
                          </td>
                          <td><input name="moveInDate" type="date" value={editingTenantForm.moveInDate} onChange={e => setEditingTenantForm({ ...editingTenantForm, moveInDate: e.target.value })} /></td>
                          <td><input name="moveOutDate" type="date" value={editingTenantForm.moveOutDate} onChange={e => setEditingTenantForm({ ...editingTenantForm, moveOutDate: e.target.value })} /></td>
                          <td><input name="accommodationType" value={editingTenantForm.accommodationType} onChange={e => setEditingTenantForm({ ...editingTenantForm, accommodationType: e.target.value })} /></td>
                          <td><input name="rentPaidStatus" value={editingTenantForm.rentPaidStatus} onChange={e => setEditingTenantForm({ ...editingTenantForm, rentPaidStatus: e.target.value })} /></td>
                          <td>
                            <button onClick={() => handleSaveTenantInline(tenant._id)}>Save</button>
                            <button onClick={() => setEditingTenantRowId(null)} style={{ marginLeft: 8 }}>Cancel</button>
                          </td>
                        </>
                      ) : (
                        <>
                          <td>{tenant.name}</td>
                          <td>{tenant.contact}</td>
                          <td>{tenant.room}</td>
                          <td>{tenant.status}</td>
                          <td>{tenant.moveInDate ? tenant.moveInDate.slice(0,10) : ''}</td>
                          <td>{tenant.moveOutDate ? tenant.moveOutDate.slice(0,10) : ''}</td>
                          <td>{tenant.accommodationType || 'monthly'}</td>
                          <td>{tenant.rentPaidStatus || 'due'}</td>
                          <td>
                            {tenant.bookingHistory && tenant.bookingHistory.length > 0 ? (
                              <button type="button" onClick={() => handleViewBookings(tenant)}>
                                View Bookings
                              </button>
                            ) : (
                              <span style={{ fontSize: 12, color: '#888' }}>No Bookings</span>
                            )}
                          </td>
                          <td>
                            <button onClick={() => { setEditingTenantRowId(tenant._id); setEditingTenantForm(tenant); }}>Edit</button>
                            <button onClick={() => handleDeleteTenant(tenant._id)} style={{ marginLeft: 8 }}>Delete</button>
                          </td>
                        </>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {/* Booking Modal Popup */}
            {showBookingModal && (
              <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                background: 'rgba(0,0,0,0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000,
              }}>
                <div style={{
                  background: '#fff',
                  borderRadius: 8,
                  padding: 24,
                  minWidth: 350,
                  maxWidth: 600,
                  boxShadow: '0 2px 16px rgba(0,0,0,0.2)',
                  position: 'relative',
                }}>
                  <button onClick={handleCloseBookingModal} style={{ position: 'absolute', top: 8, right: 12, fontSize: 18, background: 'none', border: 'none', cursor: 'pointer' }}>×</button>
                  <h2 style={{ marginTop: 0 }}>Bookings for {selectedTenantName}</h2>
                  {selectedTenantBookings.length === 0 ? (
                    <div>No bookings found.</div>
                  ) : (
                    <table className="room-table" style={{ width: '100%', marginTop: 8 }}>
                      <thead>
                        <tr>
                          <th>Room</th>
                          <th>From</th>
                          <th>To</th>
                          <th>Type</th>
                          <th>Rent</th>
                          <th>Status</th>
                          <th>Due Date</th>
                          <th>Payment Date</th>
                          <th>Security</th>
                          <th>Notes</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedTenantBookings.map((b, idx) => (
                          <tr key={idx}>
                            <td>{b.room}</td>
                            <td>{b.startDate ? b.startDate.slice(0,10) : ''}</td>
                            <td>{b.endDate ? b.endDate.slice(0,10) : ''}</td>
                            <td>{b.accommodationType || '-'}</td>
                            <td>{b.customRent ? (<span style={{ color: b.rentPaidStatus === 'paid' ? 'green' : 'red' }}>₹{b.customRent}</span>) : '-'}</td>
                            <td>{b.rentPaidStatus.charAt(0).toUpperCase() + b.rentPaidStatus.slice(1)}</td>
                            <td>{b.rentDueDate ? b.rentDueDate.slice(0,10) : '-'}</td>
                            <td>{b.rentPaymentDate ? b.rentPaymentDate.slice(0,10) : '-'}</td>
                            <td>{b.securityDeposit ? `₹${b.securityDeposit}` : '-'}</td>
                            <td>{b.notes || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            )}
          </>
        )}
        {activeTab === 'rent' && <RentSecurityTab />}
      </div>
    </>
  );
};

export default AdminDashboard;