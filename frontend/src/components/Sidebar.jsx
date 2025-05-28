import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import './Sidebar.css';
import { useUser } from '../context/UserContext'; // Corrected path

// Helper to generate a URL-friendly slug
const toSlug = (name) => {
  if (!name) return '#'; // Fallback for undefined or null names
  // For main dashboard items, construct the path under /new-dashboard/
  return `/new-dashboard/${name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`;
};

const Sidebar = ({ menuItems, activeTab, onTabChange }) => {
  const navigate = useNavigate();
  const { setUser } = useUser();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user'); // Also remove user details if stored
    setUser(null); // Clear user context
    navigate('/login'); // Redirect to login page
  };

  return (
    <nav className="main-sidebar">
      <ul>
        {menuItems && menuItems.map((item) => (
          <li key={item.name}>
            <NavLink
              to={toSlug(item.name)} // Use the updated toSlug for correct pathing
              className={activeTab === item.name ? 'active' : ''}
              onClick={() => onTabChange(item.name)}
            >
              {item.icon && <span className="sidebar-icon">{item.icon}</span>} {item.name}
            </NavLink>
          </li>
        ))}
        {/* Logout Button */}
        <li>
          <button onClick={handleLogout} className="sidebar-logout-button">
            <span className="sidebar-icon">{/* Add a logout icon here if you have one */}</span> Logout
          </button>
        </li>
      </ul>
    </nav>
  );
};

export default Sidebar;
