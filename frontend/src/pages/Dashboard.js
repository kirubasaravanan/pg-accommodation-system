import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AdminDashboard.css';
import { FaHome, FaBed, FaDollarSign, FaChartBar, FaComments, FaRobot } from 'react-icons/fa';
import { fetchRooms, fetchTenants } from '../api';
import RoomBooking from '../components/RoomBooking';
import TimeDateBar from '../components/TimeDateBar';

const API_BASE_URL = 'http://localhost:5000';

const SIDEBAR_TABS = [
  { key: 'dashboard', label: 'Dashboard', icon: <FaHome /> },
  { key: 'roomBooking', label: 'Room Booking', icon: <FaBed /> },
  { key: 'rentPayment', label: 'Rent Payment', icon: <FaDollarSign /> },
  { key: 'reports', label: 'Reports', icon: <FaChartBar /> },
  { key: 'complaints', label: 'Complaints', icon: <FaComments /> },
  { key: 'ai', label: 'AI Chatbot', icon: <FaRobot /> },
  { key: 'tenants', label: 'Tenants', icon: <FaBed /> },
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
          <div style={{ padding: 32 }}>
            <h2>AI Chatbot</h2>
            <p>AI chatbot integration coming soon.</p>
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
            {/* Edit Tenant Modal */}
            {editingTenant && (
              <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                <div style={{ background: '#fff', borderRadius: 16, padding: 32, minWidth: 320, boxShadow: '0 4px 32px rgba(0,0,0,0.12)' }}>
                  <h3>Edit Tenant</h3>
                  <form onSubmit={handleSaveTenant}>
                    <div style={{ marginBottom: 12 }}>
                      <label>Name: <input value={editingTenant.name} onChange={e => setEditingTenant({ ...editingTenant, name: e.target.value })} style={{ marginLeft: 8 }} /></label>
                    </div>
                    <div style={{ marginBottom: 12 }}>
                      <label>Contact: <input value={editingTenant.contact} onChange={e => setEditingTenant({ ...editingTenant, contact: e.target.value })} style={{ marginLeft: 8 }} /></label>
                    </div>
                    <div style={{ marginBottom: 12 }}>
                      <label>Room: <select value={editingTenant.room || ''} onChange={e => setEditingTenant({ ...editingTenant, room: e.target.value })} style={{ marginLeft: 8 }}>
                        <option value="">Select Room</option>
                        {rooms.filter(r => (r.occupancy.max - r.occupancy.current > 0) || r.name === editingTenant.room).map(r => (
                          <option key={r._id} value={r.name}>{r.name} ({r.type}, {r.location}) - {r.occupancy.max - r.occupancy.current + (editingTenant.room === r.name ? 1 : 0)} vacancy</option>
                        ))}
                      </select></label>
                    </div>
                    <div style={{ marginBottom: 12 }}>
                      <label>Status: <select value={editingTenant.status} onChange={e => setEditingTenant({ ...editingTenant, status: e.target.value })} style={{ marginLeft: 8 }}>
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                      </select></label>
                    </div>
                    <div style={{ marginBottom: 12 }}>
                      <label>Move In: <input type="date" value={editingTenant.moveInDate ? editingTenant.moveInDate.slice(0,10) : ''} onChange={e => setEditingTenant({ ...editingTenant, moveInDate: e.target.value })} style={{ marginLeft: 8 }} /></label>
                    </div>
                    <div style={{ marginBottom: 12 }}>
                      <label>Move Out: <input type="date" value={editingTenant.moveOutDate ? editingTenant.moveOutDate.slice(0,10) : ''} onChange={e => setEditingTenant({ ...editingTenant, moveOutDate: e.target.value })} style={{ marginLeft: 8 }} /></label>
                    </div>
                    <div style={{ marginBottom: 12 }}>
                      <label>Type: <select value={editingTenant.accommodationType} onChange={e => setEditingTenant({ ...editingTenant, accommodationType: e.target.value })} style={{ marginLeft: 8 }}>
                        <option value="monthly">Monthly</option>
                        <option value="daily">Daily</option>
                      </select></label>
                    </div>
                    <div style={{ marginBottom: 12 }}>
                      <label>Rent Status: <select value={editingTenant.rentPaidStatus} onChange={e => setEditingTenant({ ...editingTenant, rentPaidStatus: e.target.value })} style={{ marginLeft: 8 }}>
                        <option value="paid">Paid</option>
                        <option value="due">Due</option>
                        <option value="partial">Partial</option>
                      </select></label>
                    </div>
                    <div style={{ marginBottom: 12 }}>
                      <label>Security Deposit: <input type="number" value={editingTenant.securityDeposit || ''} onChange={e => setEditingTenant({ ...editingTenant, securityDeposit: e.target.value })} style={{ marginLeft: 8 }} /></label>
                    </div>
                    <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
                      <button type="submit" style={{ background: '#6b8bbd', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 24px', fontWeight: 600 }}>Save</button>
                      <button type="button" onClick={handleCancelEditTenant} style={{ background: '#eee', color: '#333', border: 'none', borderRadius: 8, padding: '8px 24px', fontWeight: 600 }}>Cancel</button>
                    </div>
                  </form>
                </div>
              </div>
            )}
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
      default:
        return null;
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f4f7fa', display: 'flex', fontFamily: 'Inter, Arial, sans-serif' }}>
      {/* Sidebar */}
      <div style={{ width: 250, background: '#6b8bbd', color: '#fff', borderRadius: 24, margin: 24, marginRight: 0, padding: '32px 0 24px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', boxShadow: '0 4px 32px rgba(0,0,0,0.07)' }}>
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
      <div style={{ flex: 1, margin: 24, marginLeft: 0, background: '#fff', borderRadius: 24, boxShadow: '0 4px 32px rgba(0,0,0,0.07)', padding: 32, minWidth: 0 }}>
        <TimeDateBar />
        {renderTabContent()}
        {/* Edit Room Modal rendered globally so it doesn't break JSX tree */}
        {editingRoom && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div style={{ background: '#fff', borderRadius: 16, padding: 32, minWidth: 320, boxShadow: '0 4px 32px rgba(0,0,0,0.12)' }}>
              <h3>Edit Room</h3>
              <form onSubmit={handleSaveRoom}>
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
                          <span style={{ minWidth: 80, color: '#888' }}>Bed {idx + 1}:</span>
                          {tenant ? (
                            <>
                              <span style={{ color: '#466fa6', fontWeight: 600 }}>{tenant.name} ({tenant.contact})</span>
                              <button
                                type="button"
                                title="Remove tenant"
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  color: 'red',
                                  fontWeight: 900,
                                  fontSize: 18,
                                  cursor: 'pointer',
                                  marginLeft: 4
                                }}
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
                                      setRooms(roomsRes.data);
                                      setTenants(tenantsRes.data);
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
        )}
      </div>
    </div>
  );
};

export default Dashboard;
