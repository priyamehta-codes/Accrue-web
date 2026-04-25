import api from './axios';

export const googleLogin = (id_token) =>
  api.post('/auth/google', { id_token }).then((r) => r.data);

export const getMe = () =>
  api.get('/auth/me').then((r) => r.data);

export const updateProfile = (name) =>
  api.put('/auth/profile', { name }).then((r) => r.data);

export const updatePin = (pin, isPinEnabled) =>
  api.put('/auth/pin', { pin, isPinEnabled }).then((r) => r.data);

export const verifyPin = (pin) =>
  api.post('/auth/verify-pin', { pin }).then((r) => r.data);
