import React, { useEffect, useState } from 'react';
import axios from 'axios';

const RentSecurityTab = () => {
  const [bookings, setBookings] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [error, setError] = useState('');

  useEffect(() => {
    axios.get('http://localhost:5000/api/bookings').then(res => setBookings(res.data));
    axios.get('http://localhost:5000/api/tenants').then(res => setTenants(res.data));
  }, []);

  // Helper to get tenant name by id
  const getTenantName = (tenantObjOrId) => {
    if (!tenantObjOrId) return '';
    if (typeof tenantObjOrId === 'object' && tenantObjOrId.name) return tenantObjOrId.name;
    const t = tenants.find(t => t._id === tenantObjOrId);
    return t ? t.name : tenantObjOrId;
  };

  const handleEdit = (booking) => {
    setEditingId(booking._id);
    setEditForm({
      rentAmount: booking.rentAmount,
      rentPaidStatus: booking.rentPaidStatus,
      rentDueDate: booking.rentDueDate ? booking.rentDueDate.slice(0,10) : '',
      rentPaymentDate: booking.rentPaymentDate ? booking.rentPaymentDate.slice(0,10) : '',
      securityDeposit: booking.securityDeposit,
      notes: booking.notes || '',
      accommodationType: booking.accommodationType,
    });
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm({ ...editForm, [name]: value });
  };

  const handleEditSave = async (booking) => {
    try {
      const updated = {
        ...booking,
        rentAmount: Number(editForm.rentAmount),
        rentPaidStatus: editForm.rentPaidStatus,
        rentDueDate: editForm.rentDueDate,
        rentPaymentDate: editForm.rentPaymentDate,
        securityDeposit: Number(editForm.securityDeposit),
        notes: editForm.notes,
        accommodationType: editForm.accommodationType,
      };
      await axios.put(`http://localhost:5000/api/bookings/${booking._id}`, updated);
      setBookings(bookings.map(b => b._id === booking._id ? { ...b, ...updated } : b));
      setEditingId(null);
      setError('');
    } catch (err) {
      setError('Failed to update booking.');
    }
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setEditForm({});
    setError('');
  };

  // Calculate summary values
  const totalRentReceived = bookings.reduce((sum, b) => b.rentPaidStatus === 'paid' ? sum + (b.customRent || b.rentAmount || 0) : sum, 0);
  const totalRentForecast = bookings.reduce((sum, b) => sum + (b.customRent || b.rentAmount || 0), 0);
  const totalDeposit = bookings.reduce((sum, b) => sum + (b.securityDeposit || 0), 0);

  return (
    <div>
      <h2>Rent & Security Deposit Details</h2>
      {/* Summary Table */}
      <table className="room-table" style={{ maxWidth: 600, marginBottom: 24 }}>
        <thead>
          <tr>
            <th>Total Rent Received</th>
            <th>Total Rent Forecast</th>
            <th>Total Security Deposit</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>₹{totalRentReceived}</td>
            <td>₹{totalRentForecast}</td>
            <td>₹{totalDeposit}</td>
          </tr>
        </tbody>
      </table>
      {error && <div style={{ color: 'red', marginBottom: 8 }}>{error}</div>}
      <table className="room-table">
        <thead>
          <tr>
            <th>Room</th>
            <th>Tenant</th>
            <th>From</th>
            <th>To</th>
            <th>Accommodation Type</th>
            <th>Rent Amount</th>
            <th>Rent Status</th>
            <th>Due Date</th>
            <th>Payment Date</th>
            <th>Security Deposit</th>
            <th>Notes</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {bookings.map((b, idx) => (
            <tr key={idx}>
              <td>{b.room}</td>
              <td>{getTenantName(b.tenant)}</td>
              <td>{b.startDate ? b.startDate.slice(0,10) : ''}</td>
              <td>{b.endDate ? b.endDate.slice(0,10) : ''}</td>
              <td>{b.accommodationType}</td>
              {editingId === b._id ? (
                <>
                  <td><input name="rentAmount" type="number" value={editForm.rentAmount} onChange={handleEditChange} /></td>
                  <td>
                    <select name="rentPaidStatus" value={editForm.rentPaidStatus} onChange={handleEditChange}>
                      <option value="paid">Paid</option>
                      <option value="due">Due</option>
                      <option value="partial">Partial</option>
                    </select>
                  </td>
                  <td><input name="rentDueDate" type="date" value={editForm.rentDueDate} onChange={handleEditChange} /></td>
                  <td><input name="rentPaymentDate" type="date" value={editForm.rentPaymentDate} onChange={handleEditChange} /></td>
                  <td><input name="securityDeposit" type="number" value={editForm.securityDeposit} onChange={handleEditChange} /></td>
                  <td><input name="notes" value={editForm.notes} onChange={handleEditChange} /></td>
                  <td>
                    <select name="accommodationType" value={editForm.accommodationType} onChange={handleEditChange}>
                      <option value="monthly">Monthly</option>
                      <option value="daily">Daily</option>
                    </select>
                  </td>
                  <td>
                    <button onClick={() => handleEditSave(b)}>Save</button>
                    <button onClick={handleEditCancel} style={{ marginLeft: 6 }}>Cancel</button>
                  </td>
                </>
              ) : (
                <>
                  <td>{b.customRent ? (
                    <span title="Custom Rent (Concession)">₹{b.customRent} <span style={{ background: '#ffe082', color: '#333', borderRadius: 4, padding: '2px 6px', fontSize: 12, marginLeft: 4 }}>Concession</span></span>
                  ) : (
                    `₹${b.rentAmount}`
                  )}</td>
                  <td>{b.rentPaidStatus}</td>
                  <td>{b.rentDueDate ? b.rentDueDate.slice(0,10) : ''}</td>
                  <td>{b.rentPaymentDate ? b.rentPaymentDate.slice(0,10) : ''}</td>
                  <td>{b.securityDeposit ? `₹${b.securityDeposit}` : '-'}</td>
                  <td>{b.notes || '-'}</td>
                  <td>
                    <button onClick={() => handleEdit(b)}>Edit</button>
                  </td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default RentSecurityTab;
