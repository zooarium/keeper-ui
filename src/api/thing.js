// ─────────────────────────────────────────────────────────────────────────────
// thing.js — SCAFFOLD TEMPLATE. Copy → rename → adapt. Do not import directly.
//
// Steps:
//   1. Copy this file to src/api/foo.js
//   2. Replace every "thing" / "Thing" / "things" with your resource name
//   3. Update the URL path (/things → /your-resource)
//   4. Add mock handlers to src/mocks/handlers.js
//   5. Delete this comment block
// ─────────────────────────────────────────────────────────────────────────────

import { apiRequest } from '@aviary-ui/core';

export function fetchThings(filters = {}) {
  const params = new URLSearchParams();
  if (filters.name) params.append('name', filters.name);

  const query = params.toString() ? `?${params.toString()}` : '';
  return apiRequest(`/things${query}`);
}

export function createThing(payload) {
  return apiRequest('/things', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateThing(id, payload) {
  return apiRequest(`/things/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export function deleteThing(id) {
  return apiRequest(`/things/${id}`, { method: 'DELETE' });
}
