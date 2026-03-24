import React, { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, TrendingDown, Wallet, Users, Receipt, ArrowRight, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import styled from 'styled-components';
import Layout from '../components/Layout';
import Loader from '../components/newloader';
import useCachedFetch from '../hooks/useCachedFetch';
import usePolling from '../hooks/usePolling';
import { getDashboard, getCachedDashboard } from '../api/dashboard';
import { createTransaction } from '../api/transactions';

const fmt = (n) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n ?? 0);

const fmtDate = (d) =>
  new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

const typeColor = { income: 'var(--success)', expense: 'var(--danger)', transfer: 'var(--accent-light)' };
const typeSign  = { income: '+', expense: '−', transfer: '' };


const StyledStatCard = styled(motion.div)`
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: var(--r-lg);
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  position: relative;
  overflow: hidden;
  box-shadow: var(--shadow-sm);
  transition: transform var(--transition), box-shadow var(--transition);

  @media (max-width: 768px) {
    padding: 12px 8px;
    gap: 4px;
    align-items: center;
    text-align: center;
    border-radius: var(--r-md);
  }

  &:hover {
    transform: translateY(-4px);
    box-shadow: var(--shadow-md);
    border-color: var(--border-hover);
  }

  &::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 3px;
    background: linear-gradient(90deg, ${(props) => props.$themeColor || 'var(--accent)'}, transparent);
    opacity: 0.8;
  }

  .label {
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--text-3);
    text-transform: uppercase;
    letter-spacing: 0.05em;

    @media (max-width: 768px) {
      font-size: 0.6rem;
      letter-spacing: 0;
      white-space: nowrap;
    }
  }

  .value {
    font-size: 2.2rem;
    font-weight: 800;
    line-height: 1;
    color: var(--text-1);

    @media (max-width: 768px) {
      font-size: 1.1rem;
      width: 100%;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }

  .icon-wrapper {
    position: absolute;
    top: 20px; right: 20px;
    width: 44px; height: 44px;
    border-radius: var(--r-md);
    display: flex;
    align-items: center;
    justify-content: center;
    background: ${(props) => props.$iconBg || 'var(--accent-dim)'};
    color: ${(props) => props.$themeColor || 'var(--accent)'};

    @media (max-width: 768px) {
      display: none;
    }
  }
`;

const StatCard = ({ label, value, Icon, iconBg, color, delay }) => (
  <StyledStatCard 
    className="stat-card"
    $themeColor={color}
    $iconBg={iconBg}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: delay * 0.1, duration: 0.4 }}
  >
    <span className="label">{label}</span>
    <span className="value" style={{ color }}>{value}</span>
    <div className="icon-wrapper">
      <Icon size={20} />
    </div>
  </StyledStatCard>
);

const EMPTY_TX_FORM = { accountId: '', toAccountId: '', type: 'expense', amount: '', category: 'Food', specifiedCategory: '', note: '', date: new Date().toISOString().slice(0, 10) };

const CATEGORIES = ['Food', 'Transport', 'Shopping', 'Entertainment', 'Bills', 'Health', 'Salary', 'Investment', 'Other'];

