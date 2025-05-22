import React, { useState, useEffect, useCallback } from 'react';
import styles from '../pages/NewAdminDashboard.module.css'; 
import { fetchUsers, deleteUser } from '../api'; // Import deleteUser
import AddUserForm from './AddUserForm';
import EditUserForm from './EditUserForm';

// Simple Modal Component
const ConfirmationModal = ({ show, message, onConfirm, onCancel }) => {
  if (!show) {
    return null;
  }
  return (
    <div className={styles.modalBackdrop}>
      <div className={styles.modalContent}>
        <p>{message}</p>
        <div className={styles.modalActions}>
          <button onClick={onConfirm} className={styles.actionButton}>Confirm</button>
          <button onClick={onCancel} className={styles.actionButtonSecondary}>Cancel</button>
        </div>
      </div>
    </div>
  );
};

const UserManagementConsole = ({ onBack }) => {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showAddUserForm, setShowAddUserForm] = useState(false);
  const [showEditUserForm, setShowEditUserForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false); // State for delete confirmation modal
  const [deletingUser, setDeletingUser] = useState(null); // State for user to be deleted

  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication token not found. Please log in.');
        setIsLoading(false);
        return;
      }
      const response = await fetchUsers(token);
      setUsers(response.data); 
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch users. Please ensure you are logged in as an admin.');
      console.error('Error fetching users:', err);
    }
    setIsLoading(false);
  }, []); // Empty dependency array means this function is created once

  useEffect(() => {
    loadUsers();
  }, [loadUsers]); // useEffect depends on loadUsers

  const handleUserAdded = () => {
    setShowAddUserForm(false); // Hide form after adding user
    loadUsers(); // Refresh the user list
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setShowEditUserForm(true);
  };

  const handleUserUpdated = () => {
    setShowEditUserForm(false);
    setEditingUser(null);
    loadUsers();
  };

  const handleCancelEdit = () => {
    setShowEditUserForm(false);
    setEditingUser(null);
  };

  const handleDeleteRequest = (user) => {
    setDeletingUser(user);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteUser = async () => {
    if (!deletingUser) return;
    try {
      const token = localStorage.getItem('token');
      await deleteUser(deletingUser._id, token);
      setShowDeleteConfirm(false);
      setDeletingUser(null);
      loadUsers(); // Refresh list
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete user.');
      console.error('Error deleting user:', err);
      setShowDeleteConfirm(false); // Hide modal even on error
      setDeletingUser(null);
    }
  };

  const cancelDeleteUser = () => {
    setShowDeleteConfirm(false);
    setDeletingUser(null);
  };

  return (
    <div className={styles.userManagementConsole}>
      <button onClick={onBack} className={styles.backButton}>
        &larr; Back to Admin Console
      </button>
      <h2>User Management</h2>

      {!showEditUserForm && !showDeleteConfirm && ( // Hide if editing or deleting
        <button 
          onClick={() => setShowAddUserForm(!showAddUserForm)}
          className={styles.actionButton} 
          style={{ marginBottom: '20px' }}
          disabled={showAddUserForm} 
        >
          {showAddUserForm ? 'Cancel Add User' : 'Add New User'}
        </button>
      )}

      {showAddUserForm && !showEditUserForm && !showDeleteConfirm && (
        <div style={{ border: '1px solid #ddd', padding: '20px', marginBottom: '20px', borderRadius: '8px' }}>
          <AddUserForm 
            token={localStorage.getItem('token')} 
            onUserAdded={handleUserAdded} 
          />
        </div>
      )}

      {showEditUserForm && editingUser && (
        <div style={{ border: '1px solid #ddd', padding: '20px', marginBottom: '20px', borderRadius: '8px' }}>
          <EditUserForm
            token={localStorage.getItem('token')}
            userToEdit={editingUser}
            onUserUpdated={handleUserUpdated}
            onCancel={handleCancelEdit}
          />
        </div>
      )}

      <ConfirmationModal
        show={showDeleteConfirm}
        message={`Are you sure you want to delete user '${deletingUser?.username}'? This action cannot be undone.`}
        onConfirm={confirmDeleteUser}
        onCancel={cancelDeleteUser}
      />

      {isLoading && <p>Loading users...</p>}
      {error && <p className={styles.errorMessage}>{error}</p>}

      {!isLoading && !error && !showAddUserForm && !showEditUserForm && ( 
        <table className={styles.userTable}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Username</th>
              <th>Role</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.length > 0 ? (
              users.map(user => (
                <tr key={user._id}>
                  <td>{user.name || 'N/A'}</td>
                  <td>{user.username}</td>
                  <td>{user.role}</td>
                  <td>{user.status}</td>
                  <td>
                    <button className={styles.actionButton} onClick={() => handleEditUser(user)}>Edit</button>
                    <button className={styles.actionButton} onClick={() => handleDeleteRequest(user)}>Delete</button> {/* Call handleDeleteRequest */}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5">No users found.</td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default UserManagementConsole;
