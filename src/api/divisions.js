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

export function moveDivision(id, parentId) {
  return apiRequest(`/divisions/${id}/move`, {
    method: 'PUT',
    body: JSON.stringify({ parent_id: parentId }),
  });
}
