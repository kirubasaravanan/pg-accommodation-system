import React from 'react';

const SummaryCard = ({ title, subTitle, value, currency = '₹', color }) => {
  // console.log('SummaryCard rendered with title:', title, 'value:', value);
  return (
    <div style={{
      background: '#ffffff', // White background for the card
      borderRadius: '12px', // Rounded corners
      padding: '20px',
      border: `1px solid ${color || '#e0e0e0'}`, // Border color, default to light gray
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)', // Subtle shadow
      minWidth: 200, // Minimum width
      flex: 1, // Allow cards to grow and share space
      margin: '0 8px', // Margin between cards
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center', // Center content horizontally
      textAlign: 'center', // Center text
      boxSizing: 'border-box',
    }}>
      <div style={{ fontSize: '14px', color: '#555555', fontWeight: 600, marginBottom: '4px' }}>{title}</div>
      {subTitle && <div style={{ fontSize: '12px', color: '#777777', marginBottom: '12px' }}>{subTitle}</div>}
      <div style={{ fontSize: '28px', fontWeight: 700, color: color || '#333333' }}>
        {currency}{value}
      </div>
    </div>
  );
};

export default SummaryCard;
