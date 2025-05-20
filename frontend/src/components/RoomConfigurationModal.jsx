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

  return (
    <div style={{ minWidth: 360 }}>
      <button
        onClick={onClose}
        style={{ position: 'absolute', top: 16, right: 16, fontSize: 32, fontWeight: 900, color: '#e53935', background: '#fff', border: '2px solid #e57373', borderRadius: '50%', width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1001, cursor: 'pointer', boxShadow: '0 2px 8px rgba(229,57,53,0.08)' }}
        title="Close (ESC)"
      >
        ×
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
