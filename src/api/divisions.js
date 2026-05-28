import { apiRequest } from '@aviary-ui/core';

export function fetchDivisions() {
  return apiRequest('/divisions');
}

export function createDivision(payload) {
  return apiRequest('/divisions', { method: 'POST', body: JSON.stringify(payload) });
}

export function updateDivision(id, payload) {
  return apiRequest(`/divisions/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
}

export function deleteDivision(id) {
  return apiRequest(`/divisions/${id}`, { method: 'DELETE' });
}
