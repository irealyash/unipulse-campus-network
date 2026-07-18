/**
 * API CLIENT (Axios)
 * ----------------------------------------------------------------------------
 * Creates and exports a shared Axios instance used by all Redux thunks and
 * utility functions to communicate with the UniPulse backend.
 *
 * Key behaviors:
 *   - baseURL is "/api", proxied to the backend by Vite in dev (see vite.config.js)
 *   - Automatically attaches the JWT bearer token to every outgoing request
 *   - Normalizes error responses so callers can read `err.message` consistently
 *   - Auto-clears the stored token on 401 (expired/invalid) to trigger re-login
 *
 * Also exports helpers for reading/writing/clearing the JWT in localStorage.
 */

import axios from 'axios';

/** localStorage key where the JWT is stored. Used by auth slice and socket. */
export const TOKEN_KEY = 'unipulse_token';

/**
 * Read the JWT from localStorage.
 * @returns {string|null} The stored token, or null if absent.
 */
export const getToken = () => localStorage.getItem(TOKEN_KEY);

/**
 * Persist a JWT to localStorage.
 * @param {string} token - The JWT to store.
 */
export const setToken = (token) => localStorage.setItem(TOKEN_KEY, token);

/**
 * Remove the JWT from localStorage (e.g. on logout or 401). */
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

/**
 * Shared Axios instance. baseURL is "/api" which Vite proxies to the backend in
 * dev (see vite.config.js). Every request automatically carries the JWT.
 */
const api = axios.create({
  baseURL: '/api',
  // Prevent infinite "Loading communities…" when the proxy/backend hangs.
  timeout: 15000,
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
      error.code === 'ECONNABORTED'
        ? 'Request timed out. Is the backend running on port 5000?'
        : error.response?.status === 502
          ? 'Backend unavailable. Start the API server (npm run dev in backend).'
          : error.response?.data?.message || error.message || 'Something went wrong.';
    if (error.response?.status === 401) {
      clearToken();
    }
    return Promise.reject(new Error(message));
  }
);

export default api;
