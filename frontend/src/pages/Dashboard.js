import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AdminDashboard.css';
import { FaHome, FaBed, FaDollarSign, FaChartBar, FaComments, FaRobot, FaUserFriends, FaUserPlus, FaCog } from 'react-icons/fa';
import { fetchRooms, fetchTenants } from '../api';
import RoomBooking from '../components/RoomBooking';
import TimeDateBar from '../components/TimeDateBar';
import RegistrationForm from '../components/RegistrationForm';
import ChatbotWhatsAppIntegration from './ChatbotWhatsAppIntegration';
import AdminConsole from './AdminConsole.tsx';
import EditTenantModal from '../components/EditTenantModal.jsx';
import EditRoomModal from '../components/EditRoomModal.jsx';

const API_BASE_URL = 'http://localhost:5000';

const SIDEBAR_TABS = [
  { key: 'dashboard', label: 'Dashboard', icon: <FaHome /> },
  { key: 'roomBooking', label: 'Room Booking', icon: <FaBed /> },
  { key: 'tenants', label: 'Tenants', icon: <FaUserFriends /> },
  { key: 'rentPayment', label: 'Rent Payment', icon: <FaDollarSign /> },
  { key: 'reports', label: 'Reports', icon: <FaChartBar /> },
  { key: 'complaints', label: 'Complaints', icon: <FaComments /> },
  { key: 'ai', label: 'AI Chatbot', icon: <FaRobot /> },
  { key: 'registration', label: 'Registration', icon: <FaUserPlus /> },
  { key: 'adminConsole', label: 'Admin Console', icon: <FaCog /> },
];

