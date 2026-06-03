/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const AdminAuthContext = createContext(null);

function getStoredToken() {
  return typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
}

function getStoredAdmin() {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem('adminInfo');
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function AdminAuthProvider({ children }) {
  const navigate = useNavigate();
  const [admin, setAdmin] = useState(getStoredAdmin());
  const [token, setToken] = useState(getStoredToken());
  const [loading, setLoading] = useState(Boolean(token));
  const [error, setError] = useState(null);

  const handleLogout = useCallback((redirectToLogin = true) => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminInfo');
    setToken(null);
    setAdmin(null);
    setError(null);
    if (redirectToLogin) {
      navigate('/admin/login', { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    async function verifyToken() {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/admin/verify', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Session expired. Please log in again.');
        }

        const data = await response.json();
        setAdmin(data.admin);
        setError(null);
      } catch (err) {
        console.warn('Admin auth verify failed:', err);
        handleLogout(false);
      } finally {
        setLoading(false);
      }
    }

    verifyToken();
  }, [token, handleLogout]);

  function saveSession(sessionToken, adminInfo) {
    localStorage.setItem('adminToken', sessionToken);
    localStorage.setItem('adminInfo', JSON.stringify(adminInfo));
    setToken(sessionToken);
    setAdmin(adminInfo);
  }

  const login = useCallback(async (email, password) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Unable to sign in.');
      }

      saveSession(data.token, data.admin);
      navigate('/admin/dashboard', { replace: true });
      return data.admin;
    } catch (err) {
      setError(err.message || 'Unable to sign in.');
      setLoading(false);
      throw err;
    }
  }, [navigate]);

  const value = useMemo(
    () => ({ admin, token, loading, error, login, logout: handleLogout }),
    [admin, token, loading, error, login, handleLogout]
  );

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within AdminAuthProvider');
  }
  return context;
}
