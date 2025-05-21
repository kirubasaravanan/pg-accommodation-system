import React from 'react';
import './Header.css';

const Header = ({ onLogout }) => (
  <header className="main-header">
    <div className="header-title">PG Accommodation System</div>
    {onLogout && (
      <button className="logout-button" onClick={onLogout}>
        Logout
      </button>
    )}
  </header>
);

export default Header;
