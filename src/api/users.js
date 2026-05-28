import { apiRequest } from '@aviary-ui/core';

export function fetchUsers() {
  return apiRequest('/users');
}

export function createUser(payload) {
  return apiRequest('/users', { method: 'POST', body: JSON.stringify(payload) });
}

export function updateUser(id, payload) {
  return apiRequest(`/users/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
}

export function deleteUser(id) {
  return apiRequest(`/users/${id}`, { method: 'DELETE' });
}
