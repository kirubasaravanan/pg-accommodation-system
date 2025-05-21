import React, { createContext, useState, useEffect } from 'react';

// UserContext provides user info (role, name, etc) to the app
export const UserContext = createContext({ user: null, setUser: () => {} });

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Try to load user from localStorage or API (customize as needed)
    const stored = localStorage.getItem('user');
    if (stored) {
      setUser(JSON.parse(stored));
    }
    // Optionally, fetch user from backend here
  }, []);

  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  );
};
