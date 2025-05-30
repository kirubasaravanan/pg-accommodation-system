import React, { useState, useEffect } from 'react';
import { apiClientInstance as apiClient } from '../api'; // Corrected import to use apiClientInstance
import styles from './UserManagementForms.module.css';

const ROLES = ['Admin', 'Manager', 'Staff', 'Accountant', 'Tenant'];
const STATUSES = ['active', 'blocked', 'inactive'];

function EditUserForm({ userToEdit, onUserUpdated, onCancel }) { // Removed token prop
  const [formData, setFormData] = useState({ name: '', username: '', role: '', status: '' });
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (userToEdit) {
      setFormData({
        name: userToEdit.name || '',
        username: userToEdit.username || '',
        role: userToEdit.role || ROLES[ROLES.length - 1],
        status: userToEdit.status || STATUSES[0],
      });
    }
  }, [userToEdit]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    if (!userToEdit || !userToEdit._id) {
      setError('No user selected for editing.');
      return;
    }
    try {
      // const response = await axios.put(`${API_BASE_URL}/api/users/${userToEdit._id}`, formData, {
      //   headers: { Authorization: `Bearer ${token}` },
      // });
      const response = await apiClient.put(`/api/users/${userToEdit._id}`, formData); // Use apiClient
      setSuccessMessage(response.data.message || 'User updated successfully!');
      if (onUserUpdated) {
        onUserUpdated();
      }
    } catch (err) {
      setError(
        err.response && err.response.data && err.response.data.error
          ? err.response.data.error
          : 'Error updating user.'
      );
      console.error('Error updating user:', err);
    }
  };

  return (
    <div>
      <h3>Edit User: {userToEdit?.username}</h3>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {successMessage && <p style={{ color: 'green' }}>{successMessage}</p>}
      <form onSubmit={handleUpdateUser}>
        <div style={{ marginBottom: '10px' }}>
          <label htmlFor="edit-name">Name:</label>
          <input
            type="text"
            id="edit-name"
            name="name"
            placeholder="Full Name (Optional)"
            value={formData.name}
            onChange={handleInputChange}
          />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label htmlFor="edit-username">Username:</label>
          <input
            type="text"
            id="edit-username"
            name="username"
            placeholder="Username"
            value={formData.username}
            onChange={handleInputChange}
            required
          />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label htmlFor="edit-role">Role:</label>
          <select
            id="edit-role"
            name="role"
            value={formData.role}
            onChange={handleInputChange}
          >
            {ROLES.map(role => (
              <option key={role} value={role}>{role}</option>
            ))}
          </select>
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label htmlFor="edit-status">Status:</label>
          <select
            id="edit-status"
            name="status"
            value={formData.status}
            onChange={handleInputChange}
          >
            {STATUSES.map(status => (
              <option key={status} value={status}>{status.charAt(0).toUpperCase() + status.slice(1)}</option>
            ))}
          </select>
        </div>
        <button type="submit" style={{ marginRight: '10px' }}>Update User</button>
        <button type="button" onClick={onCancel}>Cancel</button>
      </form>
    </div>
  );
}

export default EditUserForm;
