import React, { useState, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Trash2, Filter, Search } from 'lucide-react';
import Layout from '../components/Layout';
import BackButton from '../components/BackButton';
import Modal from '../components/Modal';
import Loader from '../components/newloader';
import useCachedFetch from '../hooks/useCachedFetch';
import { getTransactions, getCachedTransactions, createTransaction, deleteTransaction, updateTransaction } from '../api/transactions';
import { getAccounts, getCachedAccounts } from '../api/accounts';
import PrivacyLock from '../components/PrivacyLock';

const fmt = (n) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n ?? 0);

const fmtDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

const EXPENSE_CATEGORIES = ['Food', 'Transport', 'Shopping', 'Entertainment', 'Health', 'Education', 'Bills', 'Rent', 'Other'];
const INCOME_CATEGORIES = ['Salary', 'Freelance', 'Investment', 'Gift', 'Refund', 'Other'];
const CATEGORIES = [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES];
const typeColor = { income: 'var(--success)', expense: 'var(--danger)', transfer: 'var(--accent-light)' };
const typeSign  = { income: '+', expense: '−', transfer: '' };

const EMPTY_FORM = { accountId: '', toAccountId: '', type: 'expense', amount: '', category: 'Food', specifiedCategory: '', note: '', date: new Date().toISOString().slice(0, 10) };

