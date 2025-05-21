import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { login } from './api';
import AdminDashboard from './pages/AdminDashboard';
import RentDetails from './pages/RentDetails';
import TariffDetails from './pages/TariffDetails';
import Reports from './pages/Reports';
import Dashboard from './pages/Dashboard';
import './App.css';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import RegistrationForm from './components/RegistrationForm';
import Login from './components/Login';
import { UserProvider } from './context/UserContext';
import ComingSoon from './pages/ComingSoon';
import UserManagement from './pages/UserManagement';

function App() {
  const [token, setToken] = useState(() => localStorage.getItem('token'));

  const handleLogin = () => {
    setToken(localStorage.getItem('token'));
  };

  const handleLogout = () => {
    setToken(null);
    localStorage.removeItem('token');
  };

  return (
    <UserProvider>
      <Router>
        <Routes>
          <Route
            path="/"
            element={
              token ? <Navigate to="/dashboard" /> : <Login onLogin={handleLogin} />
            }
          />
          <Route
            path="/dashboard"
            element={
              token ? <Dashboard onLogout={handleLogout} /> : <Navigate to="/" />
            }
          />
          {/* Add routes for each admin module */}
          <Route path="/settings/admin-console/users" element={<UserManagement />} />
          <Route path="/settings/admin-console/rooms" element={<ComingSoon title="Room Configuration" />} />
          <Route path="/settings/admin-console/rent-setup" element={<ComingSoon title="Rent Setup" />} />
          <Route path="/settings/admin-console/discounts" element={<ComingSoon title="Discounts & Offers" />} />
          <Route path="/settings/admin-console/roles" element={<ComingSoon title="Permissions/Roles Setup" />} />
          <Route path="/settings/admin-console/policies" element={<ComingSoon title="Policy & Notice Board" />} />
          <Route path="/settings/admin-console/integrations" element={<ComingSoon title="Integrations Setup" />} />
          <Route path="/settings/admin-console/backup" element={<ComingSoon title="Backup & Restore" />} />
        </Routes>
      </Router>
    </UserProvider>
  );
}

export default App;