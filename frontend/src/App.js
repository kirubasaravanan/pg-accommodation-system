import React, { useEffect, useState } from 'react';
import axios from 'axios';

function App() {
  const [message, setMessage] = useState('');
  const [rooms, setRooms] = useState([]);
  const [newRoom, setNewRoom] = useState({ name: '', location: '', price: '' });
  const [user, setUser] = useState({ name: '', email: '', password: '' });

  useEffect(() => {
    // Fetch data from the backend
    axios.get('http://localhost:5000/')
      .then((response) => {
        setMessage(response.data);
      })
      .catch((error) => {
        console.error('Error fetching data:', error);
      });

    axios.get('http://localhost:5000/api/rooms')
      .then((response) => {
        setRooms(response.data);
      })
      .catch((error) => {
        console.error('Error fetching rooms:', error);
      });
  }, []);

  const handleAddRoom = (e) => {
    e.preventDefault();
    axios.post('http://localhost:5000/api/rooms', newRoom)
      .then((response) => {
        setRooms([...rooms, response.data]);
        setNewRoom({ name: '', location: '', price: '' });
      })
      .catch((error) => {
        console.error('Error adding room:', error);
      });
  };

  const handleRegisterUser = (e) => {
    e.preventDefault();
    axios.post('http://localhost:5000/api/auth/register', user)
      .then((response) => {
        alert('User registered successfully!');
        setUser({ name: '', email: '', password: '' });
      })
      .catch((error) => {
        console.error('Error registering user:', error);
      });
  };

  return (
    <div>
      <h1>PG Accommodation System</h1>
      <p>{message}</p>

      <h2>Rooms</h2>
      <ul>
        {rooms.map((room, index) => (
          <li key={index}>{room.name} - {room.location} - ${room.price}</li>
        ))}
      </ul>

      <h2>Add a Room</h2>
      <form onSubmit={handleAddRoom}>
        <input
          type="text"
          placeholder="Room Name"
          value={newRoom.name}
          onChange={(e) => setNewRoom({ ...newRoom, name: e.target.value })}
          required
        />
        <input
          type="text"
          placeholder="Location"
          value={newRoom.location}
          onChange={(e) => setNewRoom({ ...newRoom, location: e.target.value })}
          required
        />
        <input
          type="number"
          placeholder="Price"
          value={newRoom.price}
          onChange={(e) => setNewRoom({ ...newRoom, price: e.target.value })}
          required
        />
        <button type="submit">Add Room</button>
      </form>

      <h2>Register a User</h2>
      <form onSubmit={handleRegisterUser}>
        <input
          type="text"
          placeholder="Name"
          value={user.name}
          onChange={(e) => setUser({ ...user, name: e.target.value })}
          required
        />
        <input
          type="email"
          placeholder="Email"
          value={user.email}
          onChange={(e) => setUser({ ...user, email: e.target.value })}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={user.password}
          onChange={(e) => setUser({ ...user, password: e.target.value })}
          required
        />
        <button type="submit">Register</button>
      </form>
    </div>
  );
}

export default App;