const Dashboard = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState({
    rentCollected: 75500,
    occupancy: 85.3,
    expenses: 20800,
    roomHistory: [10, 20, 30, 35, 28, 60],
    complaintHistory: [1, 2, 2, 3, 4, 6],
    months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    transactions: [
      { date: '04/10/2024', desc: 'Rent Payment', amount: '₹12,500', status: 'Completed' },
      { date: '04/08/2024', desc: 'WhatsApp Message for Room Allocation', amount: '8,000', status: 'Sent' },
      { date: '04/06/2024', desc: 'Rent Payment', amount: '₹8,000', status: 'Completed' },
    ],
  });
  const [waTo, setWaTo] = useState('+91 9876543210');
  const [waMsg, setWaMsg] = useState('Your rent is due soon.');

  // Room Booking Tab: Load rooms and tenants from DB
  const [rooms, setRooms] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [roomLoading, setRoomLoading] = useState(false);
  const [roomError, setRoomError] = useState('');

  useEffect(() => {
    if (activeTab === 'roomBooking') {
      setRoomLoading(true);
      Promise.all([
        fetchRooms(),
        fetchTenants(),
      ])
        .then(([roomsRes, tenantsRes]) => {
          console.log('Dashboard fetchRooms:', roomsRes.data);
          console.log('Dashboard fetchTenants:', tenantsRes.data);
          setRooms(roomsRes.data);
          setTenants(tenantsRes.data);
          setRoomLoading(false);
        })
        .catch((err) => {
          let msg = 'Failed to load room or tenant data.';
          if (err && err.response && err.response.data) {
            msg += ' ' + (err.response.data.error || JSON.stringify(err.response.data));
          } else if (err && err.message) {
            msg += ' ' + err.message;
          }
          setRoomError(msg);
          setRoomLoading(false);
          // Log full error for debugging
          console.error('Room/Tenant fetch error:', err);
        });
    }
  }, [activeTab]);

  // Add state and handlers for editing room/tenant
  const [editingRoom, setEditingRoom] = useState(null);
  const [editingTenant, setEditingTenant] = useState(null);

  const handleEditRoom = (room) => {
    setEditingRoom({ ...room });
  };

  const handleCancelEditRoom = () => {
    setEditingRoom(null);
  };

  const handleSaveRoom = (e) => {
    e.preventDefault();
    const originalRoom = rooms.find(r => r._id === editingRoom._id);
    const newMax = Number(editingRoom.occupancy.max);
    const currentOccupancy = editingRoom.occupancy.current;
    if (currentOccupancy > newMax) {
      alert('Cannot reduce max occupancy below current occupancy.');
      return;
    }
    // Only send allowed fields
    const { _id, id, ...roomData } = editingRoom;
    const payload = {
      name: roomData.name,
      location: roomData.location,
      price: Number(roomData.price),
      type: roomData.type,
      occupancy: {
        current: currentOccupancy,
        max: newMax,
      },
      isBooked: roomData.isBooked || false,
      blocked: roomData.blocked || false,
    };
    const token = localStorage.getItem('token');
    console.log('Room update token:', token); // DEBUG: print token before update
    if (!token) {
      alert('You are not logged in. Please log in again.');
      return;
    }
    axios.put(`${API_BASE_URL}/api/rooms/${editingRoom._id}`, payload, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => {
        // After update, re-fetch both rooms and tenants to ensure UI is in sync
        Promise.all([
          fetchRooms(),
          fetchTenants(),
        ]).then(([roomsRes, tenantsRes]) => {
          setRooms(roomsRes.data);
          setTenants(tenantsRes.data);
          setEditingRoom(null);
        }).catch(fetchErr => {
          setEditingRoom(null);
          setRoomError('Failed to refresh data after update.');
          console.error('Post-update fetch error:', fetchErr);
        });
      })
      .catch(err => {
        let msg = 'Failed to update room.';
        if (err.response && err.response.data) {
          if (err.response.data.message) {
            msg = 'Failed to update room: ' + err.response.data.message;
          } else {
            msg = 'Failed to update room: ' + JSON.stringify(err.response.data);
          }
        }
        alert(msg);
        console.error('Room update error:', err);
      });
  };

  const handleEditTenant = (tenant) => {
    setEditingTenant({ ...tenant });
  };

  const handleCancelEditTenant = () => {
    setEditingTenant(null);
  };

  const handleSaveTenant = (e) => {
    e.preventDefault();
    const { _id, id, ...tenantData } = editingTenant;
    const token = localStorage.getItem('token');
    if (!token) {
      alert('You are not logged in. Please log in again.');
      return;
    }
    console.log('Updating tenant:', `${API_BASE_URL}/api/tenants/${editingTenant._id}`, tenantData);
    axios.put(`${API_BASE_URL}/api/tenants/${editingTenant._id}`, tenantData, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => {
        // After update, re-fetch both rooms and tenants to ensure UI is in sync
        Promise.all([
          fetchRooms(),
          fetchTenants(),
        ]).then(([roomsRes, tenantsRes]) => {
          setRooms(roomsRes.data);
          setTenants(tenantsRes.data);
          setEditingTenant(null);
        }).catch(fetchErr => {
          setEditingTenant(null);
          setRoomError('Failed to refresh data after tenant update.');
          console.error('Post-update fetch error:', fetchErr);
        });
      })
      .catch(err => {
        let msg = 'Failed to update tenant.';
        if (err.response && err.response.data) {
          if (err.response.data.message) {
            msg = 'Failed to update tenant: ' + err.response.data.message;
          } else {
            msg = 'Failed to update tenant: ' + JSON.stringify(err.response.data);
          }
        }
        alert(msg);
        console.error('Tenant update error:', err);
      });
  };

  // State for tenant assignment dropdown
  const [assignTenantRoomId, setAssignTenantRoomId] = useState(null);
  const [selectedTenantId, setSelectedTenantId] = useState('');

  const handleAssignTenantToRoom = (tenantId, room) => {
    if (!tenantId) return;
    const tenant = tenants.find(t => t._id === tenantId);
    if (!tenant) return;
    const token = localStorage.getItem('token');
    if (!token) {
      alert('You are not logged in. Please log in again.');
      return;
    }
    axios.put(`${API_BASE_URL}/api/tenants/${tenantId}`, { ...tenant, room: room.name }, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => {
        setTenants(tenants.map(t => t._id === tenantId ? res.data : t));
        setRooms(rooms.map(r => r._id === room._id ? { ...r, occupancy: { ...r.occupancy, current: r.occupancy.current + 1 } } : r));
        setAssignTenantRoomId(null);
        setSelectedTenantId('');
      })
      .catch(() => alert('Failed to assign tenant.'));
  };

  // Render content for each tab
  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <>
            <div style={{ fontSize: 32, fontWeight: 700, marginBottom: 24 }}>Dashboard</div>
            {/* Top Stat Cards */}
            <div style={{ display: 'flex', gap: 24, marginBottom: 24 }}>
              <div style={{ flex: 1, background: '#f7faff', borderRadius: 16, padding: 24, border: '1.5px dashed #dbe6f6', minWidth: 180 }}>
                <div style={{ fontSize: 16, color: '#7a8ca7', fontWeight: 600 }}>Monthly Rent Collection</div>
                <div style={{ fontSize: 32, fontWeight: 700, marginTop: 8 }}>₹{stats.rentCollected.toLocaleString()}</div>
              </div>
              <div style={{ flex: 1, background: '#f7faff', borderRadius: 16, padding: 24, border: '1.5px dashed #dbe6f6', minWidth: 180 }}>
                <div style={{ fontSize: 16, color: '#7a8ca7', fontWeight: 600 }}>Occupancy History</div>
                <div style={{ fontSize: 32, fontWeight: 700, marginTop: 8 }}>{stats.occupancy}%</div>
              </div>
              <div style={{ flex: 1, background: '#f7faff', borderRadius: 16, padding: 24, border: '1.5px dashed #dbe6f6', minWidth: 180 }}>
                <div style={{ fontSize: 16, color: '#7a8ca7', fontWeight: 600 }}>Expense Tracking</div>
                <div style={{ fontSize: 32, fontWeight: 700, marginTop: 8 }}>₹{stats.expenses.toLocaleString()}</div>
              </div>
            </div>
            {/* Charts Row */}
            <div style={{ display: 'flex', gap: 24, marginBottom: 24 }}>
              <div style={{ flex: 1, background: '#f7faff', borderRadius: 16, padding: 24, border: '1.5px dashed #dbe6f6' }}>
                <div style={{ fontSize: 16, color: '#7a8ca7', fontWeight: 600, marginBottom: 8 }}>Room Allocation History</div>
                <svg width="100%" height="100" viewBox="0 0 220 100">
                  {stats.roomHistory.map((val, i) => (
                    <rect key={i} x={20 + i * 32} y={100 - val * 1.5} width={20} height={val * 1.5} fill="#6b8bbd" rx={4} />
                  ))}
                  {/* X axis labels */}
                  {stats.months.map((m, i) => (
                    <text key={m} x={30 + i * 32} y={95} fontSize={12} fill="#7a8ca7" textAnchor="middle">{m}</text>
                  ))}
                </svg>
              </div>
              <div style={{ flex: 1, background: '#f7faff', borderRadius: 16, padding: 24, border: '1.5px dashed #dbe6f6' }}>
                <div style={{ fontSize: 16, color: '#7a8ca7', fontWeight: 600, marginBottom: 8 }}>Complaint Tracker</div>
                <svg width="100%" height="100" viewBox="0 0 220 100">
                  <polyline
                    fill="none"
                    stroke="#6b8bbd"
                    strokeWidth="3"
                    points={stats.complaintHistory.map((v, i) => `${30 + i * 32},${100 - v * 15}`).join(' ')}
                  />
                  {stats.complaintHistory.map((v, i) => (
                    <circle key={i} cx={30 + i * 32} cy={100 - v * 15} r={4} fill="#466fa6" />
                  ))}
                  {stats.months.map((m, i) => (
                    <text key={m} x={30 + i * 32} y={95} fontSize={12} fill="#7a8ca7" textAnchor="middle">{m}</text>
                  ))}
                </svg>
              </div>
            </div>
            {/* Recent Transactions Table */}
            <div style={{ background: '#f7faff', borderRadius: 16, padding: 24, border: '1.5px dashed #dbe6f6', marginBottom: 24 }}>
              <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>Recent Transactions</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 16 }}>
                <thead>
                  <tr style={{ color: '#7a8ca7', fontWeight: 600 }}>
                    <th style={{ textAlign: 'left', padding: 8 }}>Date</th>
                    <th style={{ textAlign: 'left', padding: 8 }}>Description</th>
                    <th style={{ textAlign: 'right', padding: 8 }}>Amount</th>
                    <th style={{ textAlign: 'center', padding: 8 }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.transactions.map((t, i) => (
                    <tr key={i} style={{ borderTop: '1px solid #e3eaf2' }}>
                      <td style={{ padding: 8 }}>{t.date}</td>
                      <td style={{ padding: 8 }}>{t.desc}</td>
                      <td style={{ padding: 8, textAlign: 'right' }}>{t.amount}</td>
                      <td style={{ padding: 8, textAlign: 'center' }}>{t.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* WhatsApp Integration Card */}
            <div style={{ background: '#f7faff', borderRadius: 16, padding: 24, border: '1.5px dashed #dbe6f6', maxWidth: 480 }}>
              <div style={{ fontSize: 20, fontWeight: 600, marginBottom: 16 }}>WhatsApp Integration</div>
            </div>
            <RoomBooking
              rooms={rooms}
              tenants={tenants}
              loading={roomLoading}
              error={roomError}
              onEditRoom={handleEditRoom}
              onAssignTenant={handleAssignTenantToRoom}
              assignTenantRoomId={assignTenantRoomId}
              setAssignTenantRoomId={setAssignTenantRoomId}
              selectedTenantId={selectedTenantId}
              setSelectedTenantId={setSelectedTenantId}
            />
          </>
        );
      case 'rentPayment':
        return (
          <div style={{ padding: 32 }}>
            <h2>Rent Payment</h2>
            <p>Rent payment management coming soon.</p>
          </div>
        );
      case 'reports':
        return (
          <div style={{ padding: 32 }}>
            <h2>Reports</h2>
            <p>Reports and analytics coming soon.</p>
          </div>
        );
      case 'complaints':
        return (
          <div style={{ padding: 32 }}>
            <h2>Complaints</h2>
            <p>Complaints tracker coming soon.</p>
          </div>
        );
      case 'ai':
        return (
          <div style={{ padding: 32, maxWidth: 700 }}>
            <ChatbotWhatsAppIntegration />
          </div>
        );
      case 'tenants':
        return (
          <div style={{ padding: 32 }}>
            <h2>Tenants</h2>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 16, background: '#f7faff', borderRadius: 12 }}>
              <thead>
                <tr style={{ color: '#7a8ca7', fontWeight: 600 }}>
                  <th style={{ textAlign: 'left', padding: 8 }}>Name</th>
                  <th style={{ textAlign: 'left', padding: 8 }}>Contact</th>
                  <th style={{ textAlign: 'left', padding: 8 }}>Room</th>
                  <th style={{ textAlign: 'left', padding: 8 }}>Status</th>
                  <th style={{ textAlign: 'left', padding: 8 }}>Move In</th>
                  <th style={{ textAlign: 'left', padding: 8 }}>Move Out</th>
                  <th style={{ textAlign: 'left', padding: 8 }}>Type</th>
                  <th style={{ textAlign: 'left', padding: 8 }}>Rent Status</th>
                  <th style={{ textAlign: 'center', padding: 8 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {tenants.map(tenant => (
                  <tr key={tenant._id} style={{ borderTop: '1px solid #e3eaf2' }}>
                    <td style={{ padding: 8 }}>{tenant.name}</td>
                    <td style={{ padding: 8 }}>{tenant.contact}</td>
                    <td style={{ padding: 8 }}>{tenant.room || <span style={{ color: '#aaa' }}>-</span>}</td>
                    <td style={{ padding: 8 }}>{tenant.status}</td>
                    <td style={{ padding: 8 }}>{tenant.moveInDate ? tenant.moveInDate.slice(0,10) : '-'}</td>
                    <td style={{ padding: 8 }}>{tenant.moveOutDate ? tenant.moveOutDate.slice(0,10) : '-'}</td>
                    <td style={{ padding: 8 }}>{tenant.accommodationType || '-'}</td>
                    <td style={{ padding: 8 }}>{tenant.rentPaidStatus || '-'}</td>
                    <td style={{ padding: 8, textAlign: 'center' }}>
                      <button style={{ marginRight: 8 }} onClick={() => handleEditTenant(tenant)}>Edit</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      case 'roomBooking':
        return (
          <>
            <div style={{ fontSize: 32, fontWeight: 700, marginBottom: 24 }}>Room Booking</div>
            <RoomBooking
              rooms={rooms}
              tenants={tenants}
              loading={roomLoading}
              error={roomError}
              onEditRoom={handleEditRoom}
              onAssignTenant={handleAssignTenantToRoom}
              assignTenantRoomId={assignTenantRoomId}
              setAssignTenantRoomId={setAssignTenantRoomId}
              selectedTenantId={selectedTenantId}
              setSelectedTenantId={setSelectedTenantId}
            />
          </>
        );
      case 'registration':
        return (
          <div style={{ padding: 32, maxWidth: 500 }}>
            <h2>New Tenant Registration</h2>
            <RegistrationForm />
          </div>
        );
      case 'adminConsole':
        return (
          <div style={{ padding: 0, minHeight: '100vh', background: '#f4f7fa' }}>
            <AdminConsole />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <style>{`
        @media (max-width: 800px) {
          .dashboard-root {
            flex-direction: column !important;
            padding: 0 !important;
          }
          .dashboard-sidebar {
            width: 100% !important;
            margin: 0 0 12px 0 !important;
            border-radius: 0 0 24px 24px !important;
            min-width: 0 !important;
            box-shadow: 0 2px 8px rgba(70,111,166,0.08) !important;
          }
          .dashboard-content {
            margin: 0 !important;
            border-radius: 24px 24px 0 0 !important;
            padding: 16px !important;
            min-width: 0 !important;
          }
        }
        @media (max-width: 600px) {
          .dashboard-content {
            padding: 8px !important;
          }
        }
      `}</style>
      <div className="dashboard-root" style={{ minHeight: '100vh', background: '#f4f7fa', display: 'flex', fontFamily: 'Inter, Arial, sans-serif' }}>
        {/* Sidebar */}
        <div className="dashboard-sidebar" style={{ width: 250, background: '#6b8bbd', color: '#fff', borderRadius: 24, margin: 24, marginRight: 0, padding: '32px 0 24px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', boxShadow: '0 4px 32px rgba(0,0,0,0.07)' }}>
          <div style={{ fontWeight: 700, fontSize: 22, marginBottom: 32, letterSpacing: 0.5 }}>PG Accommodatio</div>
          {SIDEBAR_TABS.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
              background: activeTab === tab.key ? '#466fa6' : 'transparent',
              color: '#fff',
              border: 'none',
              borderRadius: 12,
              padding: '14px 24px',
              margin: '4px 0',
              width: 200,
              textAlign: 'left',
              fontWeight: activeTab === tab.key ? 700 : 500,
              fontSize: 17,
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              cursor: 'pointer',
              transition: 'background 0.2s',
            }}>{tab.icon}<span>{tab.label}</span></button>
          ))}
          {/* Logout button */}
          {typeof onLogout === 'function' && (
            <button onClick={onLogout} style={{ marginTop: 32, background: '#fff', color: '#6b8bbd', border: 'none', borderRadius: 8, padding: '10px 24px', fontWeight: 700, fontSize: 16, cursor: 'pointer' }}>Logout</button>
          )}
        </div>
        {/* Main content */}
        <div className="dashboard-content" style={{ flex: 1, margin: 24, marginLeft: 0, background: '#fff', borderRadius: 24, boxShadow: '0 4px 32px rgba(0,0,0,0.07)', padding: 32, minWidth: 0 }}>
          <TimeDateBar />
          {renderTabContent()}
          {/* Edit Room Modal rendered globally so it doesn't break JSX tree */}
          <EditRoomModal
            editingRoom={editingRoom}
            tenants={tenants}
            handleCancelEditRoom={handleCancelEditRoom}
            handleSaveRoom={handleSaveRoom}
            setEditingRoom={setEditingRoom}
            fetchRooms={fetchRooms}
            fetchTenants={fetchTenants}
            handleAssignTenantToRoom={handleAssignTenantToRoom}
          />
          {/* Edit Tenant Modal rendered globally so it doesn't break JSX tree */}
          <EditTenantModal
            editingTenant={editingTenant}
            rooms={rooms}
            handleCancelEditTenant={handleCancelEditTenant}
            handleSaveTenant={handleSaveTenant}
            setEditingTenant={setEditingTenant}
          />
        </div>
      </div>
    </>
  );
};

export default Dashboard;