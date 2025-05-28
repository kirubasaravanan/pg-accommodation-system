import React, { createContext, useState, useEffect, useContext } from 'react';

// UserContext provides user info (role, name, etc) to the app
export const UserContext = createContext({ user: null, setUser: () => {}, loading: true });

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Try to load user from localStorage or API (customize as needed)
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');

    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else if (token) {
      console.log("UserProvider: Token found, user data not in localStorage. User needs to be fetched or will be handled by API.");
    }
    setLoading(false);
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
