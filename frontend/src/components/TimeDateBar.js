import React, { useEffect, useState } from 'react';

const TimeDateBar = () => {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const dateStr = now.toLocaleDateString();
  const timeStr = now.toLocaleTimeString();

  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', padding: '8px 0 24px 0', fontSize: 18, color: '#466fa6', fontWeight: 600 }}>
      <span style={{ marginRight: 24 }}>{dateStr}</span>
      <span>{timeStr}</span>
    </div>
  );
};

export default TimeDateBar;
