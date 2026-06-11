import { apiRequest } from '@aviary-ui/core';

export function fetchGuestKeys() {
  return apiRequest('/guest-keys');
}

export function createGuestKey(payload) {
  return apiRequest('/guest-keys', { method: 'POST', body: JSON.stringify(payload) });
}

export function updateGuestKey(id, payload) {
  return apiRequest(`/guest-keys/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
}

export function deleteGuestKey(id) {
  return apiRequest(`/guest-keys/${id}`, { method: 'DELETE' });
}
