import React, { useState } from 'react';
import axios from 'axios';

const ROOM_TYPES = [
  { value: 'Private', label: 'Single' },
  { value: 'Double Occupancy', label: 'Shared (2)' },
  { value: 'Triple Occupancy', label: 'Shared (3)' },
  { value: 'Four Occupancy', label: 'Shared (4)' },
  { value: 'Five Occupancy', label: 'Shared (5)' },
  { value: 'Private Mini', label: 'Private Mini' },
];
const STAY_TYPES = [
  { value: 'monthly', label: 'Long-term' },
  { value: 'short-term', label: 'Short-term' },
  { value: 'daily', label: 'Daily' },
];

const initialForm = {
  name: '',
  phone: '',
  aadhaar: '',
  email: '',
  stayType: '',
  roomType: '',
};

const RegistrationForm = () => {
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [roomAvailable, setRoomAvailable] = useState(null);
  const [checking, setChecking] = useState(false);

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
    setSuccess('');
  };

  const validate = () => {
    if (!form.name || !form.phone || !form.aadhaar || !form.email || !form.stayType || !form.roomType) {
      setError('All fields are required.');
      return false;
    }
    if (!/^\d{10}$/.test(form.phone)) {
      setError('Phone number must be 10 digits.');
      return false;
    }
    if (!/^\d{12}$/.test(form.aadhaar)) {
      setError('Aadhaar number must be 12 digits.');
      return false;
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) {
      setError('Invalid email address.');
      return false;
    }
    return true;
  };

  const checkAvailability = async () => {
    setChecking(true);
    setError('');
    setRoomAvailable(null);
    try {
      const res = await axios.get(`/api/rooms?type=${form.roomType}`);
      const available = res.data.find(r => r.occupancy.current < r.occupancy.max);
      setRoomAvailable(available);
      setShowConfirm(true);
    } catch (err) {
      setError('Error checking room availability.');
    }
    setChecking(false);
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!validate()) return;
    await checkAvailability();
  };

  const handleConfirm = async () => {
    setShowConfirm(false);
    setError('');
    setSuccess('');
    try {
      await axios.post('/api/tenants/register', {
        name: form.name,
        contact: form.phone,
        aadhaar: form.aadhaar,
        email: form.email,
        accommodationType: form.stayType === 'daily' ? 'daily' : 'monthly',
        preferredRoomType: form.roomType,
      });
      setSuccess('Registration successful!');
      setForm(initialForm);
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed.');
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: '40px auto', background: '#fff', padding: 24, borderRadius: 8, boxShadow: '0 2px 16px rgba(0,0,0,0.08)' }}>
      <h2>Tenant Registration</h2>
      {error && <div style={{ color: 'red', marginBottom: 10 }}>{error}</div>}
      {success && <div style={{ color: 'green', marginBottom: 10 }}>{success}</div>}
      <form onSubmit={handleSubmit}>
        <input name="name" placeholder="Full Name" value={form.name} onChange={handleChange} style={{ width: '100%', marginBottom: 10 }} />
        <input name="phone" placeholder="Phone Number" value={form.phone} onChange={handleChange} style={{ width: '100%', marginBottom: 10 }} />
        <input name="aadhaar" placeholder="Aadhaar Number" value={form.aadhaar} onChange={handleChange} style={{ width: '100%', marginBottom: 10 }} />
        <input name="email" placeholder="Email ID" value={form.email} onChange={handleChange} style={{ width: '100%', marginBottom: 10 }} />
        <select name="stayType" value={form.stayType} onChange={handleChange} style={{ width: '100%', marginBottom: 10 }}>
          <option value="">Type of Stay</option>
          {STAY_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
        <select name="roomType" value={form.roomType} onChange={handleChange} style={{ width: '100%', marginBottom: 10 }}>
          <option value="">Preferred Room Type</option>
          {ROOM_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
        <button type="submit" style={{ width: '100%', marginTop: 8 }} disabled={checking}>Check Availability & Register</button>
      </form>
      {showConfirm && roomAvailable && (
        <div style={{ marginTop: 20, background: '#e3f2fd', padding: 16, borderRadius: 8 }}>
          <div>Room <b>{roomAvailable.name}</b> is available. Confirm registration?</div>
          <button onClick={handleConfirm} style={{ marginTop: 10, width: '100%' }}>Confirm</button>
        </div>
      )}
      {showConfirm && !roomAvailable && (
        <div style={{ marginTop: 20, color: 'red' }}>No rooms available for selected type.</div>
      )}
    </div>
  );
};

export default RegistrationForm;
