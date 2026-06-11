/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminLoginApi, adminVerifyApi } from '../api';

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
  const [isServerWaking, setIsServerWaking] = useState(false);
  const [connectionError, setConnectionError] = useState(null);

  const handleLogout = useCallback((redirectToLogin = true) => {
    console.log('[admin-context] Clearing admin session.');
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminInfo');
    setToken(null);
    setAdmin(null);
    setError(null);
    setConnectionError(null);
    setIsServerWaking(false);
    if (redirectToLogin) {
      navigate('/admin/login', { replace: true });
    }
  }, [navigate]);

  function saveSession(sessionToken, adminInfo) {
    localStorage.setItem('adminToken', sessionToken);
    localStorage.setItem('adminInfo', JSON.stringify(adminInfo));
    setToken(sessionToken);
    setAdmin(adminInfo);
  }

  const verify = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setConnectionError(null);
    setIsServerWaking(false);

    try {
      console.log('[admin-context] Launching session verification...');
      const data = await adminVerifyApi({
        timeout: 45000, // 45s for verification to handle container cold start
        onSlow: () => {
          console.warn('[admin-context] Verify request taking longer than 3s. Server waking triggered.');
          setIsServerWaking(true);
        }
      });

      console.log('[admin-context] Session verification success.');
      
      // If a rolling token was issued by the backend, save it
      if (data?.token) {
        saveSession(data.token, data.admin || admin);
      } else {
        setAdmin(data?.admin || null);
      }
      setConnectionError(null);
    } catch (err) {
      console.error('[admin-context] Verify session error:', err);
      
      // Only log out if it is an explicit 401 or 403 authorization refusal.
      if (err.status === 401 || err.status === 403) {
        console.warn('[admin-context] Unauthorized session detected. Redirecting to login.');
        handleLogout(false);
      } else {
        // Network timeout (408), 502/503/504 server offline, or other network errors.
        // We preserve the token to avoid kicking the user out over a transient network glitch.
        setConnectionError(err.message || 'Server is temporarily unavailable. Please verify your connection.');
      }
    } finally {
      setLoading(false);
      setIsServerWaking(false);
    }
  }, [token, admin, handleLogout]);

  useEffect(() => {
    // Auto-login bypass for local development: if no token and running on localhost,
    // create a dummy admin session so the admin portal opens without prompting.
    if (!token && typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
      const dummy = { id: 'local-admin', name: 'Admin', email: 'admin@local' };
      saveSession('local-dev-token', dummy);
      setLoading(false);
      return;
    }

    Promise.resolve().then(() => {
      verify();
    });
  }, [verify, token]);

  const login = useCallback(async (email, password) => {
    setLoading(true);
    setError(null);
    setConnectionError(null);
    setIsServerWaking(false);

    try {
      console.log('[admin-context] Submitting login request for:', email);
      const data = await adminLoginApi(email, password, {
        timeout: 45000, // 45s for login in case backend is cold starting
        onSlow: () => {
          console.warn('[admin-context] Login taking longer than 3s. Server waking triggered.');
          setIsServerWaking(true);
        }
      });

      console.log('[admin-context] Login request success.');
      saveSession(data.token, data.admin);
      navigate('/admin/dashboard', { replace: true });
      return data.admin;
    } catch (err) {
      console.error('[admin-context] Login request failed:', err);
      setError(err.message || 'Unable to sign in. Please verify your credentials or server status.');
      setLoading(false);
      throw err;
    } finally {
      setIsServerWaking(false);
    }
  }, [navigate]);

  const value = useMemo(
    () => ({ 
      admin, 
      token, 
      loading, 
      error, 
      isServerWaking, 
      connectionError, 
      login, 
      logout: handleLogout,
      verify
    }),
    [admin, token, loading, error, isServerWaking, connectionError, login, handleLogout, verify]
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
