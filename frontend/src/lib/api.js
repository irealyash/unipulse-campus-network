/**
 * API CLIENT (Axios)
 * ----------------------------------------------------------------------------
 * Creates and exports a shared Axios instance used by all Redux thunks and
 * utility functions to communicate with the UniPulse backend.
 *
 * Key behaviors:
 *   - baseURL is VITE_API_URL + "/api" in production, or "/api" in local dev
 *     (Vite proxies /api → backend — see vite.config.js)
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
 * Backend origin for production (e.g. https://unipulse-api.up.railway.app).
 * Leave unset in local Vite dev so requests use the /api proxy.
 */
export const API_ORIGIN = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

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
 * Shared Axios instance.
 * Dev:  baseURL "/api" (proxied by Vite to localhost:5000)
 * Prod: baseURL "{VITE_API_URL}/api"
 */
const api = axios.create({
  baseURL: API_ORIGIN ? `${API_ORIGIN}/api` : '/api',
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
        ? 'Request timed out. Please try again.'
        : error.response?.status === 502
          ? 'Backend unavailable. Please try again in a moment.'
          : error.response?.data?.message || error.message || 'Something went wrong.';
    if (error.response?.status === 401) {
      clearToken();
    }
    return Promise.reject(new Error(message));
  }
);

export default api;