const Dashboard = () => {
  const fetch = useCallback(getDashboard, []);
  const { data, isLoading, error, isSyncing, refresh } = useCachedFetch(fetch, getCachedDashboard);
  const [txForm, setTxForm] = React.useState(EMPTY_TX_FORM);
  const [savingTx, setSavingTx] = React.useState(false);

  usePolling(refresh, 30000, true);

  const handleCreateTx = async (e) => {
    e.preventDefault(); setSavingTx(true);
    try {
      const finalCategory = (txForm.category === 'Other' && txForm.specifiedCategory.trim()) ? txForm.specifiedCategory : txForm.category;
      await createTransaction({ ...txForm, category: finalCategory, amount: parseFloat(txForm.amount) });
      setTxForm(EMPTY_TX_FORM); refresh();
    } catch (err) { console.error(err); } finally { setSavingTx(false); }
  };

  if (isLoading && !data) return <Layout><div className="loading-overlay"><Loader /><p style={{ marginTop: 12, color: 'var(--text-3)', fontWeight: 600 }}>Connecting to server...</p></div></Layout>;
  if (error && !data) return <Layout><div className="empty-state"><h3>Connection Failed</h3><p>Unable to connect to the server and no cached data available.</p></div></Layout>;

  const d = data || {};
  const savingsColor = d.savingsRate >= 0 ? 'var(--success)' : 'var(--danger)';

  return (
    <Layout onTxAdded={refresh}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">{d.month} overview</p>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={refresh} disabled={isSyncing}>
          <RefreshCw size={14} className={isSyncing ? 'spin-once' : ''} />
          {isSyncing ? 'Syncing…' : 'Refresh'}
        </button>
      </div>

      {/* Stats */}
      <div className="stat-grid">
        <StatCard label="Total Balance"    value={fmt(d.totalBalance)}    Icon={Wallet}      iconBg="var(--accent-dim)"  color="var(--text-1)"     delay={1} />
        <StatCard label="Monthly Income"   value={fmt(d.monthlyIncome)}   Icon={TrendingUp}  iconBg="var(--success-dim)" color="var(--success)"    delay={2} />
        <StatCard label="Monthly Expenses" value={fmt(d.monthlyExpense)}  Icon={TrendingDown} iconBg="var(--danger-dim)" color="var(--danger)"     delay={3} />
      </div>

      <div className="dashboard-grid">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Quick Add Transaction — desktop only */}
          <div className="card fade-up desktop-only">
            <div className="section-header" style={{ marginBottom: 12 }}>
              <span className="section-title">Add Transaction</span>
            </div>
            <form onSubmit={handleCreateTx} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="tx-form-row">
                {['expense', 'income', 'transfer'].map((t) => (
                  <button key={t} type="button" className={`btn btn-sm ${txForm.type === t ? 'btn-primary' : 'btn-secondary'}`} style={{ flex: 1, textTransform: 'capitalize' }} onClick={() => setTxForm({ ...txForm, type: t })}>
                    {t === 'transfer' ? 'Self transfer' : t}
                  </button>
                ))}
              </div>
              <div className="tx-form-row">
                <input className="form-input" style={{ flex: 1 }} type="number" required min="0.01" step="0.01" value={txForm.amount} onChange={(e) => setTxForm({ ...txForm, amount: e.target.value })} placeholder="Amount *" />
                <select className="form-select" style={{ flex: 1 }} required value={txForm.accountId} onChange={(e) => setTxForm({ ...txForm, accountId: e.target.value })}>
                  <option value="">Account *</option>
                  {(d.accounts || []).map((a) => <option key={a._id} value={a._id}>{a.name}</option>)}
                </select>
              </div>
              {txForm.type === 'transfer' && (
                <select className="form-select" required value={txForm.toAccountId} onChange={(e) => setTxForm({ ...txForm, toAccountId: e.target.value })}>
                  <option value="">To Account *</option>
                  {(d.accounts || []).filter((a) => a._id !== txForm.accountId).map((a) => <option key={a._id} value={a._id}>{a.name}</option>)}
                </select>
              )}
              <div className="tx-form-row">
                <select className="form-select" style={{ flex: 1 }} value={txForm.category} onChange={(e) => setTxForm({ ...txForm, category: e.target.value })}>
                  {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                </select>
                {txForm.category === 'Other' && (
                  <input className="form-input" style={{ flex: 1 }} value={txForm.specifiedCategory} onChange={(e) => setTxForm({ ...txForm, specifiedCategory: e.target.value })} placeholder="Please specify (optional)" />
                )}
                <input className="form-input" style={{ flex: 1 }} value={txForm.note} onChange={(e) => setTxForm({ ...txForm, note: e.target.value })} placeholder="Note" />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={savingTx}>
                {savingTx ? 'Saving…' : 'Add'}
              </button>
            </form>
          </div>

          {/* Recent Transactions */}
          <div className="card fade-up">
            <div className="section-header">
              <span className="section-title">Recent Transactions</span>
              <Link to="/transactions" className="btn btn-secondary btn-sm">
                View all <ArrowRight size={13} />
              </Link>
            </div>
            {!d.recentTransactions?.length ? (
              <div className="empty-state">
                <span className="empty-state-icon">💳</span>
                <p>No transactions yet</p>
              </div>
            ) : (
              <div className="tx-list">
                {d.recentTransactions.map((tx) => (
                  <div key={tx._id} className="tx-item">
                    <div className="tx-icon" style={{ background: typeColor[tx.type] + '22' }}>
                      {tx.type === 'income' ? '↓' : tx.type === 'expense' ? '↑' : '⇄'}
                    </div>
                    <div className="tx-info" style={{ minWidth: 0, flex: 1, overflow: 'hidden' }}>
                      <p className="tx-title" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tx.note || tx.category}</p>
                      <p className="tx-meta" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tx.accountId?.name} · {fmtDate(tx.date)}</p>
                    </div>
                    <span className="tx-amount" style={{ color: typeColor[tx.type] }}>
                      {typeSign[tx.type]}{fmt(tx.amount)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Account balances */}
          <div className="card fade-up">
            <div className="section-header">
              <span className="section-title">Accounts</span>
              <Link to="/accounts" className="btn btn-secondary btn-sm">
                Manage <ArrowRight size={13} />
              </Link>
            </div>
            {!d.accounts?.length ? (
              <div className="empty-state" style={{ padding: '24px' }}>
                <p>No accounts yet</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {d.accounts.map((acc) => (
                  <div key={acc._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'var(--bg-elevated)', borderRadius: 'var(--r-md)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: 10, height: 10, borderRadius: '50%', background: acc.color || 'var(--accent)' }} />
                      <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-1)' }}>{acc.name}</span>
                    </div>
                    <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-1)' }}>{fmt(acc.balance)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Upcoming Bills */}
          <div className="card fade-up">
            <div className="section-header">
              <span className="section-title">Upcoming Bills</span>
              <Link to="/bills" className="btn btn-secondary btn-sm">
                View all <ArrowRight size={13} />
              </Link>
            </div>
            {!d.upcomingBills?.length ? (
              <div className="empty-state" style={{ padding: '24px' }}>
                <p>No upcoming bills 🎉</p>
              </div>
            ) : (
              d.upcomingBills.map((bill) => {
                const daysLeft = Math.ceil((new Date(bill.dueDate) - Date.now()) / 86400000);
                return (
                  <div key={bill._id} className={`bill-item ${daysLeft <= 2 ? 'bill-due-soon' : ''}`}>
                    <Receipt size={16} color="var(--warning)" style={{ flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontWeight: 600, color: 'var(--text-1)', fontSize: '0.88rem' }}>{bill.name}</p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>Due {fmtDate(bill.dueDate)} · {daysLeft}d left</p>
                    </div>
                    <span style={{ fontWeight: 700, color: 'var(--warning)', fontSize: '0.9rem' }}>{fmt(bill.amount)}</span>
                  </div>
                );
              })
            )}
          </div>

          {/* Unsettled splits teaser */}
          {d.unsettledSplitsCount > 0 && (
            <Link to="/splits" style={{ textDecoration: 'none' }}>
              <div className="card fade-up" style={{ border: '1px solid rgba(99,102,241,0.3)', background: 'var(--accent-dim)', cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Users size={20} color="var(--accent-light)" />
                  <div>
                    <p style={{ fontWeight: 700, color: 'var(--accent-light)' }}>{d.unsettledSplitsCount} unsettled split{d.unsettledSplitsCount > 1 ? 's' : ''}</p>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-3)' }}>Tap to view and settle</p>
                  </div>
                  <ArrowRight size={16} color="var(--accent-light)" style={{ marginLeft: 'auto' }} />
                </div>
              </div>
            </Link>
          )}
        </div>
      </div>

      <style>{`
        .spin-once { animation: spin 0.7s linear; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </Layout>
  );
};

export default Dashboard;
