const express = require('express');
const router = express.Router();
const { getNotes, createNote, deleteNote } = require('../controllers/notesController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', getNotes);
router.post('/', createNote);
router.delete('/:id', deleteNote);

module.exports = router;
