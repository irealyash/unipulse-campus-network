/**
 * APPLICATION ENTRY POINT
 * ----------------------------------------------------------------------------
 * This is the Vite entry file that bootstraps the UniPulse React application.
 *
 * Bootstrap sequence:
 *   1. Apply the user's saved DaisyUI theme from localStorage (or default to 'dracula')
 *      immediately, before React renders, to prevent a flash of unstyled content.
 *   2. Regenerate the favicon to match the active theme colors.
 *   3. Mount the React tree into the #root DOM element with:
 *      - StrictMode   — enables extra development checks and warnings
 *      - Provider      — makes the Redux store available to all components
 *      - BrowserRouter — enables client-side routing via React Router
 *      - App           — the root application component with all routes
 */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { store } from './app/store';
import './index.css';
import { updateThemeFavicon } from './lib/favicon';
import App from './App.jsx';

// Apply the saved theme as early as possible to avoid a flash of the default.
const savedTheme = localStorage.getItem('unipulse_theme') || 'dracula';
document.documentElement.setAttribute('data-theme', savedTheme);
updateThemeFavicon();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </Provider>
  </StrictMode>
);
