import React, { useState, useEffect } from 'react';
import axios from 'axios';
import SummaryCard from '../components/SummaryCard';
import TenantHistoryModal from '../components/TenantHistoryModal'; // Uncommented
import { getTenantHistory } from '../api';

const TenantsTab = ({
  activeTab,
  tenants,
  rooms,
  tenantForm,
  editingTenantId,
  editingTenantRowId,
  editingTenantForm,
  handleTenantFormChange,
  handleAddTenant,
  handleUpdateTenant,
  handleEditTenant,
  handleDeleteTenant,
  handleCancelEditTenant,
  ACCOMMODATION_TYPES,
  RENT_STATUS,
  getAvailableRooms,
  setEditingTenantRowId,
  setEditingTenantForm
}) => {
  const [showRoomSelect, setShowRoomSelect] = useState(false);
  const [availableRooms, setAvailableRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState('');
  const [newTenantId, setNewTenantId] = useState('');
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [financialSummary, setFinancialSummary] = useState({
    rentForecastThisMonth: 0,
    rentReceivedThisMonth: 0,
    rentPendingThisMonth: 0,
    totalSecurityDepositCollected: 0
  });

  const [showTenantHistoryModal, setShowTenantHistoryModal] = useState(false);
  const [selectedTenantForHistory, setSelectedTenantForHistory] = useState(null);
  const [tenantHistoryData, setTenantHistoryData] = useState({ tenant: null, bookings: [] });
  const [historyLoading, setHistoryLoading] = useState(false);

  const token = localStorage.getItem('token');

  useEffect(() => {
    console.log(`TenantsTab: useEffect for financial summary triggered. Received activeTab prop: "${activeTab}"`);
    if (activeTab === 'tenants') {
      console.log('TenantsTab: activeTab prop is "tenants", proceeding to fetch financial summary.');
      axios.get('http://localhost:5000/api/dashboard/tenant-financial-summary', {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => {
        console.log('TenantsTab: Financial summary data fetched. Response:', JSON.stringify(res.data, null, 2));
        setFinancialSummary(res.data);
      })
      .catch(err => console.error('TenantsTab: Error fetching financial summary', err));
    } else {
      console.log('TenantsTab: activeTab prop is NOT "tenants" (it is "' + activeTab + '"), skipping financial summary fetch.');
    }
  }, [activeTab, token]); // Added token to dependency array

  const handleAdminAddTenant = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');
    try {
      const res = await axios.post('http://localhost:5000/api/tenants/register', {
        name: tenantForm.name,
        contact: tenantForm.contact,
        email: tenantForm.email || '',
        aadharNumber: tenantForm.aadharNumber || '', // Changed from aadhaar to aadharNumber
        joiningDate: tenantForm.moveInDate || new Date().toISOString().slice(0, 10),
        roomType: tenantForm.preferredRoomType || '',
        emergencyContact: tenantForm.emergencyContact || '',
        remarks: tenantForm.remarks || '',
      }, { headers: { Authorization: `Bearer ${token}` }}); // Added token
      setNewTenantId(res.data.data.tenantId);
      const roomsRes = await axios.get(`http://localhost:5000/api/rooms/available?type=${tenantForm.preferredRoomType || ''}`, { headers: { Authorization: `Bearer ${token}` }}); // Added token
      setAvailableRooms(roomsRes.data.data);
      setShowRoomSelect(true);
    } catch (err) {
      setFormError(err.response?.data?.message || 'Registration failed.');
    }
  };

  const handleAdminAllocateRoom = async () => {
    setFormError('');
    setFormSuccess('');
    if (!selectedRoom) {
      setFormError('Please select a room number.');
      return;
    }
    try {
      await axios.post('http://localhost:5000/api/tenants/allocate-room', {
        tenantId: newTenantId,
        roomNumber: selectedRoom,
        startDate: new Date().toISOString().slice(0, 10),
        rent: availableRooms.find(r => r.name === selectedRoom)?.price || 0,
      }, { headers: { Authorization: `Bearer ${token}` }}); // Added token
      setFormSuccess('Room allocated successfully!');
      setShowRoomSelect(false);
      setSelectedRoom('');
      setNewTenantId('');
      // TODO: Refresh tenants list or call a prop function to do so
    } catch (err) {
      setFormError(err.response?.data?.message || 'Room allocation failed.');
    }
  };

  const handleViewHistory = async (tenant) => {
    if (!token) {
      alert('Authentication error. Please login again.');
      return;
    }
    setSelectedTenantForHistory(tenant);
    setShowTenantHistoryModal(true);
    setHistoryLoading(true);
    try {
      const response = await getTenantHistory(tenant._id, token);
      setTenantHistoryData(response.data); 
    } catch (error) {
      console.error("Error fetching tenant history:", error);
      alert("Failed to fetch tenant history.");
      setTenantHistoryData({ tenant: null, bookings: [] }); 
    }
    setHistoryLoading(false);
  };

  const handleCloseTenantHistoryModal = () => {
    setShowTenantHistoryModal(false);
    setSelectedTenantForHistory(null);
    setTenantHistoryData({ tenant: null, bookings: [] });
  };

  console.log('TenantsTab: Rendering. Current financialSummary state:', financialSummary);

  return (
    <>
      {activeTab === 'tenants' && (
        <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: 20, flexWrap: 'wrap', gap: '16px' }}>
          <SummaryCard label="Rent Forecast (This Month)" value={`₹${financialSummary.rentForecastThisMonth}`} color="#4CAF50" />
          <SummaryCard label="Rent Received (This Month)" value={`₹${financialSummary.rentReceivedThisMonth}`} color="#2196F3" />
          <SummaryCard label="Rent Pending (This Month)" value={`₹${financialSummary.rentPendingThisMonth}`} color="#FF9800" />
          <SummaryCard label="Total Security Deposits" value={`₹${financialSummary.totalSecurityDepositCollected}`} color="#9C27B0" />
        </div>
      )}

      {formError && <div style={{ color: '#e53935', background: '#fff3f3', borderRadius: 8, padding: '8px 16px', marginBottom: 16, fontWeight: 600 }}>{formError}</div>}
      {formSuccess && <div style={{ color: '#43a047', background: '#e8f5e9', borderRadius: 8, padding: '8px 16px', marginBottom: 16, fontWeight: 600 }}>{formSuccess}</div>}
      
      {!showRoomSelect ? (
        <form onSubmit={editingTenantId ? handleUpdateTenant : handleAddTenant} style={{ marginBottom: 20 }}>
          <input name="name" placeholder="Name" value={tenantForm.name} onChange={handleTenantFormChange} required />
          <input name="contact" placeholder="Contact Number" value={tenantForm.contact} onChange={handleTenantFormChange} required />
          <input name="email" type="email" placeholder="Email" value={tenantForm.email || ''} onChange={handleTenantFormChange} required />
          <input name="aadharNumber" placeholder="Aadhaar Number" value={tenantForm.aadharNumber || ''} onChange={handleTenantFormChange} /> 
          <input name="moveInDate" type="date" placeholder="Joining Date" value={tenantForm.moveInDate} onChange={handleTenantFormChange} title="Date when tenant joins" required />
          <select name="preferredRoomType" value={tenantForm.preferredRoomType || ''} onChange={handleTenantFormChange} required>
            <option value="">Select Preferred Room Type</option>
            {['Private Mini','Private','Double Occupancy','Triple Occupancy','Four Occupancy','Five Occupancy'].map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
          <input name="emergencyContact" placeholder="Emergency Contact (Optional)" value={tenantForm.emergencyContact || ''} onChange={handleTenantFormChange} />
          <textarea name="remarks" placeholder="Remarks (Optional)" value={tenantForm.remarks || ''} onChange={handleTenantFormChange} />
          
          <input name="securityDeposit.amount" type="number" placeholder="Security Deposit Amount" value={tenantForm.securityDeposit?.amount || ''} onChange={handleTenantFormChange} />
          <select name="securityDeposit.refundableType" value={tenantForm.securityDeposit?.refundableType || 'fully'} onChange={handleTenantFormChange}>
            <option value="fully">Fully Refundable</option>
            <option value="partial">Partially Refundable</option>
            <option value="non-refundable">Non-Refundable</option>
          </select>
          <input name="securityDeposit.conditions" placeholder="Deposit Conditions (Optional)" value={tenantForm.securityDeposit?.conditions || ''} onChange={handleTenantFormChange} />

          {editingTenantId && (
            <>
              <select name="status" value={tenantForm.status} onChange={handleTenantFormChange}>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
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
              <input 
                name="intendedVacationDate" 
                type="date" 
                placeholder="Intended Vacation Date" 
                value={tenantForm.intendedVacationDate ? tenantForm.intendedVacationDate.split('T')[0] : ''} 
                onChange={handleTenantFormChange} 
                title="Date tenant intends to vacate" 
              />
            </>
          )}

          <button type="submit">{editingTenantId ? 'Update Tenant' : 'Register Tenant'}</button>
          {editingTenantId && <button type="button" onClick={handleCancelEditTenant} style={{ marginLeft: 8 }}>Cancel</button>}
        </form>
      ) : (
        <div style={{ marginTop: 24 }}>
          <h3 style={{ color: '#466fa6', fontWeight: 700, marginBottom: 12 }}>Select a Room</h3>
          <select value={selectedRoom} onChange={e => setSelectedRoom(e.target.value)} style={{ width: '100%', padding: 10, borderRadius: 8, border: '1.5px solid #dbe6f6', fontSize: 16, marginBottom: 16 }}>
            <option value="">Select room number</option>
            {availableRooms.map(room => (
              <option key={room._id} value={room.name}>{room.name} ({room.location}) - ₹{room.price} [{room.occupancy.max - room.occupancy.current} vacant]</option>
            ))}
          </select>
          <button onClick={handleAdminAllocateRoom} style={{ background: '#43a047', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 24px', fontWeight: 700, fontSize: 16, cursor: 'pointer', marginRight: 12 }}>Allocate Room</button>
          <button onClick={() => setShowRoomSelect(false)} style={{ background: '#eee', color: '#333', border: 'none', borderRadius: 8, padding: '10px 24px', fontWeight: 600, fontSize: 16, cursor: 'pointer' }}>Cancel</button>
        </div>
      )}
      
      <div style={{ overflowX: 'auto' }}>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Contact</th>
              <th>Room</th>
              <th>Status</th>
              <th>Move-In Date</th>
              <th>Move-Out Date</th>
              <th>Type</th>
              <th>Rent Status</th>
              <th>Security Deposit</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {tenants.map((tenant) => (
              <tr key={tenant._id}>
                <td>{tenant.name}</td>
                <td>{tenant.contact}</td>
                <td>{tenant.room || 'N/A'}</td>
                <td>{tenant.status}</td>
                <td>{tenant.moveInDate ? new Date(tenant.moveInDate).toLocaleDateString() : 'N/A'}</td>
                <td>{tenant.moveOutDate ? new Date(tenant.moveOutDate).toLocaleDateString() : 'N/A'}</td>
                <td>{tenant.accommodationType}</td>
                <td>{tenant.rentPaidStatus}</td>
                <td>{tenant.securityDeposit?.amount ? `₹${tenant.securityDeposit.amount}` : 'N/A'}</td>
                <td>
                  <button onClick={() => handleEditTenant(tenant)}>Edit</button>
                  <button onClick={() => handleDeleteTenant(tenant._id)} style={{ marginLeft: 8 }}>Delete</button>
                  <button onClick={() => handleViewHistory(tenant)} style={{ marginLeft: 8 }}>History</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Placeholder for TenantHistoryModal */}
      {showTenantHistoryModal && selectedTenantForHistory && (
        <TenantHistoryModal 
          isOpen={showTenantHistoryModal}
          onClose={handleCloseTenantHistoryModal}
          tenant={selectedTenantForHistory} 
          historyData={tenantHistoryData}
          isLoading={historyLoading}
        />
      )}
    </>
  );
};

export default TenantsTab;
