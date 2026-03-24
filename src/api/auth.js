import { api, setToken } from './client.js';

export async function register(name, email, password) {
  const data = await api.post('/auth/register', { name, email, password });
  setToken(data.token);
  return data.user;
}

export async function login(email, password) {
  const data = await api.post('/auth/login', { email, password });
  setToken(data.token);
  return data.user;
}

export function logout() {
  setToken(null);
}

export function getMe() {
  return api.get('/users/me');
}

export function updateMe(data) {
  return api.put('/users/me', data);
}

export function searchUsers(q) {
  return api.get(`/users/search?q=${encodeURIComponent(q)}`);
}
