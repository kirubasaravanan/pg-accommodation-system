import React, { useState, useEffect } from 'react';
import './AdminDashboard.css';
import axios from 'axios';
import RentSecurityTab from './RentSecurityTab';
import { useNavigate } from 'react-router-dom';
import RoomsTab from './RoomsTab';
import TenantsTab from './TenantsTab';
import styles from './AdminDashboard.module.css';

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
  const [tenantForm, setTenantForm] = useState({
    id: null,
    name: '',
    contact: '',
    email: '',
    aadhaar: '', // Added
    preferredRoomType: '', // Added for registration room preference
    emergencyContact: '', // Added
    remarks: '', // Added
    room: '',
    status: 'Active',
    moveInDate: '',
    moveOutDate: '',
    accommodationType: 'monthly',
    rentPaidStatus: 'due',
    rentDueDate: '',
    rentPaymentDate: '',
    bookingHistory: [],
    customRent: '',
    securityDeposit: { amount: 0, refundableType: 'fully', conditions: '' } // Added securityDeposit
  });
  const [editingTenantId, setEditingTenantId] = useState(null);
  const [roomForm, setRoomForm] = useState({ name: '', location: '', price: '', type: '', occupancy: { current: 0, max: '' } });
  const [editingRoomId, setEditingRoomId] = useState(null);
  const [error, setError] = useState('');
  const [roomError, setRoomError] = useState('');

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

  // Add state for admin registration flow
  const [newTenantId, setNewTenantId] = useState('');
  const [showRoomSelect, setShowRoomSelect] = useState(false);
  const [availableRooms, setAvailableRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState('');
  const [registrationSuccess, setRegistrationSuccess] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    axios.get('http://localhost:5000/api/rooms')
      .then((response) => setRooms(response.data))
      .catch((error) => setError('Failed to fetch rooms.'));
    axios.get('http://localhost:5000/api/tenants')
      .then((response) => setTenants(response.data))
      .catch(() => setTenants([]));
  }, []);

  // Fetch tenants when switching to tenants tab
  useEffect(() => {
    if (activeTab === 'tenants') {
      axios.get('http://localhost:5000/api/tenants')
        .then((response) => setTenants(response.data))
        .catch(() => setTenants([]));
    }
  }, [activeTab]);

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
  const handleAddTenant = async (e) => {
    e.preventDefault();
    setError('');
    setRoomError('');
    setRegistrationSuccess('');
    setShowRoomSelect(false);
    setAvailableRooms([]);
    setSelectedRoom('');
    setNewTenantId('');

    if (tenants.some(t => t.contact === tenantForm.contact)) {
      setError('A tenant with this contact number already exists.');
      return;
    }

    // Log the current state of tenantForm for debugging
    console.log('Current tenantForm state (frontend):', tenantForm);

    const payload = {
      name: tenantForm.name,
      contact: tenantForm.contact, // Or mobile, backend handles both
      email: tenantForm.email || '',
      aadhaar: tenantForm.aadhaar || '',
      joiningDate: tenantForm.moveInDate ? tenantForm.moveInDate : new Date().toISOString().slice(0, 10),
      roomType: tenantForm.preferredRoomType || tenantForm.roomType || tenantForm.type || '', // Use preferredRoomType
      emergencyContact: tenantForm.emergencyContact || '',
      remarks: tenantForm.remarks || '',
    };
    console.log('Register tenant payload (frontend):', payload); // For frontend debugging

    try {
      const res = await axios.post('http://localhost:5000/api/tenants/register', payload);
      console.log('Registration response (frontend):', res.data);

      if (!res.data || res.data.status !== 'success') {
        setError(res.data?.message || 'Registration failed.');
        return;
      }
      const newId = res.data?.data?.tenantId;
      if (!newId) {
        setError('Registration failed: No tenant ID returned. Please contact admin.');
        return;
      }
      setNewTenantId(newId);
      setRegistrationSuccess('Registration complete!');

      try {
        // Use the roomType from the payload for fetching available rooms
        const roomsRes = await axios.get(`http://localhost:5000/api/rooms/available?type=${payload.roomType}`);
        console.log('Available rooms response (frontend):', roomsRes.data);
        setAvailableRooms(roomsRes.data.data);
        setShowRoomSelect(true);
        if (!roomsRes.data.data || roomsRes.data.data.length === 0) {
          setRoomError('No rooms available for this type. Please allocate a room later.');
        }
      } catch (roomErr) {
        setAvailableRooms([]);
        setShowRoomSelect(false);
        setRoomError('No rooms available for this type. Please allocate a room later.');
      }
    } catch (err) {
      console.error('Registration error (frontend):', err.response?.data || err);
      const backendMsg = err.response?.data?.message || err.response?.data?.error || err.response?.data?.status || err.message;
      setError(backendMsg || 'Registration failed.');
    }
  };

  // Admin room allocation after registration
  const handleAdminAllocateRoom = async () => {
    setError('');
    setRegistrationSuccess('');
    if (!selectedRoom) {
      setError('Please select a room number.');
      return;
    }
    try {
      await axios.post('http://localhost:5000/api/tenants/allocate-room', {
        tenantId: newTenantId,
        roomNumber: selectedRoom,
        startDate: new Date().toISOString().slice(0, 10),
        rent: availableRooms.find(r => r.name === selectedRoom)?.price || 0,
      });
      setRegistrationSuccess('Room allocated successfully!');
      setShowRoomSelect(false);
      setSelectedRoom('');
      setNewTenantId('');
      // Refresh tenants list
      const tenantsRes = await axios.get('http://localhost:5000/api/tenants');
      setTenants(tenantsRes.data);
      setTenantForm({ // Reset with new fields
        id: null, name: '', contact: '', email: '', aadhaar: '', preferredRoomType: '', emergencyContact: '', remarks: '',
        room: '', status: 'Active', moveInDate: '', moveOutDate: '', accommodationType: 'monthly',
        rentPaidStatus: 'due', rentDueDate: '', rentPaymentDate: '', bookingHistory: [], customRent: '',
        securityDeposit: { amount: 0, refundableType: 'fully', conditions: '' } // Reset securityDeposit
      });
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Room allocation failed.');
    }
  };

  const handleEditTenant = (tenant) => {
    setEditingTenantId(tenant._id);
    setTenantForm({
        ...tenant,
        aadhaar: tenant.aadhaar || '', // Ensure these fields are part of the form when editing
        preferredRoomType: tenant.roomPreference || tenant.roomType || '',
        emergencyContact: tenant.emergencyContact || '',
        remarks: tenant.remarks || '',
        securityDeposit: tenant.securityDeposit || { amount: 0, refundableType: 'fully', conditions: '' } // Ensure securityDeposit is part of the form
    });
  };
  const handleCancelEditTenant = () => {
    setEditingTenantId(null);
    setTenantForm({ // Reset with new fields
      id: null, name: '', contact: '', email: '', aadhaar: '', preferredRoomType: '', emergencyContact: '', remarks: '',
      room: '', status: 'Active', moveInDate: '', moveOutDate: '', accommodationType: 'monthly',
      rentPaidStatus: 'due', rentDueDate: '', rentPaymentDate: '', bookingHistory: [], customRent: '',
      securityDeposit: { amount: 0, refundableType: 'fully', conditions: '' } // Reset securityDeposit
    });
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
        setTenantForm({ // Reset with new fields
          id: null, name: '', contact: '', email: '', aadhaar: '', preferredRoomType: '', emergencyContact: '', remarks: '',
          room: '', status: 'Active', moveInDate: '', moveOutDate: '', accommodationType: 'monthly',
          rentPaidStatus: 'due', rentDueDate: '', rentPaymentDate: '', bookingHistory: [], customRent: '',
          securityDeposit: { amount: 0, refundableType: 'fully', conditions: '' } // Reset securityDeposit
        });
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
    if (name.startsWith('securityDeposit.')) {
      const field = name.split('.')[1];
      setTenantForm({
        ...tenantForm,
        securityDeposit: {
          ...tenantForm.securityDeposit,
          [field]: value,
        },
      });
    } else {
      setTenantForm({ ...tenantForm, [name]: value });
    }
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

  const handleRoomSelection = (roomType) => {
    const availableRooms = rooms.filter(room => room.type === roomType && room.occupancy.current < room.occupancy.max);
    setAvailableRooms(availableRooms);
  };

  const confirmRoomAllocation = (tenantId, roomId) => {
    axios.post(`${API_BASE_URL}/api/tenants/allocate-room`, { tenantId, roomId })
      .then(() => {
        alert('Room allocated successfully!');
        // Refresh data or update state
      })
      .catch(err => {
        alert('Error allocating room: ' + err.response?.data?.error || err.message);
      });
  };

  return (
    <>
      <div className={styles['admin-dashboard']}>
        <h1>Admin Dashboard</h1>
        {error && <div style={{ color: 'red', marginBottom: 10 }}>{error}</div>}
        {registrationSuccess && <div style={{ color: '#43a047', background: '#e8f5e9', borderRadius: 8, padding: '8px 16px', marginBottom: 8, fontWeight: 600 }}>{registrationSuccess}</div>}
        {roomError && <div style={{ color: '#e53935', background: '#fff3f3', borderRadius: 8, padding: '8px 16px', marginBottom: 16, fontWeight: 600 }}>{roomError}</div>}
        {showRoomSelect && (
          <div style={{ background: '#fff', borderRadius: 8, padding: 16, marginBottom: 16, boxShadow: '0 2px 8px rgba(70,111,166,0.08)' }}>
            <h3 style={{ color: '#466fa6', fontWeight: 700, marginBottom: 12 }}>Allocate Room</h3>
            <select value={selectedRoom} onChange={e => setSelectedRoom(e.target.value)} style={{ width: '100%', padding: 10, borderRadius: 8, border: '1.5px solid #dbe6f6', fontSize: 16, marginBottom: 16 }}>
              <option value="">Select room number</option>
              {availableRooms.map(room => (
                <option key={room._id} value={room.name}>{room.name} ({room.location}) - ₹{room.price} [{room.occupancy.max - room.occupancy.current} vacant]</option>
              ))}
            </select>
            <button onClick={handleAdminAllocateRoom} style={{ background: '#43a047', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 24px', fontWeight: 700, fontSize: 16, cursor: 'pointer', marginRight: 12 }}>Allocate Room</button>
            <button onClick={() => { setShowRoomSelect(false); setSelectedRoom(''); setNewTenantId(''); }} style={{ background: '#eee', color: '#333', border: 'none', borderRadius: 8, padding: '10px 24px', fontWeight: 600, fontSize: 16, cursor: 'pointer' }}>Cancel</button>
          </div>
        )}
        <div style={{ marginBottom: 20 }}>
          <button
            onClick={() => setActiveTab('rooms')}
            className={styles['button-primary']}
            style={{ marginRight: 10, fontWeight: activeTab === 'rooms' ? 'bold' : 'normal', background: activeTab === 'rooms' ? '#e8f5e9' : '#fff', color: activeTab === 'rooms' ? '#466fa6' : '#333' }}
          >
            Rooms
          </button>
          <button
            onClick={() => setActiveTab('tenants')}
            className={styles['button-primary']}
            style={{ marginRight: 10, fontWeight: activeTab === 'tenants' ? 'bold' : 'normal', background: activeTab === 'tenants' ? '#e8f5e9' : '#fff', color: activeTab === 'tenants' ? '#466fa6' : '#333' }}
          >
            Tenants
          </button>
          <button
            onClick={() => setActiveTab('rent')}
            className={styles['button-primary']}
            style={{ fontWeight: activeTab === 'rent' ? 'bold' : 'normal', background: activeTab === 'rent' ? '#e8f5e9' : '#fff', color: activeTab === 'rent' ? '#466fa6' : '#333' }}
          >
            Rent & Security
          </button>
        </div>
        {activeTab === 'rooms' && (
          <RoomsTab
            rooms={rooms}
            filteredRooms={filteredRooms}
            roomForm={roomForm}
            editingRoomId={editingRoomId}
            editingRoomRowId={editingRoomRowId}
            editingRoomForm={editingRoomForm}
            ROOM_TYPE_PRICES={ROOM_TYPE_PRICES}
            ROOM_TYPES={ROOM_TYPES}
            ROOM_TYPE_ALTERNATES={ROOM_TYPE_ALTERNATES}
            handleRoomFormChange={handleRoomFormChange}
            handleAddRoom={handleAddRoom}
            handleUpdateRoom={handleUpdateRoom}
            handleEditRoom={handleEditRoom}
            handleDeleteRoom={handleDeleteRoom}
            setEditingRoomId={setEditingRoomId}
            setRoomForm={setRoomForm}
            setEditingRoomRowId={setEditingRoomRowId}
            setEditingRoomForm={setEditingRoomForm}
            getTenantsForRoom={getTenantsForRoom}
            navigate={navigate}
            setShowAddRoomTypeModal={setShowAddRoomTypeModal}
            totalRooms={totalRooms}
            totalOccupied={totalOccupied}
            totalVacant={totalVacant}
          />
        )}
        {activeTab === 'tenants' && (
          <TenantsTab
            activeTab={activeTab}
            tenants={tenants}
            rooms={rooms}
            tenantForm={tenantForm}
            editingTenantId={editingTenantId}
            editingTenantRowId={editingTenantRowId}
            editingTenantForm={editingTenantForm}
            handleTenantFormChange={handleTenantFormChange}
            handleAddTenant={handleAddTenant}
            handleUpdateTenant={handleUpdateTenant}
            handleEditTenant={handleEditTenant}
            handleDeleteTenant={handleDeleteTenant}
            handleCancelEditTenant={handleCancelEditTenant}
            ACCOMMODATION_TYPES={ACCOMMODATION_TYPES}
            RENT_STATUS={RENT_STATUS}
            getAvailableRooms={getAvailableRooms}
            handleAddBooking={handleAddBooking}
            showBookingModal={showBookingModal}
            selectedTenantBookings={selectedTenantBookings}
            selectedTenantName={selectedTenantName}
            handleCloseBookingModal={handleCloseBookingModal}
            setEditingTenantRowId={setEditingTenantRowId}
            setEditingTenantForm={setEditingTenantForm}
          />
        )}
        {activeTab === 'rent' && <RentSecurityTab />}
      </div>
    </>
  );
};

export default AdminDashboard;