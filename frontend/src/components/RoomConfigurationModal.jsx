import React, { useEffect, useState } from 'react';
import { fetchRooms } from '../api';

const RoomConfigurationModal = ({ onClose }) => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    fetchRooms()
      .then(res => {
        setRooms(res.data);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load rooms.');
        setLoading(false);
      });
  }, []);

  // Updated modal background color to match the Admin Dashboard sidebar
  const modalStyle = {
    backgroundColor: '#6C8EBF', // Sidebar blue color
    color: 'white',
    padding: '20px',
    borderRadius: '8px',
  };

  return (
    <div style={{ minWidth: 360 }}>
      {/* Updated modal close icon style for better visibility */}
      <button
        onClick={onClose}
        style={{
          background: 'none',
          border: 'none',
          color: '#FFFFFF', // Darker white for better contrast
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
      <h2 className="text-xl font-bold mb-4">Room Configuration</h2>
      {loading ? (
        <div>Loading rooms...</div>
      ) : error ? (
        <div className="text-red-600">{error}</div>
      ) : (
        <table className="w-full text-left border">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2">Name</th>
              <th className="p-2">Type</th>
              <th className="p-2">Location</th>
              <th className="p-2">Price</th>
              <th className="p-2">Max Occ.</th>
              <th className="p-2">Current Occ.</th>
            </tr>
          </thead>
          <tbody>
            {rooms.map(room => (
              <tr key={room._id} className="border-t">
                <td className="p-2">{room.name}</td>
                <td className="p-2">{room.type}</td>
                <td className="p-2">{room.location}</td>
                <td className="p-2">{room.price}</td>
                <td className="p-2">{room.occupancy?.max}</td>
                <td className="p-2">{room.occupancy?.current}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default RoomConfigurationModal;
