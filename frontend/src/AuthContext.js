import React, { createContext, useEffect, useState, useContext, useCallback } from 'react';
import api from './api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  const setAuthToken = (value) => {
    if (value) {
      api.defaults.headers.common.Authorization = `Bearer ${value}`;
      localStorage.setItem('token', value);
      setToken(value);
    } else {
      delete api.defaults.headers.common.Authorization;
      localStorage.removeItem('token');
      setToken(null);
    }
  };

  const fetchProfile = useCallback(async () => {
    try {
      // Ensure header is set before request
      const savedToken = localStorage.getItem('token');
      if (savedToken) {
        api.defaults.headers.common.Authorization = `Bearer ${savedToken}`;
      }

      const res = await api.get('/user/profile/');
      setUser({ username: res.data.username, role: res.data.role });
      return res.data;
    } catch (err) {
      const status = err?.response?.status;
      // More explicit logs to diagnose stuck login issues
      console.warn('fetchProfile failed', { status });

      setAuthToken(null);
      setUser(null);
      return null;
    }
  }, []);

  useEffect(() => {
    const requestInterceptor = api.interceptors.request.use((config) => {
      const savedToken = localStorage.getItem('token');
      if (savedToken) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${savedToken}`;
      }
      return config;
    });

    const responseInterceptor = api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          setAuthToken(null);
          setUser(null);
        }
        return Promise.reject(error);
      }
    );

    return () => {
      api.interceptors.request.eject(requestInterceptor);
      api.interceptors.response.eject(responseInterceptor);
    };
  }, []);

  useEffect(() => {
    // Avoid race: set header first, then call profile
    if (token) {
      setAuthToken(token);
      fetchProfile().finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token, fetchProfile]);

  const login = async (username, password) => {
    const res = await api.post('/token/', { username, password });
    const access = res.data.access;
    setAuthToken(access);
    const profile = await fetchProfile();
    if (!profile) {
      throw new Error('Impossible de récupérer le profil');
    }
    return profile;
  };

  const logout = () => {
    setAuthToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};