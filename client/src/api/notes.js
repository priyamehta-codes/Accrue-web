import api from './axios';

export const getNotes = async () => {
  const res = await api.get('/notes');
  return res.data;
};

export const createNote = async (content) => {
  const res = await api.post('/notes', { content });
  return res.data;
};

export const deleteNote = async (id) => {
  const res = await api.delete(`/notes/${id}`);
  return res.data;
};
