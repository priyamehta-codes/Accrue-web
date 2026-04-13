const Note = require('../models/Note');

exports.getNotes = async (req, res) => {
  const notes = await Note.find({ userId: req.userId }).sort({ createdAt: -1 });
  res.json(notes);
};

exports.createNote = async (req, res) => {
  const { content } = req.body;
  if (!content) return res.status(400).json({ message: 'Content is required' });
  const note = new Note({ userId: req.userId, content });
  await note.save();
  res.status(201).json(note);
};

exports.deleteNote = async (req, res) => {
  const note = await Note.findOneAndDelete({ _id: req.params.id, userId: req.userId });
  if (!note) return res.status(404).json({ message: 'Note not found' });
  res.json({ message: 'Deleted successfully' });
};
