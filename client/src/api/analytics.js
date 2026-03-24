import api from './axios';

const CACHE_KEY = 'accrue_analytics';
const save = (data) => { try { localStorage.setItem(CACHE_KEY, JSON.stringify(data)); } catch {} };

export const getAnalytics = async () => {
  const res = await api.get('/analytics');
  save(res.data);
  return res.data;
};

export const getCachedAnalytics = () => {
  try { return JSON.parse(localStorage.getItem(CACHE_KEY)) || null; } catch { return null; }
};
