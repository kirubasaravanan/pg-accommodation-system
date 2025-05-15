import React, { useEffect, useState } from 'react';
import axios from 'axios';

function AdminDashboard() {
  const [rooms, setRooms] = useState([]);
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('token'); // Retrieve token from localStorage

    axios.get('http://localhost:5000/api/rooms')
      .then((response) => {
        console.log('Rooms fetched in AdminDashboard:', response.data); // Debug log
        setRooms(response.data);
      })
      .catch((error) => console.error('Error fetching rooms:', error));

    axios.get('http://localhost:5000/api/bookings', {
      headers: { Authorization: token },
    })
      .then((response) => setBookings(response.data))
      .catch((error) => console.error('Error fetching bookings:', error));
  }, []);

  console.log('AdminDashboard component rendered'); // Debug log

  return (
    <div>
      <h1>Admin Dashboard</h1>
      <h2>Rooms</h2>
      <ul>
        {rooms.map((room) => (
          <li key={room._id}>
            {room.name} - {room.location} - ${room.price}
          </li>
        ))}
      </ul>

      <h2>Bookings</h2>
      <ul>
        {bookings.map((booking) => (
          <li key={booking._id}>
            Room: {booking.room.name}, User: {booking.user.name}, Status: {booking.status}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default AdminDashboard;