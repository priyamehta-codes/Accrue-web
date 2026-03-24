import React, { useState, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Trash2, Filter, Search, ArrowLeft } from 'lucide-react';
import Layout from '../components/Layout';
import Modal from '../components/Modal';
import Loader from '../components/newloader';
import useCachedFetch from '../hooks/useCachedFetch';
import { getTransactions, getCachedTransactions, createTransaction, deleteTransaction } from '../api/transactions';
import { getAccounts, getCachedAccounts } from '../api/accounts';

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

  const transactions = txData?.transactions || [];

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

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this transaction? This will reverse the account balance.')) return;
    await deleteTransaction(id);
    refresh();
  };

  if (isLoading && !transactions.length) {
    return <Layout><div className="loading-overlay"><Loader /><p style={{ marginTop: 12, color: 'var(--text-3)', fontWeight: 600 }}>Connecting to server...</p></div></Layout>;
  }

  return (
    <Layout>
      <div className="page-header">
        <div>
          <Link to="/dashboard" className="breadcrumb">
            <ArrowLeft size={14} /> Dashboard
          </Link>
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

      {!filtered.length ? (
        <div className="empty-state" style={{ marginTop: 40 }}>
          <div className="empty-state-icon">📋</div>
          <h3>No transactions found</h3>
          <p>Add your first transaction or adjust your filters.</p>
        </div>
      ) : (
        <div className="card">
          <div className="tx-list">
            {filtered.map((tx) => (
              <div key={tx._id} className="tx-item" style={{ borderBottom: '1px solid var(--border)' }}>
                <div className="tx-icon" style={{ background: typeColor[tx.type] + '22' }}>
                  <span style={{ fontSize: '1.1rem' }}>{tx.type === 'income' ? '↓' : tx.type === 'expense' ? '↑' : '⇄'}</span>
                </div>
                <div className="tx-info" style={{ minWidth: 0, flex: 1, overflow: 'hidden' }}>
                  <p className="tx-title" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tx.note || tx.category}</p>
                  <p className="tx-meta" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    <span className="badge" style={{ background: typeColor[tx.type] + '22', color: typeColor[tx.type], marginRight: 6, textTransform: 'capitalize' }}>
                      {tx.type === 'transfer' ? 'self transfer' : tx.type}
                    </span>
                    {tx.reference === 'split_payment' && (
                      <span className="badge" style={{ background: 'var(--accent-dim)', color: 'var(--accent-light)', marginRight: 6 }}>Split Payment</span>
                    )}
                    {tx.reference === 'split_settlement' && (
                      <span className="badge" style={{ background: 'var(--success-dim)', color: 'var(--success)', marginRight: 6 }}>Settlement</span>
                    )}
                    {tx.accountId?.name} · {fmtDate(tx.date)}
                  </p>
                </div>
                <span className="tx-amount" style={{ color: typeColor[tx.type], flexShrink: 0 }}>
                  {typeSign[tx.type]}{fmt(tx.amount)}
                </span>
                <button className="btn btn-icon btn-danger" style={{ marginLeft: 8, flexShrink: 0 }} onClick={() => handleDelete(tx._id)} title="Delete">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

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
