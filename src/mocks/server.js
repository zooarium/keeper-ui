// MSW Node server — used in Vitest tests.
// Imported by src/test/setup.js; do not import in app code.
import { setupServer } from 'msw/node';
import { handlers } from './handlers';

export const server = setupServer(...handlers);
