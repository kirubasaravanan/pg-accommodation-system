import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Use the same API base URL as the rest of the app
const API_BASE_URL = 'http://localhost:5000';

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
  joiningDate: '', // Added joiningDate
};

const RegistrationForm = () => {
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showRoomSelect, setShowRoomSelect] = useState(false);
  const [availableRooms, setAvailableRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState('');
  const [checking, setChecking] = useState(false);
  const [pendingRoomSelectionDetails, setPendingRoomSelectionDetails] = useState(null); // { tenantId, roomType }
  const [alternativeRoomTypes, setAlternativeRoomTypes] = useState([]);
  const [selectedAlternativeRoomType, setSelectedAlternativeRoomType] = useState('');
  const [showAlternativeRoomTypes, setShowAlternativeRoomTypes] = useState(false);

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
    setSuccess('');
  };

  const validate = async () => {
    if (!form.name || !form.phone || !form.aadhaar || !form.email || !form.stayType || !form.roomType || !form.joiningDate) { // Added form.joiningDate
      setError('All fields are required.');
      return false;
    }
    if (!/^[0-9]{10}$/.test(form.phone)) {
      setError('Phone number must be 10 digits.');
      return false;
    }
    if (!/^[0-9]{12}$/.test(form.aadhaar)) {
      setError('Aadhaar number must be 12 digits.');
      return false;
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) {
      setError('Invalid email address.');
      return false;
    }
    return true;
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setPendingRoomSelectionDetails(null); 
    setShowRoomSelect(false); // Ensure room select is hidden
    setAvailableRooms([]); // Clear previous available rooms
    setShowAlternativeRoomTypes(false); // Ensure alternatives are hidden
    setAlternativeRoomTypes([]); // Clear previous alternatives
    setSelectedAlternativeRoomType(''); // Clear selected alternative
    if (!(await validate())) return;
    setChecking(true);
    try {
      const payload = {
        name: form.name,
        contact: form.phone,
        aadhaar: form.aadhaar,
        email: form.email,
        accommodationType: form.stayType,
        roomType: form.roomType,
        joiningDate: form.joiningDate || new Date().toISOString().slice(0, 10),
      };
      const res = await axios.post(`${API_BASE_URL}/api/tenants/register`, payload);
      const newTenantId = res.data?.data?.tenantId;
      if (!newTenantId) {
        setError('Registration failed: No tenant ID returned. Please contact admin.');
        setChecking(false);
        return;
      }
      setPendingRoomSelectionDetails({ tenantId: newTenantId, roomType: form.roomType });
      setSuccess('Tenant registered successfully! Click below to check room availability.');
    } catch (err) {
      const backendMsg = err.response?.data?.message || err.response?.data?.error || err.response?.data?.status || err.message;
      setError(backendMsg || 'Registration failed.');
    }
    setChecking(false);
  };

  const fetchAlternativeRoomTypes = async () => {
    setChecking(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/api/rooms/available-types`);
      if (res.data && res.data.data && res.data.data.length > 0) {
        setAlternativeRoomTypes(res.data.data);
        setShowAlternativeRoomTypes(true);
        setError('No rooms for your preferred type. Please select an alternative or contact admin.'); // Keep this error or modify
      } else {
        setAlternativeRoomTypes([]);
        setShowAlternativeRoomTypes(false);
        setError('No rooms available for the selected type, and no alternative types found. Please contact admin.');
      }
    } catch (err) {
      const backendMsg = err.response?.data?.message || err.response?.data?.error || 'Failed to fetch alternative room types.';
      setError(backendMsg);
      setShowAlternativeRoomTypes(false);
    }
    setChecking(false);
  };

  const handleCheckAndSelectRoom = async (roomTypeToCheck) => {
    const typeToUse = roomTypeToCheck || pendingRoomSelectionDetails?.roomType;
    if (!typeToUse) {
      setError('Cannot check room availability. Room type not specified.');
      return;
    }
    setError('');
    setSuccess('');
    setChecking(true);
    setShowRoomSelect(false); // Hide current room selection if any
    setAvailableRooms([]); // Clear previous rooms

    try {
      console.log(`Checking availability for type: ${typeToUse}`);
      const roomsRes = await axios.get(`${API_BASE_URL}/api/rooms/available?type=${typeToUse}`);
      if (roomsRes.data && roomsRes.data.data && roomsRes.data.data.length > 0) {
        setAvailableRooms(roomsRes.data.data);
        setShowRoomSelect(true);
        setShowAlternativeRoomTypes(false); // Hide alternatives if shown
        // Update pendingRoomSelectionDetails.roomType if an alternative was chosen and successful
        if (roomTypeToCheck && pendingRoomSelectionDetails) {
            setPendingRoomSelectionDetails(prev => ({ ...prev, roomType: roomTypeToCheck }));
        }
      } else {
        setAvailableRooms([]);
        setShowRoomSelect(false);
        // If the initial check failed, fetch alternatives
        if (!roomTypeToCheck) { // Only fetch alternatives if it was the primary check
            await fetchAlternativeRoomTypes();
        } else {
            // This means an alternative type check also yielded no rooms
            setError(`No rooms available for type "${typeToUse}". Please select another alternative or contact admin.`);
            setShowAlternativeRoomTypes(true); // Keep alternatives visible
        }
      }
    } catch (err) {
      const backendMsg = err.response?.data?.message || err.response?.data?.error || err.response?.data?.status || err.message;
      setError(backendMsg || 'Failed to fetch available rooms.');
      setShowRoomSelect(false);
    }
    setChecking(false);
  };

  const handleAlternativeRoomTypeCheck = () => {
    if (!selectedAlternativeRoomType) {
      setError("Please select an alternative room type to check.");
      return;
    }
    handleCheckAndSelectRoom(selectedAlternativeRoomType);
  };

  const handleAllocateRoom = async () => {
    setError('');
    setSuccess('');
    if (!selectedRoom) {
      setError('Please select a room number.');
      return;
    }
    if (!pendingRoomSelectionDetails || !pendingRoomSelectionDetails.tenantId) {
        setError('Tenant ID not found for allocation. Please try registering again.');
        return;
    }
    if (!pendingRoomSelectionDetails.roomType) {
        setError('Room type not confirmed for allocation. Please select a room type and check availability again.');
        return;
    }

    try {
      const roomDetails = availableRooms.find(r => r.name === selectedRoom);
      if (!roomDetails) {
        setError('Selected room details not found. Please try again.');
        return;
      }

      const payload = {
        tenantId: pendingRoomSelectionDetails.tenantId,
        roomNumber: selectedRoom, // This should be the room's unique identifier, often _id or a specific room number field
        // Assuming 'name' is the unique room number/identifier shown to the user
        roomId: roomDetails._id, // Pass the actual room ID for backend processing
        startDate: form.joiningDate || new Date().toISOString().slice(0, 10),
        rent: roomDetails.price,
        roomType: pendingRoomSelectionDetails.roomType, // Ensure this is the final selected room type
      };

      // Log the payload to be sent to allocate-room
      console.log("Allocating room with payload:", payload);

      const res = await axios.post(`${API_BASE_URL}/api/tenants/allocate-room`, payload);
      setSuccess('Room allocated successfully!');
      setShowRoomSelect(false);
      setShowAlternativeRoomTypes(false);
      setForm(initialForm);
      setSelectedRoom('');
      setPendingRoomSelectionDetails(null);
      setAvailableRooms([]);
      setAlternativeRoomTypes([]);
      setSelectedAlternativeRoomType('');
    } catch (err) {
      const backendMsg = err.response?.data?.message || err.response?.data?.error || 'Room allocation failed.';
      console.error("Allocation error:", err.response || err);
      setError(backendMsg);
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
        
        {!showRoomSelect && !showAlternativeRoomTypes && (
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
              <input name="email" type="email" value={form.email} onChange={handleChange} style={{ width: '100%', padding: 10, borderRadius: 8, border: '1.5px solid #dbe6f6', marginTop: 6, fontSize: 16 }} />
            </label>
            <label style={{ fontWeight: 600, color: '#466fa6' }}>Joining Date
              <input name="joiningDate" type="date" value={form.joiningDate} onChange={handleChange} style={{ width: '100%', padding: 10, borderRadius: 8, border: '1.5px solid #dbe6f6', marginTop: 6, fontSize: 16 }} />
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
            <button type="submit" disabled={checking || pendingRoomSelectionDetails} style={{ background: '#466fa6', color: '#fff', border: 'none', borderRadius: 8, padding: '12px 0', fontWeight: 700, fontSize: 18, marginTop: 8, cursor: 'pointer', boxShadow: '0 2px 8px rgba(70,111,166,0.08)' }}>
              {checking ? 'Registering...' : 'Register'}
            </button>
            {pendingRoomSelectionDetails && (
              <button type="button" onClick={() => handleCheckAndSelectRoom()} disabled={checking} style={{ background: '#4CAF50', color: 'white', border: 'none', borderRadius: 8, padding: '12px 0', fontWeight: 700, fontSize: 18, marginTop: 8, cursor: 'pointer' }}>
                {checking ? 'Checking...' : 'Check Room Availability & Select'}
              </button>
            )}
          </form>
        )}

        {showAlternativeRoomTypes && !showRoomSelect && (
          <div style={{ marginTop: 24 }}>
            <h3 style={{ color: '#466fa6', fontWeight: 700, marginBottom: 12 }}>Select an Alternative Room Type</h3>
            <div style={{ marginBottom: 16, display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {alternativeRoomTypes.map(type => (
                <label key={type} style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                  <input 
                    type="radio" 
                    name="alternativeRoomType" 
                    value={type} 
                    checked={selectedAlternativeRoomType === type}
                    onChange={e => setSelectedAlternativeRoomType(e.target.value)}
                    style={{ marginRight: '8px' }}
                  /> 
                  {ROOM_TYPES.find(rt => rt.value === type)?.label || type} {/* Display label if available */}
                </label>
              ))}
            </div>
            <button onClick={handleAlternativeRoomTypeCheck} disabled={checking || !selectedAlternativeRoomType} style={{ background: '#ff9800', color: 'white', border: 'none', borderRadius: 8, padding: '10px 24px', fontWeight: 700, fontSize: 16, cursor: 'pointer', width: '100%' }}>
              {checking ? 'Checking Alternative...' : 'Check Availability for Selected Alternative'}
            </button>
             <button onClick={() => { setShowAlternativeRoomTypes(false); setError(''); /* Optionally reset form or pending details */ }} style={{ background: '#eee', color: '#333', border: 'none', borderRadius: 8, padding: '10px 24px', fontWeight: 600, fontSize: 16, cursor: 'pointer', marginTop: '10px', width: '100%' }}>
              Cancel / Modify Registration Details
            </button>
          </div>
        )}

        {showRoomSelect && (
          <div style={{ marginTop: 24 }}>
            <h3 style={{ color: '#466fa6', fontWeight: 700, marginBottom: 12 }}>Select a Room for {pendingRoomSelectionDetails?.roomType}</h3>
            {/* Error display for room selection part is already handled by the global error display */}
            <select value={selectedRoom} onChange={e => setSelectedRoom(e.target.value)} style={{ width: '100%', padding: 10, borderRadius: 8, border: '1.5px solid #dbe6f6', fontSize: 16, marginBottom: 16 }}>
              <option value="">Select room number</option>
              {availableRooms.map(room => (
                <option key={room._id} value={room.name}>{room.name} ({room.location || 'N/A'}) - ₹{room.price} [{room.occupancy.max - room.occupancy.current} vacant]</option>
              ))}
            </select>
            <button onClick={handleAllocateRoom} disabled={checking || !selectedRoom} style={{ background: '#43a047', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 24px', fontWeight: 700, fontSize: 16, cursor: 'pointer', marginRight: 12 }}>
                {checking ? 'Allocating...' : 'Allocate Room'}
            </button>
            <button onClick={() => { 
                setShowRoomSelect(false); 
                setAvailableRooms([]); 
                setSelectedRoom('');
                setError(''); 
                setSuccess(''); 
                // Decide if we go back to alternative types or full form reset
                // For now, go back to showing the "Check Room Availability & Select" button for the original type
                // or allow re-check of alternatives if they were previously shown.
                // If pendingRoomSelectionDetails still exists, they can try checking original type again.
                // If they want to change original type, they need to cancel further up.
                if (alternativeRoomTypes.length > 0) {
                  setShowAlternativeRoomTypes(true); 
                } else if (pendingRoomSelectionDetails) {
                  // If no alternatives were ever fetched, but we have pending details, allow to re-check original type.
                  // This state implies the original type check might have succeeded before, or user cancelled from room list.
                  // No specific action needed here to show the button, as it's tied to pendingRoomSelectionDetails
                } else {
                  // Full reset or back to registration form if no pending details and no alternatives
                  setForm(initialForm); // Example: reset form
                }
            }} style={{ background: '#eee', color: '#333', border: 'none', borderRadius: 8, padding: '10px 24px', fontWeight: 600, fontSize: 16, cursor: 'pointer' }}>
                Cancel Selection
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default RegistrationForm;
