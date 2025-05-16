import React, { useState, useEffect } from 'react';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [rooms, setRooms] = useState([]);

  useEffect(() => {
    fetch('/api/rooms')
      .then((response) => {
        if (!response.ok) {
          throw new Error('Failed to fetch rooms');
        }
        return response.json();
      })
      .then((data) => {
        console.log('Fetched rooms:', data); // Debug log
        setRooms(data);
      })
      .catch((error) => console.error('Error fetching rooms:', error));
  }, []);

  const handleUpdate = (roomId, updatedData) => {
    console.log('Updating room:', roomId, 'with data:', updatedData);

    fetch(`/api/rooms/${roomId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedData),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error('Failed to update room');
        }
        return response.json();
      })
      .then((data) => {
        console.log('Room updated successfully:', data);
        setRooms((prevRooms) =>
          prevRooms.map((room) => (room._id === roomId ? { ...room, ...updatedData } : room))
        );
      })
      .catch((error) => console.error('Error updating room:', error));
  };

  return (
    <div className="admin-dashboard">
      <h1>Admin Dashboard</h1>
      <table className="room-table">
        <thead>
          <tr>
            <th>Room Name</th>
            <th>Location</th>
            <th>Price</th>
            <th>Type</th>
            <th>Max Occupancy</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {rooms.map((room) => (
            <tr key={room._id}>
              <td>{room.name}</td>
              <td>{room.location}</td>
              <td>${room.price}</td>
              <td>{room.type || 'N/A'}</td>
              <td>{room.occupancy.max || 'N/A'}</td>
              <td>
                <button
                  onClick={() =>
                    handleUpdate(room._id, { blocked: !room.blocked })
                  }
                >
                  {room.blocked ? 'Unblock' : 'Block'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AdminDashboard;