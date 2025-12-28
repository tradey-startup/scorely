/**
 * AuthContext - Authentication & Authorization State Management
 *
 * Manages user authentication state, role, and permissions
 */

import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState({
    isAuthenticated: false,
    role: null,
    token: null,
    permissions: null
  });
  const [loading, setLoading] = useState(true);

  // Load auth from localStorage on mount
  useEffect(() => {
    const loadAuth = async () => {
      const token = localStorage.getItem('auth_token');
      const role = localStorage.getItem('auth_role');
      const permissionsStr = localStorage.getItem('auth_permissions');

      if (token && role) {
        // Verify token is still valid
        try {
          const response = await fetch(`${API_BASE_URL}/auth/verify`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          const data = await response.json();

          if (data.success && data.valid) {
            setAuth({
              isAuthenticated: true,
              role: role,
              token: token,
              permissions: permissionsStr ? JSON.parse(permissionsStr) : data.permissions
            });
          } else {
            // Token invalid, clear storage
            clearAuth();
          }
        } catch (error) {
          console.error('Failed to verify token:', error);
          clearAuth();
        }
      }

      setLoading(false);
    };

    loadAuth();
  }, []);

  const login = (authData) => {
    setAuth({
      isAuthenticated: true,
      role: authData.role,
      token: authData.token,
      permissions: authData.permissions
    });

    // Persist to localStorage
    localStorage.setItem('auth_token', authData.token);
    localStorage.setItem('auth_role', authData.role);
    localStorage.setItem('auth_permissions', JSON.stringify(authData.permissions));
  };

  const logout = () => {
    clearAuth();
    setAuth({
      isAuthenticated: false,
      role: null,
      token: null,
      permissions: null
    });
  };

  const clearAuth = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_role');
    localStorage.removeItem('auth_permissions');
  };

  const hasPermission = (permission) => {
    return auth.permissions?.[permission] || false;
  };

  const getAuthHeader = () => {
    return auth.token ? { 'Authorization': `Bearer ${auth.token}` } : {};
  };

  return (
    <AuthContext.Provider
      value={{
        auth,
        loading,
        login,
        logout,
        hasPermission,
        getAuthHeader
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
