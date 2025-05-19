import React from 'react';

const SummaryCard = ({ label, value, color }) => (
  <div style={{
    background: '#f7faff',
    borderRadius: 16,
    padding: 24,
    border: `2px solid ${color}`,
    minWidth: 180,
    flex: 1,
    marginRight: 16,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  }}>
    <div style={{ fontSize: 16, color: '#7a8ca7', fontWeight: 600 }}>{label}</div>
    <div style={{ fontSize: 32, fontWeight: 700, marginTop: 8, color }}>{value}</div>
  </div>
);

export default SummaryCard;
