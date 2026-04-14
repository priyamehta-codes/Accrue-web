import React, { useState, useEffect, useCallback } from 'react';
import { Trash2, StickyNote, PenTool, Calendar } from 'lucide-react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import Layout from '../components/Layout';
import Loader from '../components/newloader';
import BackButton from '../components/BackButton';
import { getNotes, getCachedNotes, createNote, deleteNote } from '../api/notes';
import useCachedFetch from '../hooks/useCachedFetch';

const NotesContainer = styled.div`
  max-width: 900px;
  margin: 0 auto;
  padding: 0 0 40px;
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

const NoteInputWrapper = styled.div`
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: var(--r-lg);
  padding: 20px;
  box-shadow: var(--shadow-sm);
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;

  &:focus-within {
    box-shadow: var(--shadow-md), 0 0 0 2px var(--accent-light);
    border-color: var(--accent);
  }

  textarea {
    width: 100%;
    min-height: 120px;
    border: none;
    background: transparent;
    font-size: 1.05rem;
    color: var(--text-1);
    resize: none;
    outline: none;
    line-height: 1.6;
    
    &::placeholder {
      color: var(--text-3);
      font-weight: 500;
    }
  }

  .actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px dashed var(--border);
  }
    
  .hints {
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--text-3);
    font-size: 0.8rem;
    font-weight: 500;
  }
`;

const NotesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
`;

const NoteCard = styled(motion.div)`
  background: linear-gradient(145deg, var(--bg-surface), var(--bg-elevated));
  border: 1px solid var(--border);
  border-radius: var(--r-md);
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  box-shadow: var(--shadow-sm);
  position: relative;
  overflow: hidden;
  
  &:hover {
    box-shadow: var(--shadow-md);
    transform: translateY(-2px);
  }

  &::before {
    content: '';
    position: absolute;
    top: 0; left: 0;
    width: 4px; height: 100%;
    background: var(--accent);
    opacity: 0.8;
  }

  .content {
    color: var(--text-1);
    font-size: 0.95rem;
    line-height: 1.6;
    white-space: pre-wrap;
    flex: 1;
    word-break: break-word;
  }

  .footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 12px;
    border-top: 1px solid var(--border);
    margin-top: auto;
  }

  .date-wrap {
    display: flex;
    align-items: center;
    gap: 6px;
    color: var(--text-3);
    font-size: 0.75rem;
    font-weight: 500;
  }

  .delete-btn {
    background: var(--danger-dim);
    color: var(--danger);
    border: none;
    border-radius: 8px;
    padding: 6px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
    opacity: 0;

    &:hover {
      background: var(--danger);
      color: #fff;
    }
  }

  &:hover .delete-btn {
    opacity: 1;
  }
  
  @media (max-width: 768px) {
    .delete-btn { opacity: 1; }
  }
`;

const Notes = () => {
  const fetch = useCallback(getNotes, []);
  const { data: cachedNotes, isLoading, refresh } = useCachedFetch(fetch, getCachedNotes);
  const [notes, setNotes] = useState(cachedNotes || []);
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (cachedNotes) {
      setNotes(cachedNotes);
    }
  }, [cachedNotes]);

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    setSaving(true);
    try {
      const newNote = await createNote(content);
      setNotes([newNote, ...notes]);
      setContent('');
      refresh();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteNote(id);
      setNotes((prevNotes) => prevNotes.filter(n => n._id !== id));
      refresh();
    } catch (err) {
      console.error(err);
    }
  };

  if (isLoading && !cachedNotes && notes.length === 0) {
    return <Layout><div className="loading-overlay"><Loader /><p style={{ marginTop: 12, color: 'var(--text-3)', fontWeight: 600 }}>Loading notes...</p></div></Layout>;
  }

  return (
    <Layout>
      <NotesContainer>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <BackButton to="/dashboard" label="Back to Dashboard" />
          <div className="page-header" style={{ marginBottom: 0, marginTop: '4px' }}>
            <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <StickyNote size={26} color="var(--accent)" style={{ position: 'relative', top: '-1px' }} />
              My Notes
            </h1>
            <p className="page-subtitle">Note down your daily reminders and thoughts</p>
          </div>
        </div>

        <NoteInputWrapper as="form" onSubmit={handleAddNote}>
          <textarea
            placeholder="Write a new note..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
          />
          <div className="actions">
            <div className="hints">
              <PenTool size={14} color="var(--accent)" />
              Record ideas on the go
            </div>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ padding: '8px 24px', borderRadius: 'var(--r-full)' }}
              disabled={saving || !content.trim()}
            >
              {saving ? 'Saving...' : 'Save Note'}
            </button>
          </div>
        </NoteInputWrapper>

        {notes.length === 0 ? (
          <div className="empty-state" style={{ marginTop: '40px' }}>
            <StickyNote size={48} color="var(--text-3)" style={{ opacity: 0.5, marginBottom: '16px' }} />
            <h3>No notes yet</h3>
            <p style={{ maxWidth: '300px' }}>Your saved notes will appear here. Start typing above to create your first note!</p>
          </div>
        ) : (
          <NotesGrid>
            <AnimatePresence>
              {notes.map((note) => (
                <NoteCard
                  key={note._id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  layout
                >
                  <div className="content">{note.content}</div>
                  <div className="footer">
                    <div className="date-wrap">
                      <Calendar size={13} />
                      {new Date(note.createdAt).toLocaleDateString(undefined, {
                        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                      })}
                    </div>
                    <button
                      type="button"
                      className="delete-btn"
                      onClick={() => handleDelete(note._id)}
                      aria-label="Delete note"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </NoteCard>
              ))}
            </AnimatePresence>
          </NotesGrid>
        )}
      </NotesContainer>
    </Layout>
  );
};

export default Notes;
