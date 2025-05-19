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
      </Routes>
    </Router>
  );
}

export default App;