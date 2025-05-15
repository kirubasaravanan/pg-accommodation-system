import React, { useState } from 'react';
import axios from 'axios';

function AddUserForm({ token }) {
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'tenant' });

  const handleAddUser = (e) => {
    e.preventDefault();
    axios.post('http://localhost:5000/api/auth/register', newUser, {
      headers: { Authorization: token },
    })
      .then(() => {
        alert('User added successfully!');
        setNewUser({ name: '', email: '', password: '', role: 'tenant' });
      })
      .catch((error) => {
        console.error('Error adding user:', error);
      });
  };

  return (
    <div>
      <h2>Add User</h2>
      <form onSubmit={handleAddUser}>
        <input
          type="text"
          placeholder="Name"
          value={newUser.name}
          onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
          required
        />
        <input
          type="email"
          placeholder="Email"
          value={newUser.email}
          onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={newUser.password}
          onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
          required
        />
        <select
          value={newUser.role}
          onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
        >
          <option value="tenant">Tenant</option>
          <option value="admin">Admin</option>
        </select>
        <button type="submit">Add User</button>
      </form>
    </div>
  );
}

export default AddUserForm;
