import React, { useState, useCallback } from 'react';
import { Plus, CheckCircle, Trash2, Users, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import Modal from '../components/Modal';
import Loader from '../components/newloader';
import useCachedFetch from '../hooks/useCachedFetch';
import { getSplits, getCachedSplits, createSplit, settleParticipant, deleteSplit } from '../api/splits';
import { getAccounts, getCachedAccounts } from '../api/accounts';

const fmt = (n) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n ?? 0);

const EMPTY_FORM = { description: '', totalAmount: '', accountId: '', notes: '', participants: [{ name: '', amount: '' }], type: 'split', applyAsTransaction: true };

const Splits = () => {
  const fetchSplits = useCallback(getSplits, []);
  const { data: splits, isLoading, refresh } = useCachedFetch(fetchSplits, getCachedSplits);
  const fetchAcc = useCallback(getAccounts, []);
  const { data: accounts } = useCachedFetch(fetchAcc, getCachedAccounts);

  const [modal, setModal] = useState(false);
  const [settleModal, setSettleModal] = useState(null); // { split, participant }
  const [settleAccountId, setSettleAccountId] = useState('');
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const addParticipant = () =>
    setForm({ ...form, participants: [...form.participants, { name: '', amount: '' }] });

  const updateParticipant = (i, key, val) => {
    const p = [...form.participants];
    p[i] = { ...p[i], [key]: val };
    setForm({ ...form, participants: p });
  };

  const removeParticipant = (i) =>
    setForm({ ...form, participants: form.participants.filter((_, idx) => idx !== i) });

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      const payload = {
        ...form,
        totalAmount: parseFloat(form.totalAmount),
        participants: form.participants.map(p => ({
          name: p.name,
          amount: parseFloat(p.amount)
        })),
      };
      await createSplit(payload);
      setModal(false);
      refresh();
    } catch (err) { console.error(err); } finally { setSaving(false); }
  };

  const handleSettle = async () => {
    if (!settleAccountId) return; setSaving(true);
    try {
      await settleParticipant(settleModal.split._id, settleModal.participant._id, { accountId: settleAccountId });
      setSettleModal(null); refresh();
    } catch (err) { console.error(err); } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this split?')) return;
    await deleteSplit(id); refresh();
  };

  const [filterType, setFilterType] = useState('all');

  if (isLoading && !splits?.length)
    return <Layout><div className="loading-overlay"><Loader /><p style={{ marginTop: 12, color: 'var(--text-3)', fontWeight: 600 }}>Connecting to server...</p></div></Layout>;

  const filtered = (splits || []).filter(s => filterType === 'all' || s.type === filterType);
  const active   = filtered.filter(s => !s.isSettled);
  const settled  = filtered.filter(s =>  s.isSettled);

  return (
    <Layout>
      <div className="page-header">
        <div>
          <Link to="/dashboard" className="breadcrumb">
            <ArrowLeft size={14} /> Dashboard
          </Link>
          <h1 className="page-title">Splits & Debts</h1>
          <p className="page-subtitle">{active.length} active · {settled.length} settled</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setForm(EMPTY_FORM); setModal(true); }}>
          <Plus size={16}/> New Entry
        </button>
      </div>

      <div className="filter-bar" style={{ marginBottom: 20, display: 'flex', gap: 8 }}>
        {['all', 'split', 'lend', 'borrow'].map(t => (
          <button 
            key={t} 
            className={`btn btn-sm ${filterType === t ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilterType(t)}
            style={{ textTransform: 'capitalize' }}
          >
            {t === 'all' ? 'All' : t}
          </button>
        ))}
      </div>

      {!splits?.length ? (
        <div className="empty-state" style={{ marginTop: 48 }}>
          <div className="empty-state-icon">👥</div>
          <h3>No splits yet</h3>
          <p>Track shared expenses and settle up with friends.</p>
          <button className="btn btn-primary" style={{ marginTop: 8 }} onClick={() => { setForm(EMPTY_FORM); setModal(true); }}>
            <Plus size={16}/> New Split
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[...active, ...settled].map((split) => {
            const paidCount = split.participants.filter(p => p.isPaid).length;
            const paidAmt   = split.participants.filter(p => p.isPaid).reduce((s, p) => s + p.amount, 0);
            const progress  = split.totalAmount > 0 ? (paidAmt / split.totalAmount) * 100 : 0;
            return (
              <div key={split._id} className="card fade-up" style={{ opacity: split.isSettled ? 0.6 : 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 4 }}>
                      <span className={`badge ${split.type === 'split' ? 'badge-info' : split.type === 'lend' ? 'badge-expense' : 'badge-income'}`} style={{ fontSize: '0.65rem' }}>
                        {split.type}
                      </span>
                      <h4 style={{ color: 'var(--text-1)', margin: 0 }}>{split.description}</h4>
                    </div>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-3)' }}>
                      {paidCount}/{split.participants.length} settled · {fmt(paidAmt)} / {fmt(split.totalAmount)}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{ fontSize: '1.1rem', fontWeight: 800, color: split.isSettled ? 'var(--success)' : 'var(--text-1)' }}>
                      {fmt(split.totalAmount)}
                    </span>
                    {split.isSettled && <CheckCircle size={16} color="var(--success)"/>}
                    <button className="btn btn-icon btn-danger" onClick={() => handleDelete(split._id)} title="Delete"><Trash2 size={14}/></button>
                  </div>
                </div>

                {/* Progress bar */}
                <div style={{ height: 4, background: 'var(--border)', borderRadius: 2, marginBottom: 14, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${progress}%`, background: 'var(--success)', borderRadius: 2, transition: 'width 0.5s ease' }}/>
                </div>

                {/* Participants */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {split.participants.map((p) => (
                    <div key={p._id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: 'var(--bg-elevated)', borderRadius: 'var(--r-md)', opacity: p.isPaid ? 0.7 : 1 }}>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: p.isPaid ? 'var(--success-dim)' : 'var(--accent-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: p.isPaid ? 'var(--success)' : 'var(--accent-light)', fontWeight: 700, fontSize: '0.8rem', flexShrink: 0 }}>
                        {p.name[0]?.toUpperCase()}
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-1)' }}>{p.name}</p>
                        {p.isPaid && <p style={{ fontSize: '0.72rem', color: 'var(--success)' }}>Settled</p>}
                      </div>
                      <span style={{ fontWeight: 700, color: p.isPaid ? 'var(--text-3)' : 'var(--text-1)', fontSize: '0.9rem' }}>{fmt(p.amount)}</span>
                      {!p.isPaid && !split.isSettled && (
                        <button className="btn btn-sm btn-success" onClick={() => { setSettleModal({ split, participant: p }); setSettleAccountId(split.accountId?._id || ''); }}>
                          Settle
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal isOpen={modal} onClose={() => setModal(false)} title="New Entry" size="lg">
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="tx-form-row">
            {['split', 'lend', 'borrow'].map(t => (
              <button 
                key={t} 
                type="button" 
                className={`btn btn-sm ${form.type === t ? 'btn-primary' : 'btn-secondary'}`}
                style={{ flex: 1, textTransform: 'capitalize' }}
                onClick={() => {
                  const newParticipants = (t === 'lend' || t === 'borrow') 
                    ? [{ name: '', amount: form.totalAmount }] 
                    : form.participants;
                  setForm({ ...form, type: t, participants: newParticipants });
                }}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="form-group">
            <label className="form-label">Description *</label>
            <input className="form-input" required value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="e.g. Goa Trip or Lunch with Sam"/>
          </div>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Total Amount *</label>
              <input 
                className="form-input" 
                type="number" 
                required 
                min="0.01" 
                step="0.01" 
                value={form.totalAmount} 
                onChange={e => {
                  const val = e.target.value;
                  const newParts = (form.type === 'lend' || form.type === 'borrow')
                    ? [{ ...form.participants[0], amount: val }]
                    : form.participants;
                  setForm({ ...form, totalAmount: val, participants: newParts });
                }}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Account {form.applyAsTransaction && ' *'}</label>
              <select className="form-select" required={form.applyAsTransaction} value={form.accountId} onChange={e => setForm({...form, accountId: e.target.value})}>
                <option value="">Select account</option>
                {(accounts||[]).map(a => <option key={a._id} value={a._id}>{a.name}</option>)}
              </select>
            </div>
          </div>

          <label className="card" style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', padding: '12px 16px', border: form.applyAsTransaction ? '1px solid var(--accent-light)' : '1px solid var(--border)', background: form.applyAsTransaction ? 'var(--accent-dim)' : 'transparent', transition: 'all 0.2s' }}>
            <input 
              type="checkbox" 
              checked={form.applyAsTransaction} 
              onChange={e => setForm({ ...form, applyAsTransaction: e.target.checked })}
              style={{ width: 18, height: 18, accentColor: 'var(--accent-light)' }}
            />
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: '0.9rem', fontWeight: 700, color: form.applyAsTransaction ? 'var(--accent-light)' : 'var(--text-1)' }}>Record as {form.type === 'borrow' ? 'Income' : 'Expense'} now</p>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-3)', marginTop: 2 }}>This will update your account balance immediately with the total amount.</p>
            </div>
          </label>

          {/* Participants - only for 'split' type or single person for lend/borrow */}
          <div>
            <div className="section-header" style={{ marginBottom: 10 }}>
              <span className="section-title">
                {form.type === 'split' ? 'Participants (excluding you)' : form.type === 'lend' ? 'Lending to' : 'Borrowing from'}
              </span>
              {form.type === 'split' && (
                <button type="button" className="btn btn-secondary btn-sm" onClick={addParticipant}>
                  <Plus size={13}/> Add
                </button>
              )}
            </div>
            {form.participants.map((p, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 8, alignItems: 'center' }}>
                <input className="form-input" placeholder="Name" required value={p.name} onChange={e => updateParticipant(i, 'name', e.target.value)} style={{ flex: 2 }}/>
                <input 
                  className="form-input" 
                  placeholder="Amount" 
                  type="number" 
                  required
                  min="0" 
                  step="0.01" 
                  value={p.amount} 
                  onChange={e => updateParticipant(i, 'amount', e.target.value)} 
                  style={{ flex: 1 }}
                  disabled={form.type !== 'split'}
                />
                {form.type === 'split' && form.participants.length > 1 && (
                  <button type="button" className="btn btn-icon btn-danger" onClick={() => removeParticipant(i)}><Trash2 size={13}/></button>
                )}
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 6 }}>
            <button type="button" className="btn btn-secondary" onClick={() => setModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving…' : form.type === 'split' ? 'Create Split' : form.type === 'lend' ? 'Lend Money' : 'Borrow Money'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Settle Participant Modal */}
      <Modal isOpen={!!settleModal} onClose={() => setSettleModal(null)} title={`Settle — ${settleModal?.participant?.name}`} size="sm">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <p style={{ color: 'var(--text-2)' }}>
            {settleModal?.split?.type === 'borrow' ? 'Repaying' : 'Receiving'}{' '}
            <strong style={{ color: 'var(--text-1)' }}>{fmt(settleModal?.participant?.amount)}</strong>{' '}
            {settleModal?.split?.type === 'borrow' ? 'from' : 'into'}:
          </p>
          <select className="form-select" value={settleAccountId} onChange={e => setSettleAccountId(e.target.value)}>
            <option value="">Select account</option>
            {(accounts||[]).map(a => <option key={a._id} value={a._id}>{a.name}</option>)}
          </select>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-3)' }}>
            This will create an {settleModal?.split?.type === 'borrow' ? 'expense' : 'income'} transaction in your account.
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button className="btn btn-secondary" onClick={() => setSettleModal(null)}>Cancel</button>
            <button className="btn btn-success" disabled={!settleAccountId || saving} onClick={handleSettle}>
              {saving ? 'Processing…' : 'Confirm Settlement'}
            </button>
          </div>
        </div>
      </Modal>
    </Layout>
  );
};

export default Splits;
