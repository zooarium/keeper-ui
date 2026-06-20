import '@tabler/core/dist/css/tabler.min.css';
import './index.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { configure } from '@aviary-ui/core';
import App from './App.jsx';

// Configure HTTP client before any API calls.
// All VITE_* vars live here — never inside @aviary-ui/core.
configure({
  apiBase: import.meta.env.VITE_API_BE_URL,
  authBase: import.meta.env.VITE_API_URL,
  refreshPath: import.meta.env.VITE_REFRESH_PATH ?? '/users/refresh',
  // When an impersonation session ends (expired/revoked/exited), return to the
  // admin dashboard rather than the login screen — the admin session is intact.
  impersonationExitPath: '/dashboard',
});

// Optional: enable MSW mock API in dev (no backend needed).
// Set VITE_MOCK_API=true in .env.development to activate.
if (import.meta.env.DEV && import.meta.env.VITE_MOCK_API === 'true') {
  const { worker } = await import('./mocks/browser');
  await worker.start({ onUnhandledRequest: 'warn' });
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);
