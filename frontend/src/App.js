import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { login, addRoom, updateRoom, deleteRoom, addUser } from './api';
import AddUserForm from './components/AddUserForm';

function App() {
  const [rooms, setRooms] = useState([]);
  const [token, setToken] = useState('');
  const [newRoom, setNewRoom] = useState({ name: '', location: '', price: '', type: '', occupancy: { current: 0, max: '' } });
  const [updateRoomData, setUpdateRoomData] = useState({ id: '', name: '', location: '', price: '' });
  const [deleteRoomId, setDeleteRoomId] = useState('');
  const [error, setError] = useState('');
  const [loginData, setLoginData] = useState({ email: '', password: '' });

  useEffect(() => {
    axios.get('http://localhost:5000/api/rooms')
      .then((response) => {
        console.log('Rooms fetched:', response.data); // Debug log
        setRooms(response.data);
      })
      .catch((error) => {
        console.error('Error fetching rooms:', error);
        setError('Failed to fetch rooms. Please try again.');
      });
  }, []);

  const handleLogin = (e) => {
    e.preventDefault();
    console.log('Login attempt with:', loginData); // Debug log
    login(loginData)
      .then((response) => {
        console.log('Login successful:', response.data); // Debug log
        setToken(response.data.token);
        localStorage.setItem('token', response.data.token); // Store token in localStorage
        window.location.href = '/admin-dashboard'; // Redirect to Admin Dashboard
      })
      .catch((error) => {
        console.error('Error logging in:', error.response ? error.response.data : error.message); // Debug log
        alert('Login failed. Please check your credentials.');
      });
  };

  const handleAddRoom = (e) => {
    e.preventDefault();
    addRoom(newRoom, token)
      .then((response) => {
        setRooms([...rooms, response.data]);
        setNewRoom({ name: '', location: '', price: '', type: '', occupancy: { current: 0, max: '' } });
      })
      .catch((error) => console.error('Error adding room:', error));
  };

  const handleUpdateRoom = (e) => {
    e.preventDefault();
    updateRoom(updateRoomData.id, updateRoomData, token)
      .then((response) => {
        alert('Room updated successfully!');
        setRooms(rooms.map((room) => (room._id === response.data._id ? response.data : room)));
      })
      .catch((error) => console.error('Error updating room:', error));
  };

  const handleDeleteRoom = (e) => {
    e.preventDefault();
    deleteRoom(deleteRoomId, token)
      .then(() => {
        alert('Room deleted successfully!');
        setRooms(rooms.filter((room) => room._id !== deleteRoomId));
      })
      .catch((error) => console.error('Error deleting room:', error));
  };

  return (
    <div>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <h1>PG Accommodation System</h1>

      <h2>Login</h2>
      <form onSubmit={handleLogin}>
        <input
          type="email"
          placeholder="Email"
          value={loginData.email}
          onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={loginData.password}
          onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
          required
        />
        <button type="submit">Login</button>
      </form>

      <h2>Rooms</h2>
      <ul>
        {rooms.map((room) => (
          <li key={room._id}>
            {room.name} - {room.location} - ${room.price}
          </li>
        ))}
      </ul>

      <h2>Add Room</h2>
      <form onSubmit={handleAddRoom}>
        <input type="text" placeholder="Room Name" value={newRoom.name} onChange={(e) => setNewRoom({ ...newRoom, name: e.target.value })} required />
        <input type="text" placeholder="Location" value={newRoom.location} onChange={(e) => setNewRoom({ ...newRoom, location: e.target.value })} required />
        <input type="number" placeholder="Price" value={newRoom.price} onChange={(e) => setNewRoom({ ...newRoom, price: e.target.value })} required />
        <select value={newRoom.type} onChange={(e) => setNewRoom({ ...newRoom, type: e.target.value })} required>
          <option value="">Select Type</option>
          <option value="private">Private</option>
          <option value="2-sharing">2-Sharing</option>
          <option value="3-sharing">3-Sharing</option>
          <option value="4-sharing">4-Sharing</option>
          <option value="5-sharing">5-Sharing</option>
        </select>
        <input type="number" placeholder="Max Occupancy" value={newRoom.occupancy.max} onChange={(e) => setNewRoom({ ...newRoom, occupancy: { ...newRoom.occupancy, max: e.target.value } })} required />
        <button type="submit">Add Room</button>
      </form>

      <h2>Update Room</h2>
      <form onSubmit={handleUpdateRoom}>
        <input type="text" placeholder="Room ID" value={updateRoomData.id} onChange={(e) => setUpdateRoomData({ ...updateRoomData, id: e.target.value })} required />
        <input type="text" placeholder="New Name" value={updateRoomData.name} onChange={(e) => setUpdateRoomData({ ...updateRoomData, name: e.target.value })} required />
        <input type="text" placeholder="New Location" value={updateRoomData.location} onChange={(e) => setUpdateRoomData({ ...updateRoomData, location: e.target.value })} required />
        <input type="number" placeholder="New Price" value={updateRoomData.price} onChange={(e) => setUpdateRoomData({ ...updateRoomData, price: e.target.value })} required />
        <button type="submit">Update Room</button>
      </form>

      <h2>Delete Room</h2>
      <form onSubmit={handleDeleteRoom}>
        <input type="text" placeholder="Room ID" value={deleteRoomId} onChange={(e) => setDeleteRoomId(e.target.value)} required />
        <button type="submit">Delete Room</button>
      </form>

      <AddUserForm token={token} />
    </div>
  );
}

export default App;