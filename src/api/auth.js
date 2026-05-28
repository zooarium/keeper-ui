import { authRequest } from '@aviary-ui/core';

export async function login(email, password) {
  const data = await authRequest('/users/auth', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  if (!data?.data?.token) throw new Error('Invalid response from server.');
  return data.data;
}
