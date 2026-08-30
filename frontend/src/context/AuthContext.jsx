import {
  createContext, useContext, useEffect, useState,
} from 'react';
import apiClient from '../services/apiClient';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }
    apiClient
      .get('/api/auth/me')
      .then((res) => setUser(res.data.user))
      .catch(() => localStorage.removeItem('token'))
      .finally(() => setLoading(false));
  }, []);

  async function loginDev(email, password) {
    const { data } = await apiClient.post('/api/auth/login/dev', { email, password });
    localStorage.setItem('token', data.token);
    setUser(data.user);
  }

  async function loginWithAd(adIdToken) {
    const { data } = await apiClient.post('/api/auth/login/ad', { adToken: adIdToken });
    localStorage.setItem('token', data.token);
    setUser(data.user);
  }

  function logout() {
    localStorage.removeItem('token');
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{
      user, loading, loginDev, loginWithAd, logout,
    }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
