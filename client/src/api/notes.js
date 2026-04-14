import api from './axios';

const CACHE_KEY = 'accrue_notes';
const save = (data) => { try { localStorage.setItem(CACHE_KEY, JSON.stringify(data)); } catch {} };

export const getNotes = async () => {
  const res = await api.get('/notes');
  save(res.data);
  return res.data;
};

export const getCachedNotes = () => {
  try { return JSON.parse(localStorage.getItem(CACHE_KEY)) || null; } catch { return null; }
};

export const createNote = async (content) => {
  const res = await api.post('/notes', { content });
  return res.data;
};

export const deleteNote = async (id) => {
  const res = await api.delete(`/notes/${id}`);
  return res.data;
};
