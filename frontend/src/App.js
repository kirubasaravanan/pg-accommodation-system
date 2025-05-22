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
import MainLayout from './components/MainLayout';
import NewAdminDashboard from './pages/NewAdminDashboard';

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
          {/* Public routes */}
          <Route
            path="/"
            element={
              token ? <Navigate to="/dashboard" /> : <Login onLogin={handleLogin} />
            }
          />
          <Route path="/register" element={<RegistrationForm />} />

          {/* Protected routes under MainLayout */}
          <Route
            path="/dashboard"
            element={
              token ? (
                <MainLayout>
                  <AdminDashboard onLogout={handleLogout} />
                </MainLayout>
              ) : (
                <Navigate to="/" />
              )
            }
          />
          <Route
            path="/new-dashboard"
            element={
              token ? (
                <NewAdminDashboard />
              ) : (
                <Navigate to="/" />
              )
            }
          />
          <Route
            path="/tariff-details"
            element={
              token ? (
                <MainLayout>
                  <TariffDetails />
                </MainLayout>
              ) : (
                <Navigate to="/" />
              )
            }
          />
          <Route
            path="/reports"
            element={
              token ? (
                <MainLayout>
                  <Reports />
                </MainLayout>
              ) : (
                <Navigate to="/" />
              )
            }
          />
          <Route
            path="/rent-details"
            element={
              token ? (
                <MainLayout>
                  <RentDetails />
                </MainLayout>
              ) : (
                <Navigate to="/" />
              )
            }
          />
          {/* Settings routes */}
          <Route
            path="/settings/admin-console/users"
            element={
              token ? (
                <MainLayout>
                  <UserManagement />
                </MainLayout>
              ) : (
                <Navigate to="/" />
              )
            }
          />
          <Route
            path="/settings/admin-console/rooms"
            element={
              token ? (
                <MainLayout>
                  <ComingSoon title="Room Configuration" />
                </MainLayout>
              ) : (
                <Navigate to="/" />
              )
            }
          />
          <Route
            path="/settings/admin-console/rent-setup"
            element={
              token ? (
                <MainLayout>
                  <ComingSoon title="Rent Setup" />
                </MainLayout>
              ) : (
                <Navigate to="/" />
              )
            }
          />
          <Route
            path="/settings/admin-console/discounts"
            element={
              token ? (
                <MainLayout>
                  <ComingSoon title="Discounts & Offers" />
                </MainLayout>
              ) : (
                <Navigate to="/" />
              )
            }
          />
          <Route
            path="/settings/admin-console/roles"
            element={
              token ? (
                <MainLayout>
                  <ComingSoon title="Permissions/Roles Setup" />
                </MainLayout>
              ) : (
                <Navigate to="/" />
              )
            }
          />
          <Route
            path="/settings/admin-console/policies"
            element={
              token ? (
                <MainLayout>
                  <ComingSoon title="Policy & Notice Board" />
                </MainLayout>
              ) : (
                <Navigate to="/" />
              )
            }
          />
          <Route
            path="/settings/admin-console/integrations"
            element={
              token ? (
                <MainLayout>
                  <ComingSoon title="Integrations Setup" />
                </MainLayout>
              ) : (
                <Navigate to="/" />
              )
            }
          />
          <Route
            path="/settings/admin-console/backup"
            element={
              token ? (
                <MainLayout>
                  <ComingSoon title="Backup & Restore" />
                </MainLayout>
              ) : (
                <Navigate to="/" />
              )
            }
          />
        </Routes>
      </Router>
    </UserProvider>
  );
}

export default App;