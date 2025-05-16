// TariffDetails.js - Shows all room types and their prices, with add new type functionality
import React, { useState } from 'react';

const DEFAULT_TARIFFS = [
  { type: 'Private Mini', price: 7500 },
  { type: 'Private', price: 8500 },
  { type: 'Double Occupancy', price: 5800 },
  { type: 'Triple Occupancy', price: 4800 },
  { type: 'Four Occupancy', price: 4000 },
  { type: 'Five Occupancy', price: 3800 },
];

const TariffDetails = () => {
  const [tariffs, setTariffs] = useState(DEFAULT_TARIFFS);
  const [showAdd, setShowAdd] = useState(false);
  const [newType, setNewType] = useState('');
  const [newPrice, setNewPrice] = useState('');

  const handleAdd = () => {
    if (!newType || !newPrice) return;
    setTariffs([...tariffs, { type: newType, price: Number(newPrice) }]);
    setNewType('');
    setNewPrice('');
    setShowAdd(false);
  };

  return (
    <div style={{ padding: 32, maxWidth: 500, margin: '0 auto' }}>
      <h2>Room Tariff Details</h2>
      <table className="room-table" style={{ marginBottom: 24 }}>
        <thead>
          <tr>
            <th>Room Type</th>
            <th>Price (₹/month)</th>
          </tr>
        </thead>
        <tbody>
          {tariffs.map((t, idx) => (
            <tr key={idx}>
              <td>{t.type}</td>
              <td>₹{t.price}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {showAdd ? (
        <div style={{ marginBottom: 16 }}>
          <input placeholder="Room Type" value={newType} onChange={e => setNewType(e.target.value)} style={{ marginRight: 8 }} />
          <input placeholder="Price" type="number" value={newPrice} onChange={e => setNewPrice(e.target.value)} style={{ marginRight: 8 }} />
          <button onClick={handleAdd}>Add</button>
          <button onClick={() => setShowAdd(false)} style={{ marginLeft: 8 }}>Cancel</button>
        </div>
      ) : (
        <button onClick={() => setShowAdd(true)}>Add New Room Type</button>
      )}
    </div>
  );
};

export default TariffDetails;
