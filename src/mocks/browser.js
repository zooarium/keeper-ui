// MSW browser worker — optional dev-mode mock API (no backend needed).
// Activated in main.jsx when VITE_MOCK_API=true.
import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';

export const worker = setupWorker(...handlers);
