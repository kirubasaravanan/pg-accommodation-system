import React, { useState, useEffect } from 'react';
import axios from 'axios';

const TenantHistory = () => {
  const [tenants, setTenants] = useState([]);
  const [selectedTenant, setSelectedTenant] = useState(null);

  useEffect(() => {
    // Fetch all tenants
    axios.get('/api/tenants')
      .then(response => setTenants(response.data))
      .catch(error => console.error('Error fetching tenants:', error));
  }, []);

  const fetchTenantHistory = (tenantId) => {
    axios.get(`/api/tenants/${tenantId}/history`)
      .then(response => setSelectedTenant(response.data))
      .catch(error => console.error('Error fetching tenant history:', error));
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Tenant History</h1>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h2 className="text-xl font-semibold mb-2">Tenants</h2>
          <ul className="border rounded p-4">
            {tenants.map(tenant => (
              <li key={tenant._id} className="mb-2">
                <button
                  className="text-blue-600 underline"
                  onClick={() => fetchTenantHistory(tenant._id)}
                >
                  {tenant.name}
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div>
          {selectedTenant ? (
            <div>
              <h2 className="text-xl font-semibold mb-2">History for {selectedTenant.name}</h2>
              <h3 className="font-bold">Daily Bookings:</h3>
              <ul className="list-disc pl-5">
                {selectedTenant.dailyBookings.map((booking, index) => (
                  <li key={index}>{booking.date} - Room: {booking.room} - Status: {booking.rentPaidStatus}</li>
                ))}
              </ul>
              <h3 className="font-bold mt-4">Monthly Bookings:</h3>
              <ul className="list-disc pl-5">
                {selectedTenant.bookingHistory.map((history, index) => (
                  <li key={index}>
                    {history.startDate} to {history.endDate} - Room: {history.room} - Status: {history.rentPaidStatus}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p>Select a tenant to view their history.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default TenantHistory;
