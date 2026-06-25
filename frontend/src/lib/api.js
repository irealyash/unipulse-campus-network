import axios from 'axios';

// Where we keep the JWT. Centralized so auth + socket read the same key.
export const TOKEN_KEY = 'unipulse_token';

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (token) => localStorage.setItem(TOKEN_KEY, token);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

/**
 * Shared axios instance. baseURL is "/api" which Vite proxies to the backend in
 * dev (see vite.config.js). Every request automatically carries the JWT.
 */
const api = axios.create({
  baseURL: '/api',
});

// Attach the bearer token (if any) to every outgoing request.
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Normalize errors so components can read err.message directly, and auto-logout
// on a 401 (expired/invalid token) by clearing it.
api.interceptors.response.use(
  (res) => res,
  (error) => {
    const message =
      error.response?.data?.message || error.message || 'Something went wrong.';
    if (error.response?.status === 401) {
      clearToken();
    }
    return Promise.reject(new Error(message));
  }
);

export default api;
