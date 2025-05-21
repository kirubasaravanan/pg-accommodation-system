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