import React, { useState } from 'react';
import axios from 'axios';

// Use the same API base URL as the rest of the app
const API_BASE_URL = 'http://192.168.x.x:5000';

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
      const res = await axios.get(`${API_BASE_URL}/api/rooms?type=${form.roomType}`);
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
      await axios.post(`${API_BASE_URL}/api/tenants/register`, {
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
    <>
      <style>{`
        @media (max-width: 600px) {
          .registration-card {
            padding: 16px !important;
            border-radius: 10px !important;
            box-shadow: 0 2px 8px rgba(70,111,166,0.08) !important;
          }
          .registration-card h2 {
            font-size: 1.3rem !important;
          }
          .registration-card input,
          .registration-card select {
            font-size: 15px !important;
            padding: 8px !important;
          }
          .registration-card button {
            font-size: 15px !important;
            padding: 10px 0 !important;
          }
        }
      `}</style>
      <div className="registration-card" style={{ background: '#fff', borderRadius: 16, boxShadow: '0 4px 24px rgba(70,111,166,0.08)', padding: 32, maxWidth: 420, width: '100%', margin: '0 auto', fontFamily: 'Inter, Arial, sans-serif' }}>
        <h2 style={{ textAlign: 'center', color: '#466fa6', fontWeight: 700, marginBottom: 24 }}>New Tenant Registration</h2>
        {error && <div style={{ color: '#e53935', background: '#fff3f3', borderRadius: 8, padding: '8px 16px', marginBottom: 16, fontWeight: 600 }}>{error}</div>}
        {success && <div style={{ color: '#43a047', background: '#e8f5e9', borderRadius: 8, padding: '8px 16px', marginBottom: 16, fontWeight: 600 }}>{success}</div>}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <label style={{ fontWeight: 600, color: '#466fa6' }}>Full Name
            <input name="name" value={form.name} onChange={handleChange} style={{ width: '100%', padding: 10, borderRadius: 8, border: '1.5px solid #dbe6f6', marginTop: 6, fontSize: 16 }} />
          </label>
          <label style={{ fontWeight: 600, color: '#466fa6' }}>Phone Number
            <input name="phone" value={form.phone} onChange={handleChange} style={{ width: '100%', padding: 10, borderRadius: 8, border: '1.5px solid #dbe6f6', marginTop: 6, fontSize: 16 }} />
          </label>
          <label style={{ fontWeight: 600, color: '#466fa6' }}>Aadhaar Number
            <input name="aadhaar" value={form.aadhaar} onChange={handleChange} style={{ width: '100%', padding: 10, borderRadius: 8, border: '1.5px solid #dbe6f6', marginTop: 6, fontSize: 16 }} />
          </label>
          <label style={{ fontWeight: 600, color: '#466fa6' }}>Email
            <input name="email" value={form.email} onChange={handleChange} style={{ width: '100%', padding: 10, borderRadius: 8, border: '1.5px solid #dbe6f6', marginTop: 6, fontSize: 16 }} />
          </label>
          <label style={{ fontWeight: 600, color: '#466fa6' }}>Stay Type
            <select name="stayType" value={form.stayType} onChange={handleChange} style={{ width: '100%', padding: 10, borderRadius: 8, border: '1.5px solid #dbe6f6', marginTop: 6, fontSize: 16 }}>
              <option value="">Select stay type</option>
              {STAY_TYPES.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </label>
          <label style={{ fontWeight: 600, color: '#466fa6' }}>Room Type
            <select name="roomType" value={form.roomType} onChange={handleChange} style={{ width: '100%', padding: 10, borderRadius: 8, border: '1.5px solid #dbe6f6', marginTop: 6, fontSize: 16 }}>
              <option value="">Select room type</option>
              {ROOM_TYPES.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </label>
          <button type="submit" disabled={checking} style={{ background: '#466fa6', color: '#fff', border: 'none', borderRadius: 8, padding: '12px 0', fontWeight: 700, fontSize: 18, marginTop: 8, cursor: 'pointer', boxShadow: '0 2px 8px rgba(70,111,166,0.08)' }}>
            {checking ? 'Checking...' : 'Register'}
          </button>
        </form>
        {showConfirm && roomAvailable && (
          <div style={{ marginTop: 24, background: '#e8f5e9', borderRadius: 8, padding: 16, color: '#388e3c', fontWeight: 600, textAlign: 'center' }}>
            Room available! Confirm registration?
            <div style={{ marginTop: 12, display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button onClick={handleConfirm} style={{ background: '#43a047', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 24px', fontWeight: 700, fontSize: 16, cursor: 'pointer' }}>Confirm</button>
              <button onClick={() => setShowConfirm(false)} style={{ background: '#eee', color: '#333', border: 'none', borderRadius: 8, padding: '8px 24px', fontWeight: 600, fontSize: 16, cursor: 'pointer' }}>Cancel</button>
            </div>
          </div>
        )}
        {showConfirm && !roomAvailable && (
          <div style={{ marginTop: 24, background: '#fff3f3', borderRadius: 8, padding: 16, color: '#e53935', fontWeight: 600, textAlign: 'center' }}>
            Sorry, no rooms of the selected type are available.
            <div style={{ marginTop: 12 }}>
              <button onClick={() => setShowConfirm(false)} style={{ background: '#eee', color: '#333', border: 'none', borderRadius: 8, padding: '8px 24px', fontWeight: 600, fontSize: 16, cursor: 'pointer' }}>Close</button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default RegistrationForm;
