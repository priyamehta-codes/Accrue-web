import api from './axios';

export const googleLogin = (id_token) =>
  api.post('/auth/google', { id_token }).then((r) => r.data);

export const getMe = () =>
  api.get('/auth/me').then((r) => r.data);

export const updateProfile = (name) =>
  api.put('/auth/profile', { name }).then((r) => r.data);
