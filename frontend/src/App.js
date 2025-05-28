import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { UserProvider, useUser } from './context/UserContext';
import AdminDashboard from './pages/AdminDashboard';
import RentDetails from './pages/RentDetails';
import TariffDetails from './pages/TariffDetails';
import Reports from './pages/Reports';
import NewAdminDashboard from './pages/NewAdminDashboard';
import './App.css';
import RegistrationForm from './components/RegistrationForm';
import Login from './components/Login';
import ComingSoon from './pages/ComingSoon';
import UserManagement from './pages/UserManagement';
import MainLayout from './components/MainLayout';

// Corrected ProtectedRoute to rely solely on token for initial check,
// UserContext might still be loading or user might not be set immediately.
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  // const { user, loading } = useUser(); // Can be used for role-based access later if needed

  // if (loading) {
  //   return <div>Loading...</div>; 
  // }

  if (!token) { // If no token, redirect to login
    return <Navigate to="/login" replace />;
  }
  return children;
};

// Component to define routes accessible after login, all rendering NewAdminDashboard
// NewAdminDashboard will handle its internal state (activeTab) based on the route.
function AuthenticatedAppRoutes() {
  return (
    <Routes>
      {/* All these routes will render NewAdminDashboard, which will then select the correct tab */}
      <Route path="/new-dashboard" element={<NewAdminDashboard />} >
        <Route index element={<NewAdminDashboard />} /> {/* Default to Dashboard tab */}        
        <Route path="dashboard" element={<NewAdminDashboard />} />
        <Route path="room-booking" element={<NewAdminDashboard />} />
        <Route path="tenants" element={<NewAdminDashboard />} />
        <Route path="rent-payment" element={<NewAdminDashboard />} />
        <Route path="reports" element={<NewAdminDashboard />} />
        <Route path="complaints" element={<NewAdminDashboard />} />
        <Route path="ai-chatbot" element={<NewAdminDashboard />} />
        <Route path="registration" element={<NewAdminDashboard />} />
        <Route path="admin-console" element={<NewAdminDashboard />} />
        <Route path="admin-console/:subPage" element={<NewAdminDashboard />} />
      </Route>
      {/* Fallback for any other authenticated paths not matched above, redirect to new-dashboard */}
      <Route path="*" element={<Navigate to="/new-dashboard/dashboard" replace />} />
    </Routes>
  );
}

function App() {
  // Removed local token state, ProtectedRoute and UserContext will manage auth state visibility
  const { user } = useUser(); // from UserContext, to gate access to AuthenticatedAppRoutes

  // handleLogin and handleLogout can be simplified or removed if UserContext handles this
  // For now, let's assume UserProvider updates context on login/logout

  return (
    <UserProvider> {/* Ensure UserProvider is at the top level */} 
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<RegistrationForm />} /> {/* Assuming this is a public registration if separate from tenant registration */}
          
          {/* All authenticated routes are now handled by ProtectedRoute and AuthenticatedAppRoutes */}
          <Route 
            path="/*" // This will match /new-dashboard and its sub-routes
            element={
              <ProtectedRoute>
                <AuthenticatedAppRoutes />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </UserProvider>
  );
}

export default App;