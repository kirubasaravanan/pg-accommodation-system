// RentDetails.js - Shows rent calculation, forecasting, and security deposit info for tenants
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const RentDetails = () => {
  const [tenants, setTenants] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [expandedMonths, setExpandedMonths] = useState([new Date().toISOString().slice(0,7)]);

  useEffect(() => {
    axios.get('http://localhost:5000/api/tenants').then(res => setTenants(res.data));
    axios.get('http://localhost:5000/api/bookings').then(res => setBookings(res.data));
  }, []);

  const handleSelectTenant = (tenantId) => {
    setSelectedTenant(tenants.find(t => t._id === tenantId));
    // Calculate forecast for this tenant
    const tenantBookings = bookings.filter(b => b.tenant === tenantId);
    let totalDue = 0, totalPaid = 0, nextDueDate = null, securityDeposit = 0;
    tenantBookings.forEach(b => {
      if (b.rentPaidStatus === 'paid') totalPaid += b.rentAmount;
      else totalDue += b.rentAmount;
      if (!nextDueDate || (b.rentDueDate && new Date(b.rentDueDate) > new Date(nextDueDate))) nextDueDate = b.rentDueDate;
      if (b.securityDeposit) securityDeposit = b.securityDeposit;
    });
    setForecast({ totalDue, totalPaid, nextDueDate, securityDeposit });
  };

  // Group bookings by month
  const groupByMonth = (bookings) => {
    const groups = {};
    bookings.forEach(b => {
      const month = b.rentDueDate ? b.rentDueDate.slice(0,7) : 'Unknown';
      if (!groups[month]) groups[month] = [];
      groups[month].push(b);
    });
    return groups;
  };
  const grouped = groupByMonth(bookings.filter(b => b.tenant === selectedTenant?._id));

  return (
    <>
      <style>{`
        @media (max-width: 600px) {
          .rent-details-root {
            padding: 8px !important;
          }
          .rent-details-card {
            max-width: 100% !important;
            padding: 10px !important;
            font-size: 15px !important;
          }
          .rent-details-table {
            font-size: 14px !important;
            overflow-x: auto !important;
            display: block !important;
          }
        }
      `}</style>
      <div className="rent-details-root" style={{ padding: 24 }}>
        <h1>Rent & Security Deposit Details</h1>
        <div style={{ marginBottom: 16 }}>
          <label>Select Tenant: </label>
          <select onChange={e => handleSelectTenant(e.target.value)} defaultValue="">
            <option value="">-- Select --</option>
            {tenants.map(t => <option key={t._id} value={t._id}>{t.name} ({t.contact})</option>)}
          </select>
        </div>
        {selectedTenant && forecast && (
          <div style={{ border: '1px solid #ccc', borderRadius: 8, padding: 16, maxWidth: 500 }}>
            <h2>{selectedTenant.name}</h2>
            <div><b>Total Rent Paid:</b> ₹{forecast.totalPaid}</div>
            <div><b>Total Rent Due:</b> ₹{forecast.totalDue}</div>
            <div><b>Next Rent Due Date:</b> {forecast.nextDueDate ? forecast.nextDueDate.slice(0,10) : '-'}</div>
            <div><b>Security Deposit:</b> ₹{forecast.securityDeposit}</div>
          </div>
        )}
        {selectedTenant && bookings.filter(b => b.tenant === selectedTenant._id).length > 0 && (
          <div style={{ marginTop: 24 }}>
            <h3>Booking & Rent History</h3>
            {Object.keys(grouped).sort((a, b) => b.localeCompare(a)).map(month => (
              <div key={month} style={{ marginBottom: 12 }}>
                <div style={{ cursor: 'pointer', fontWeight: expandedMonths.includes(month) ? 'bold' : 'normal', background: '#f5f5f5', padding: 6, borderRadius: 4 }}
                  onClick={() => setExpandedMonths(expandedMonths.includes(month) ? expandedMonths.filter(m => m !== month) : [...expandedMonths, month])}>
                  {month} {expandedMonths.includes(month) ? '▼' : '▶'}
                </div>
                {expandedMonths.includes(month) && (
                  <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 4 }} className="rent-details-table">
                    <thead>
                      <tr>
                        <th>Room</th>
                        <th>From</th>
                        <th>To</th>
                        <th>Rent</th>
                        <th>Status</th>
                        <th>Due Date</th>
                        <th>Payment Date</th>
                        <th>Security Deposit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {grouped[month].map((b, idx) => (
                        <tr key={idx}>
                          <td>{b.room}</td>
                          <td>{b.startDate ? b.startDate.slice(0,10) : ''}</td>
                          <td>{b.endDate ? b.endDate.slice(0,10) : ''}</td>
                          <td>{b.customRent ? (<span title="Custom Rent (Concession)">₹{b.customRent} <span style={{ background: '#ffe082', color: '#333', borderRadius: 4, padding: '2px 6px', fontSize: 12, marginLeft: 4 }}>Concession</span></span>) : (`₹${b.rentAmount}`)}</td>
                          <td>{b.rentPaidStatus}</td>
                          <td>{b.rentDueDate ? b.rentDueDate.slice(0,10) : ''}</td>
                          <td>{b.rentPaymentDate ? b.rentPaymentDate.slice(0,10) : ''}</td>
                          <td>{b.securityDeposit ? `₹${b.securityDeposit}` : '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default RentDetails;
