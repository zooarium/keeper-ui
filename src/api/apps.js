import { apiRequest } from '@aviary-ui/core';

export function fetchApps() {
  return apiRequest('/apps');
}

export function fetchApp(id) {
  return apiRequest(`/apps/${id}`);
}

export function createApp(payload) {
  return apiRequest('/apps', { method: 'POST', body: JSON.stringify(payload) });
}

export function updateApp(id, payload) {
  return apiRequest(`/apps/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
}

export function deleteApp(id) {
  return apiRequest(`/apps/${id}`, { method: 'DELETE' });
}
