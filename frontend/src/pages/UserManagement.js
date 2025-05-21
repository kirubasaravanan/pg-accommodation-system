import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL = 'http://192.168.x.x:5000';

const ROLES = ['admin', 'staff', 'accountant', 'support'];

const UserManagement = ({ onClose }) => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', email: '', role: 'staff', password: '' });
  const [editingId, setEditingId] = useState(null);
  const [success, setSuccess] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_BASE_URL}/api/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(res.data);
    } catch (err) {
      setError('Failed to fetch users.');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
    setSuccess('');
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const token = localStorage.getItem('token');
      if (editingId) {
        await axios.put(`${API_BASE_URL}/api/users/${editingId}`, form, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSuccess('User updated.');
      } else {
        await axios.post(`${API_BASE_URL}/api/users`, form, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSuccess('User created.');
      }
      setForm({ name: '', email: '', role: 'staff', password: '' });
      setEditingId(null);
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save user.');
    }
  };

  const handleEdit = user => {
    setForm({ name: user.name, email: user.email, role: user.role, password: '' });
    setEditingId(user._id);
    setError('');
    setSuccess('');
  };

  const handleDelete = async id => {
    if (!window.confirm('Delete this user?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_BASE_URL}/api/users/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchUsers();
    } catch (err) {
      setError('Failed to delete user.');
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8" style={{ backgroundColor: '#6C8EBF', color: 'white', borderRadius: '8px', padding: '20px' }}>
      <button
        onClick={onClose}
        style={{
          background: 'none',
          border: 'none',
          color: '#000000', // Black color for better visibility
          fontSize: '24px', // Slightly larger font size
          fontWeight: 'bold',
          cursor: 'pointer',
          position: 'absolute',
          top: '10px',
          right: '10px',
        }}
        title="Close (ESC)"
      >
        &times;
      </button>
      <h2 className="text-2xl font-bold mb-4">User Management</h2>
      {error && <div className="text-red-600 mb-2">{error}</div>}
      {success && <div className="text-green-600 mb-2">{success}</div>}
      <form onSubmit={handleSubmit} className="bg-white rounded shadow p-4 mb-6 flex flex-col gap-3">
        <input name="name" value={form.name} onChange={handleChange} placeholder="Name" className="border rounded px-3 py-2" required />
        <input name="email" value={form.email} onChange={handleChange} placeholder="Email" className="border rounded px-3 py-2" required type="email" />
        <select name="role" value={form.role} onChange={handleChange} className="border rounded px-3 py-2">
          {ROLES.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
        </select>
        <input name="password" value={form.password} onChange={handleChange} placeholder="Password" className="border rounded px-3 py-2" type="password" required={!editingId} />
        <div className="flex gap-2">
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">{editingId ? 'Update' : 'Create'} User</button>
          <button
            type="button"
            className="bg-gray-300 px-4 py-2 rounded"
            onClick={onClose}
          >
            Cancel
          </button>
        </div>
      </form>
      <h3 className="font-semibold mb-2">All Users</h3>
      {loading ? <div>Loading...</div> : (
        <table className="w-full text-left border">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2">Name</th>
              <th className="p-2">Email</th>
              <th className="p-2">Role</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u._id} className="border-t">
                <td className="p-2">{u.name}</td>
                <td className="p-2">{u.email}</td>
                <td className="p-2">{u.role}</td>
                <td className="p-2 flex gap-2">
                  <button className="text-blue-600 underline" onClick={() => handleEdit(u)}>Edit</button>
                  <button className="text-red-600 underline" onClick={() => handleDelete(u._id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default UserManagement;
