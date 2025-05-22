import React, { useState } from 'react';
import axios from 'axios';

// Define the roles based on your backend User model
const ROLES = ['Admin', 'Manager', 'Staff', 'Accountant', 'Tenant'];
const API_BASE_URL = 'http://localhost:5000';

function AddUserForm({ token, onUserAdded }) { // Added onUserAdded callback
  const [newUser, setNewUser] = useState({ 
    name: '', 
    username: '', // Changed from email to username
    password: '', 
    role: ROLES[ROLES.length -1] // Default to Tenant or the last role
  });
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewUser({ ...newUser, [name]: value });
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    try {
      // Use the admin route for creating users
      const response = await axios.post(`${API_BASE_URL}/api/users`, newUser, {
        headers: { Authorization: `Bearer ${token}` }, // Ensure Bearer token format
      });
      setSuccessMessage(response.data.message || 'User added successfully!');
      setNewUser({ name: '', username: '', password: '', role: ROLES[ROLES.length -1] }); // Reset form
      if (onUserAdded) {
        onUserAdded(); // Callback to refresh user list or close modal
      }
    } catch (err) {
      setError(
        err.response && err.response.data && err.response.data.error
          ? err.response.data.error
          : 'Error adding user.'
      );
      console.error('Error adding user:', err);
    }
  };

  return (
    <div>
      <h2>Add New User</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {successMessage && <p style={{ color: 'green' }}>{successMessage}</p>}
      <form onSubmit={handleAddUser}>
        <div style={{ marginBottom: '10px' }}>
          <label htmlFor="name">Name:</label>
          <input
            type="text"
            id="name"
            name="name"
            placeholder="Full Name (Optional)"
            value={newUser.name}
            onChange={handleInputChange}
          />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label htmlFor="username">Username:</label>
          <input
            type="text" // Changed from email to text
            id="username"
            name="username"
            placeholder="Username"
            value={newUser.username}
            onChange={handleInputChange}
            required
          />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label htmlFor="password">Password:</label>
          <input
            type="password"
            id="password"
            name="password"
            placeholder="Password"
            value={newUser.password}
            onChange={handleInputChange}
            required
          />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label htmlFor="role">Role:</label>
          <select
            id="role"
            name="role"
            value={newUser.role}
            onChange={handleInputChange}
          >
            {ROLES.map(role => (
              <option key={role} value={role}>{role}</option>
            ))}
          </select>
        </div>
        <button type="submit">Add User</button>
      </form>
    </div>
  );
}

export default AddUserForm;
