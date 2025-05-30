import React, { createContext, useState, useEffect, useContext } from 'react';
import { apiClientInstance } from '../api'; // Import apiClientInstance

// UserContext provides user info (role, name, etc) to the app
export const UserContext = createContext({ user: null, setUser: () => {}, loading: true });

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const attemptLoadUser = async () => {
      const storedUser = localStorage.getItem('user');
      const token = localStorage.getItem('token');

      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch (error) {
          console.error("UserProvider: Error parsing stored user data", error);
          localStorage.removeItem('user'); // Clear corrupted data
          localStorage.removeItem('token'); // Also clear token as state is inconsistent
        }
      } else if (token) {
        console.log("UserProvider: Token found, attempting to fetch user profile.");
        try {
          // Assuming you have an endpoint like /api/auth/me or similar
          // This endpoint should verify the token and return user details
          const response = await apiClientInstance.get('/api/auth/me'); 
          if (response.data) {
            setUser(response.data);
            localStorage.setItem('user', JSON.stringify(response.data)); // Store user for next time
          } else {
            // If /api/auth/me doesn't return data or token is invalid on backend
            localStorage.removeItem('token');
            localStorage.removeItem('user');
          }
        } catch (error) {
          console.error("UserProvider: Failed to fetch user profile", error);
          // If fetching user fails (e.g., token expired, network error), clear token
          if (error.response && (error.response.status === 401 || error.response.status === 403)) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            // Optionally redirect to login, but api.js interceptor might handle this
          }
        }
      }
      setLoading(false);
    };

    attemptLoadUser();
  }, []);

  return (
    <UserContext.Provider value={{ user, setUser, loading }}>
      {children}
    </UserContext.Provider>
  );
};

// Custom hook to use the UserContext
export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