const Transactions = () => {
  const fetchTx = useCallback(getTransactions, []);
  const { data: txData, isLoading, refresh } = useCachedFetch(fetchTx, getCachedTransactions);

  const fetchAcc = useCallback(getAccounts, []);
  const { data: accounts } = useCachedFetch(fetchAcc, getCachedAccounts);

  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [selectedTx, setSelectedTx] = useState(null);
  const transactions = txData?.transactions || [];

  // Calculate "balance after" for the visible transactions
  // This logic works best for the first page of transactions
  const getBalanceAfter = (tx, index) => {
    if (!accounts) return null;
    const account = accounts.find(a => a._id === tx.accountId?._id || a._id === tx.accountId);
    if (!account) return null;

    let balance = account.balance;
    // Walk back from current balance through more recent transactions
    for (let i = 0; i < index; i++) {
      const earlierTx = filtered[i];
      if (earlierTx.accountId?._id === account._id || earlierTx.accountId === account._id) {
        // Reverse the effect of the more recent transaction to find balance after 'tx'
        const delta = {
          income: earlierTx.amount,
          expense: -earlierTx.amount,
          transfer: -earlierTx.amount
        }[earlierTx.type] || 0;
        balance -= delta;
      }
    }
    return balance;
  };

  const filtered = transactions.filter((tx) => {
    const q = search.toLowerCase();
    const matchSearch = !q || (tx.note || '').toLowerCase().includes(q) || (tx.category || '').toLowerCase().includes(q);
    
    if (typeFilter === 'splits') {
      return matchSearch && (tx.reference === 'split_payment' || tx.reference === 'split_settlement');
    }
    
    const matchType = !typeFilter || tx.type === typeFilter;
    return matchSearch && matchType;
  });

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const finalCategory = (form.category === 'Other' && form.specifiedCategory.trim() !== '') ? form.specifiedCategory : form.category;
      await createTransaction({ ...form, category: finalCategory, amount: parseFloat(form.amount) });
      setModal(false);
      setForm(EMPTY_FORM);
      refresh();
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm('Delete this transaction? This will reverse the account balance.')) return;
    await deleteTransaction(id);
    refresh();
  };

  const [editingNote, setEditingNote] = useState(false);
  const [noteValue, setNoteValue] = useState('');

  const handleUpdateNote = async () => {
    if (!selectedTx) return;
    try {
      await updateTransaction(selectedTx._id, { note: noteValue });
      setSelectedTx({ ...selectedTx, note: noteValue });
      setEditingNote(false);
      refresh();
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    if (selectedTx) {
      setNoteValue(selectedTx.note || '');
      setEditingNote(false);
    }
  }, [selectedTx]);

  if (isLoading && !transactions.length) {
    return <Layout><div className="loading-overlay"><Loader /><p style={{ marginTop: 12, color: 'var(--text-3)', fontWeight: 600 }}>Connecting to server...</p></div></Layout>;
  }

  return (
    <Layout>
      <div className="page-header">
        <div>
          <BackButton />
          <h1 className="page-title">Transactions</h1>
          <p className="page-subtitle">{txData?.total || 0} total</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setForm(EMPTY_FORM); setModal(true); }}>
          <Plus size={16} /> Add
        </button>
      </div>

      {/* Filters */}
      <div className="filter-bar" style={{ flexWrap: 'nowrap', overflowX: 'auto', paddingBottom: 4 }}>
        <div style={{ position: 'relative', flex: '1 0 160px', minWidth: 160 }}>
          <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
          <input className="form-input" style={{ paddingLeft: 36 }} placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        {['', 'income', 'expense', 'transfer', 'splits'].map((t) => (
          <button key={t} className={`btn btn-sm ${typeFilter === t ? 'btn-primary' : 'btn-secondary'}`} style={{ textTransform: 'capitalize', flexShrink: 0 }} onClick={() => setTypeFilter(t)}>
            {t === '' ? 'All' : t === 'transfer' ? 'Transfer' : t === 'splits' ? 'Splits & Debts' : t}
          </button>
        ))}
      </div>

      <PrivacyLock>
        {!filtered.length ? (
          <div className="empty-state" style={{ marginTop: 40 }}>
            <div className="empty-state-icon">📋</div>
            <h3>No transactions found</h3>
            <p>Add your first transaction or adjust your filters.</p>
          </div>
        ) : (
          <div className="card">
            <div className="tx-list">
              {filtered.map((tx, idx) => {
                const balanceAfter = getBalanceAfter(tx, idx);
                return (
                  <div key={tx._id} className="tx-item" style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer' }} onClick={() => setSelectedTx(tx)}>
                    <div className="tx-icon" style={{ background: typeColor[tx.type] + '22' }}>
                      <span style={{ fontSize: '1.1rem' }}>{tx.type === 'income' ? '↓' : tx.type === 'expense' ? '↑' : '⇄'}</span>
                    </div>
                    <div className="tx-info" style={{ minWidth: 0, flex: 1, overflow: 'hidden' }}>
                      <p className="tx-title" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tx.note || tx.category}</p>
                      <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 4 }}>
                        <span className="badge" style={{ background: typeColor[tx.type] + '22', color: typeColor[tx.type], textTransform: 'capitalize' }}>
                          {tx.type === 'transfer' ? 'self transfer' : tx.type}
                        </span>
                        {tx.reference === 'split_payment' && (
                          <span className="badge" style={{ background: 'var(--accent-dim)', color: 'var(--accent-light)' }}>Split Payment</span>
                        )}
                        {tx.reference === 'split_settlement' && (
                          <span className="badge" style={{ background: 'var(--success-dim)', color: 'var(--success)' }}>Settlement</span>
                        )}
                        <p className="tx-meta" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {tx.accountId?.name} · {fmtDate(tx.date)}
                        </p>
                      </div>
                      {balanceAfter !== null && (
                        <p style={{ fontSize: '0.7rem', color: 'var(--text-3)', fontStyle: 'italic', marginTop: 2 }}>
                          Balance after: {fmt(balanceAfter)}
                        </p>
                      )}
                    </div>
                    <span className="tx-amount" style={{ color: typeColor[tx.type], flexShrink: 0 }}>
                      {typeSign[tx.type]}{fmt(tx.amount)}
                    </span>
                    <button className="btn btn-icon btn-danger" style={{ marginLeft: 8, flexShrink: 0 }} onClick={(e) => handleDelete(e, tx._id)} title="Delete">
                      <Trash2 size={14} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </PrivacyLock>

      {/* Detail Modal */}
      <Modal isOpen={!!selectedTx} onClose={() => setSelectedTx(null)} title="Transaction Details">
        {selectedTx && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ textAlign: 'center', padding: '24px 0', background: 'var(--bg-elevated)', borderRadius: 'var(--r-lg)', position: 'relative', border: '1px solid var(--border)' }}>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>
                {selectedTx.type}
              </p>
              <h2 style={{ fontSize: '2.8rem', fontWeight: 800, color: typeColor[selectedTx.type], margin: '0 0 8px 0', letterSpacing: '-0.02em' }}>
                {typeSign[selectedTx.type]}{fmt(selectedTx.amount)}
              </h2>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 8, alignItems: 'center' }}>
                <p style={{ fontWeight: 600, color: 'var(--text-1)' }}>{fmtDate(selectedTx.date)}</p>
                {(() => {
                  const idx = filtered.findIndex(t => t._id === selectedTx._id);
                  const bal = idx !== -1 ? getBalanceAfter(selectedTx, idx) : null;
                  return bal !== null ? (
                    <span className="badge badge-info" style={{ fontSize: '0.7rem' }}>
                      Bal after: {fmt(bal)}
                    </span>
                  ) : null;
                })()}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="card" style={{ padding: '12px 14px', background: 'var(--bg-surface)' }}>
                <p style={{ fontSize: '0.65rem', color: 'var(--text-3)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>ACCOUNT</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: selectedTx.accountId?.color || 'var(--accent)' }} />
                  <p style={{ fontWeight: 700, fontSize: '0.95rem' }}>{selectedTx.accountId?.name || 'N/A'}</p>
                </div>
              </div>
              <div className="card" style={{ padding: '12px 14px', background: 'var(--bg-surface)' }}>
                <p style={{ fontSize: '0.65rem', color: 'var(--text-3)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>CATEGORY</p>
                <p style={{ fontWeight: 700, fontSize: '0.95rem' }}>{selectedTx.category}</p>
              </div>
            </div>

            <div className="card" style={{ padding: 16, background: editingNote ? 'var(--bg-elevated)' : 'var(--bg-surface)', border: editingNote ? '2px solid var(--accent)' : '1px solid var(--border)', transition: 'all 0.2s' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <p style={{ fontSize: '0.7rem', color: 'var(--text-3)', fontWeight: 700, textTransform: 'uppercase' }}>NOTE</p>
                  {editingNote && <span className="badge badge-info" style={{ fontSize: '0.6rem', padding: '1px 6px' }}>Editing...</span>}
                </div>
                {!editingNote && (
                  <button className="btn btn-sm btn-secondary" style={{ padding: '4px 8px', fontSize: '0.75rem' }} onClick={() => setEditingNote(true)}>
                    Edit Note
                  </button>
                )}
              </div>
              
              {editingNote ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <textarea 
                    className="form-textarea" 
                    value={noteValue} 
                    onChange={(e) => setNoteValue(e.target.value)} 
                    placeholder="Add a detailed note about this transaction..."
                    autoFocus 
                    rows={3}
                    style={{ resize: 'none', background: 'var(--bg-surface)' }}
                  />
                  <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                    <button className="btn btn-sm btn-secondary" style={{ border: 'none' }} onClick={() => setEditingNote(false)}>Cancel</button>
                    <button className="btn btn-sm btn-primary" onClick={handleUpdateNote}>Save Changes</button>
                  </div>
                </div>
              ) : (
                <p style={{ fontSize: '1rem', color: selectedTx.note ? 'var(--text-1)' : 'var(--text-3)', fontStyle: selectedTx.note ? 'normal' : 'italic' }}>
                  {selectedTx.note || 'No description provided for this transaction.'}
                </p>
              )}
            </div>

            {selectedTx.reference !== 'manual' && (
              <div className="card" style={{ padding: '12px 16px', background: 'var(--accent-dim)', border: '1px dashed var(--accent-light)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent-light)' }} />
                  <p style={{ fontSize: '0.65rem', color: 'var(--accent-light)', fontWeight: 800, textTransform: 'uppercase' }}>SOURCE: {selectedTx.reference.replace('_', ' ')}</p>
                </div>
              </div>
            )}

            <button className="btn btn-secondary btn-lg" style={{ width: '100%', justifyContent: 'center', marginTop: 10, borderRadius: 'var(--r-md)' }} onClick={() => setSelectedTx(null)}>
              Done
            </button>
          </div>
        )}
      </Modal>

      <Modal isOpen={modal} onClose={() => setModal(false)} title="Add Transaction">
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Type toggle */}
          <div style={{ display: 'flex', gap: '8px' }}>
            {['expense', 'income', 'transfer'].map((t) => (
              <button key={t} type="button"
                className={`btn btn-sm ${form.type === t ? 'btn-primary' : 'btn-secondary'}`}
                style={{ flex: 1, textTransform: 'capitalize' }}
                onClick={() => setForm({ ...form, type: t, category: t === 'income' ? 'Salary' : 'Food' })}
              >{t === 'transfer' ? 'Self transfer' : t}</button>
            ))}
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Amount *</label>
              <input className="form-input" type="number" required min="0.01" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="0.00" />
            </div>
            <div className="form-group">
              <label className="form-label">Date</label>
              <input className="form-input" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Account *</label>
            <select className="form-select" required value={form.accountId} onChange={(e) => setForm({ ...form, accountId: e.target.value })}>
              <option value="">Select account</option>
              {(accounts || []).map((a) => <option key={a._id} value={a._id}>{a.name}</option>)}
            </select>
          </div>

          {form.type === 'transfer' && (
            <div className="form-group">
              <label className="form-label">To Account *</label>
              <select className="form-select" required value={form.toAccountId} onChange={(e) => setForm({ ...form, toAccountId: e.target.value })}>
                <option value="">Select destination</option>
                {(accounts || []).filter((a) => a._id !== form.accountId).map((a) => <option key={a._id} value={a._id}>{a.name}</option>)}
              </select>
            </div>
          )}

          <div className="form-grid">
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Category</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <select className="form-select" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                  {(form.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map((c) => <option key={c}>{c}</option>)}
                </select>
                {form.category === 'Other' && (
                  <input className="form-input" value={form.specifiedCategory} onChange={(e) => setForm({ ...form, specifiedCategory: e.target.value })} placeholder="Please specify (optional)" />
                )}
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Note</label>
              <input className="form-input" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="Optional" />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Add Transaction'}</button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
};

export default Transactions;
