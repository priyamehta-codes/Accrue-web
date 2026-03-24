import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { googleLogin, getMe, updateProfile as apiUpdateProfile } from '../api/auth';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('accrue_user')); } catch { return null; }
  });
  const [token, setToken] = useState(() => localStorage.getItem('accrue_token'));
  const [loading, setLoading] = useState(true);

  // Verify stored token on mount
  useEffect(() => {
    if (!token) { setLoading(false); return; }

    // Optimization: If we already have a cached user, we can stop the initial
    // full-screen loader immediately and let the app hydrate.
    // getMe() will still run in background to verify/refresh the session.
    if (user) {
      setLoading(false);
    }

    getMe()
      .then((profile) => {
        setUser(profile);
        localStorage.setItem('accrue_user', JSON.stringify(profile));
      })
      .catch((err) => {
        const status = err?.response?.status ?? err?.status;
        if (status === 401) {
          logout();
        }
      })
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const login = useCallback(async (id_token) => {
    const data = await googleLogin(id_token);
    localStorage.setItem('accrue_token', data.token);
    localStorage.setItem('accrue_user', JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
    return data;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('accrue_token');
    localStorage.removeItem('accrue_user');
    // Clear cached data on logout
    ['accrue_dashboard', 'accrue_accounts', 'accrue_transactions', 'accrue_bills', 'accrue_splits']
      .forEach((k) => localStorage.removeItem(k));
    setToken(null);
    setUser(null);
  }, []);

  const updateUser = useCallback((updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('accrue_user', JSON.stringify(updatedUser));
  }, []);

  return (
    <AuthContext.Provider value={{ 
      user, token, loading, login, logout, updateUser,
      isAuthenticated: !!token 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
