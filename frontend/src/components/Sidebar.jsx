import React from 'react';
import { NavLink } from 'react-router-dom';
import './Sidebar.css';

const Sidebar = () => (
  <nav className="main-sidebar">
    <ul>
      <li><NavLink to="/dashboard" activeClassName="active">Dashboard</NavLink></li>
      <li><NavLink to="/settings/admin-console/users" activeClassName="active">User Management</NavLink></li>
      <li><NavLink to="/settings/admin-console/rooms" activeClassName="active">Rooms</NavLink></li>
      <li><NavLink to="/rent-details" activeClassName="active">Rent & Security</NavLink></li>
      {/* Add more links as needed */}
    </ul>
  </nav>
);

export default Sidebar;
