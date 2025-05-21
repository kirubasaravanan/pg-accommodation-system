import React, { useEffect, useState } from 'react';
import axios from 'axios';

const monthName = (dateStr) => {
  const d = new Date(dateStr);
  return d.toLocaleString('default', { month: 'short', year: 'numeric' });
};

const Reports = () => {
  const [bookings, setBookings] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      axios.get('http://localhost:5000/api/bookings'),
      axios.get('http://localhost:5000/api/rooms'),
    ]).then(([bookingsRes, roomsRes]) => {
      setBookings(bookingsRes.data);
      setRooms(roomsRes.data);
      setLoading(false);
    });
  }, []);

  // Group bookings by month
  const monthlyStats = {};
  bookings.forEach(b => {
    const month = b.startDate ? b.startDate.slice(0,7) : 'Unknown';
    if (!monthlyStats[month]) monthlyStats[month] = { rent: 0, occupied: 0, total: 0 };
    monthlyStats[month].rent += b.customRent || b.rentAmount || 0;
    monthlyStats[month].occupied += 1;
  });
  const totalRooms = rooms.reduce((sum, r) => sum + (r.occupancy?.max || 1), 0);
  Object.keys(monthlyStats).forEach(month => {
    monthlyStats[month].total = totalRooms;
  });

  return (
    <>
      <style>{`
        @media (max-width: 600px) {
          .reports-root {
            padding: 8px !important;
          }
          .reports-table {
            font-size: 14px !important;
            overflow-x: auto !important;
            display: block !important;
            max-width: 100vw !important;
          }
        }
      `}</style>
      <div className="reports-root" style={{ padding: 32 }}>
        <h1>Reports: Occupancy & Rent Trends</h1>
        {loading ? <div>Loading...</div> : (
          <table className="room-table reports-table" style={{ maxWidth: 700 }}>
            <thead>
              <tr>
                <th>Month</th>
                <th>Rooms Occupied</th>
                <th>Total Rooms</th>
                <th>Occupancy %</th>
                <th>Rent Collected</th>
              </tr>
            </thead>
            <tbody>
              {Object.keys(monthlyStats).sort().map(month => (
                <tr key={month}>
                  <td>{monthName(month + '-01')}</td>
                  <td>{monthlyStats[month].occupied}</td>
                  <td>{monthlyStats[month].total}</td>
                  <td>{((monthlyStats[month].occupied / monthlyStats[month].total) * 100).toFixed(1)}%</td>
                  <td>₹{monthlyStats[month].rent}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
};

export default Reports;
