import React from 'react';

const SummaryCard = ({ label, value, color }) => {
  console.log('SummaryCard rendered with label:', label, 'value:', value); // Add this log
  return (
    <div style={{
      background: '#f7faff',
      borderRadius: 16,
      padding: 24,
      border: `2px solid ${color || '#ddd'}`, // Ensure color has a fallback
      minWidth: 180,
      flex: 1,
      marginRight: 16, // This might be redundant if using gap in parent
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      boxSizing: 'border-box', // Added for robust layout
    }}>
      <div style={{ fontSize: 16, color: '#7a8ca7', fontWeight: 600, marginBottom: 8 }}>TEST LABEL: {label}</div> {/* Modified for testing */}
      <div style={{ fontSize: 32, fontWeight: 700, color: color || '#333' }}>{value}</div> {/* Ensure color has a fallback */}
    </div>
  );
};

export default SummaryCard;
