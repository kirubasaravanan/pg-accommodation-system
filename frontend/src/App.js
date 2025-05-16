import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { login, addRoom, updateRoom, deleteRoom, addUser } from './api';
import AddUserForm from './components/AddUserForm';
import AdminDashboard from './pages/AdminDashboard';
import './App.css';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';

function App() {
  const [rooms, setRooms] = useState([]);
  const [token, setToken] = useState(null); // Simplify token state
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

  const handleLogin = () => {
    // Bypass login logic and directly set the token
    setToken('admin-token');
    console.log('Bypassed login, redirecting to Admin Dashboard'); // Debug log
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
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            token ? <Navigate to="/admin" /> : (
              <div className="login-page">
                <h1>Login</h1>
                <input
                  type="email"
                  placeholder="Email"
                  value={loginData.email}
                  onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={loginData.password}
                  onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                />
                <button onClick={handleLogin}>Login</button>
              </div>
            )
          }
        />
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;