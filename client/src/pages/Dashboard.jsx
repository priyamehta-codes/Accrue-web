import React, { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, TrendingDown, Wallet, Users, Receipt, ArrowRight, PieChart as PieIcon, Calculator as CalcIcon, StickyNote } from 'lucide-react';
import { motion } from 'framer-motion';
import styled from 'styled-components';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import Layout from '../components/Layout';
import Loader from '../components/newloader';
import useCachedFetch from '../hooks/useCachedFetch';
import usePolling from '../hooks/usePolling';
import { useAuth } from '../context/AuthContext';
import { getDashboard, getCachedDashboard } from '../api/dashboard';
import { createTransaction } from '../api/transactions';
import PrivacyLock from '../components/PrivacyLock';

const fmt = (n) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n ?? 0);

const fmtDate = (d) =>
  new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

const typeColor = { income: 'var(--success)', expense: 'var(--danger)', transfer: 'var(--accent-light)' };
const typeSign = { income: '+', expense: '−', transfer: '' };
const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4'];

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
};


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

const StyledSavingsCard = styled(motion.div)`
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: var(--r-lg);
  padding: 32px;
  display: flex;
  flex-direction: column;
  gap: 24px;
  box-shadow: var(--shadow-sm);
  grid-column: span 2;

  @media (max-width: 768px) {
    padding: 20px;
    grid-column: 1 / -1;
  }

  .header {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .month-title {
    font-size: 0.9rem;
    font-weight: 600;
    color: var(--text-3);
  }

  .savings-amount {
    font-size: 2.8rem;
    font-weight: 800;
    color: var(--text-1);
    letter-spacing: -0.02em;
    line-height: 1.1;
  }

  .progress-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 10px 16px;
    width: 100%;
  }

  .pill {
    padding: 6px 20px;
    border-radius: var(--r-full);
    font-size: 0.85rem;
    font-weight: 700;
    color: #fff;
    min-width: 120px;
    text-align: center;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    flex-shrink: 0;
  }

  .pill.earned { background: #0EA5E9; }
  .pill.spend { background: #F43F5E; }

  .bar-wrapper {
    flex: 1;
    min-width: 60px;
    height: 28px;
    background: var(--bg-base);
    border-radius: var(--r-full);
    overflow: hidden;
    position: relative;
  }

  .bar-fill {
    height: 100%;
    border-radius: var(--r-full);
    transition: width 1s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .bar-fill.earned { background: #0EA5E9; opacity: 0.2; width: 100%; }
  .bar-fill.spend { background: #F43F5E; }

  .row-amount {
    font-size: 1rem;
    font-weight: 700;
    color: var(--text-1);
    white-space: nowrap;
    margin-left: auto;
  }

  /* On mobile: pill + amount sit on one line, bar stretches full-width below */
  @media (max-width: 600px) {
    padding: 16px;
    gap: 14px;

    .savings-amount {
      font-size: 2.4rem;
    }

    .progress-row {
      flex-direction: column;
      align-items: stretch;
      gap: 6px;
    }

    .progress-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
    }

    .pill {
      min-width: unset;
      font-size: 0.78rem;
      padding: 5px 14px;
    }

    .row-amount {
      font-size: 0.9rem;
      margin-left: 0;
    }

    .bar-wrapper {
      width: 100%;
      height: 20px;
      flex: unset;
      min-width: unset;
    }
  }
`;

const SavingsCard = ({ month, totalBalance, earned, spend, currencyFmt, delay }) => {
  // Available Balance relative to earnings or just a full bar if > earnings.
  const isNegative = totalBalance < 0;
  const isLowBalance = totalBalance < (earned * 0.1) || isNegative;

  const balanceWidth = isNegative ? 0 : Math.min((totalBalance / (earned || 1)) * 100, 100);
  const themeColor = isLowBalance ? 'var(--danger)' : 'var(--success)';

  return (
    <StyledSavingsCard
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: delay * 0.1, duration: 0.5 }}
      style={{ gridColumn: '1 / -1' }}
    >
      <Link to="/transactions?type=expense" style={{ textDecoration: 'none' }} className="header">
        <span className="month-title">{month} Total Expense</span>
        <h2 className="savings-amount" style={{ color: '#d35d13eb' }}>{currencyFmt(spend)}</h2>
      </Link>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Link to="/transactions?type=income" style={{ textDecoration: 'none' }} className="progress-row">
          <div className="progress-top">
            <div className="pill earned">Earnings</div>
            <span className="row-amount">{currencyFmt(earned)}</span>
          </div>
          <div className="bar-wrapper">
            <div className="bar-fill earned" style={{ width: '100%', opacity: 0.2 }} />
          </div>
        </Link>

        <Link to="/accounts" style={{ textDecoration: 'none' }} className="progress-row">
          <div className="progress-top">
            <div className="pill" style={{ background: themeColor }}>
              {isLowBalance ? 'Balance is Low' : 'Available Balance'}
            </div>
            <span className="row-amount" style={{ color: isLowBalance ? 'var(--danger)' : 'var(--text-1)' }}>
              {currencyFmt(totalBalance)}
            </span>
          </div>
          <div className="bar-wrapper">
            <div className="bar-fill" style={{ width: `${balanceWidth}%`, background: themeColor }} />
          </div>
        </Link>
      </div>
    </StyledSavingsCard>
  );
};

const StatCard = ({ label, value, Icon, iconBg, color, delay, to }) => (
  <Link to={to} style={{ textDecoration: 'none', display: 'block' }}>
    <StyledStatCard 
      className="stat-card"
      $themeColor={color}
      $iconBg={iconBg}
      initial={{ opacity: 0, y: 20 }}
      whileHover={{ y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay * 0.1, duration: 0.4 }}
      style={{ cursor: 'pointer', height: '100%' }}
    >
      <span className="label">{label}</span>
      <span className="value" style={{ color }}>{value}</span>
      <motion.div 
        className="icon-wrapper"
        whileHover={{ scale: 1.1, rotate: 5 }}
      >
        <Icon size={20} />
      </motion.div>
    </StyledStatCard>
  </Link>
);

const EMPTY_TX_FORM = { accountId: '', toAccountId: '', type: 'expense', amount: '', category: 'Food', specifiedCategory: '', note: '', date: new Date().toISOString().slice(0, 10) };

const EXPENSE_CATEGORIES = ['Food', 'Transport', 'Shopping', 'Entertainment', 'Health', 'Education', 'Bills', 'Rent', 'Other'];
const INCOME_CATEGORIES = ['Salary', 'Freelance', 'Investment', 'Gift', 'Refund', 'Other'];
const CATEGORIES = [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES]; // For fallback or searching

const StatSideStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;

  @media (max-width: 768px) {
    grid-column: 1 / -1;
  }
`;

const MobileToolsContainer = styled.div`
  display: none;
  @media (max-width: 768px) {
    display: flex;
    background: var(--bg-surface);
    border: 1px solid var(--border);
    border-radius: var(--r-lg);
    margin-top: 16px;
    grid-column: 1 / -1;
    overflow: hidden;
    box-shadow: var(--shadow-sm);
  }
`;

const MobileToolBtn = styled(Link)`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 12px;
  text-decoration: none;
  color: var(--text-1);
  transition: all var(--transition);

  &:first-child {
    border-right: 1px solid var(--border);
  }

  &:hover {
    background: var(--bg-hover);
  }

  .icon-box {
    width: 32px;
    height: 32px;
    background: var(--accent-dim);
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--accent);
  }

  .label-text {
    font-weight: 700;
    font-size: 1rem;
    color: var(--accent);
  }
`;

const Dashboard = () => {
  const { user } = useAuth();
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
      <div className="page-header dashboard-page-header">
        <div className="dashboard-header-left">
          <h1 className="page-title">{getGreeting()}, {user?.name?.split(' ')[0] || 'User'}</h1>
          <p className="page-subtitle">{d.month} overview</p>
        </div>
        <div className="dashboard-header-right" style={{ display: 'flex', gap: '8px' }}>
           <Link to="/notes" className="btn btn-icon btn-secondary desktop-only" title="Notes">
             <StickyNote size={18} />
           </Link>
           <Link to="/calculator" className="btn btn-icon btn-secondary desktop-only" title="Calculator">
             <CalcIcon size={18} />
           </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="stat-grid" style={{ gridTemplateColumns: '1fr' }}>
        <SavingsCard
          month={d.month}
          totalBalance={d.totalBalance}
          earned={d.monthlyIncome}
          spend={d.monthlyExpense}
          currencyFmt={fmt}
          delay={1}
        />
        <MobileToolsContainer>
          <MobileToolBtn to="/calculator">
            <div className="icon-box"><CalcIcon size={20} /></div>
            <span className="label-text">Calculator</span>
          </MobileToolBtn>
          <MobileToolBtn to="/notes">
            <div className="icon-box" style={{ background: 'var(--bg-elevated)', color: 'var(--text-2)' }}><StickyNote size={20} /></div>
            <span className="label-text" style={{ color: 'var(--text-1)' }}>Notes</span>
          </MobileToolBtn>
        </MobileToolsContainer>
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
                  <button key={t} type="button" className={`btn btn-sm ${txForm.type === t ? 'btn-primary' : 'btn-secondary'}`} style={{ flex: 1, textTransform: 'capitalize' }} onClick={() => setTxForm({ ...txForm, type: t, category: t === 'income' ? 'Salary' : 'Food' })}>
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
                  {(txForm.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map((c) => <option key={c}>{c}</option>)}
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
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 className="card-title">Recent Transactions</h3>
              <Link to="/transactions" className="btn btn-sm btn-secondary" style={{ fontSize: '0.75rem', padding: '4px 10px' }}>View All</Link>
            </div>
            <PrivacyLock>
              {!d.recentTransactions?.length ? (
                <div className="empty-state">
                  <span className="empty-state-icon">💳</span>
                  <p>No transactions yet</p>
                </div>
              ) : (
                <div className="tx-list">
                  {d.recentTransactions.map((tx, idx) => {
                    // Calculate "balance after" for recent transactions
                    const getBalanceAfter = () => {
                      const account = d.accounts?.find(a => a._id === tx.accountId?._id || a._id === tx.accountId);
                      if (!account) return null;
                      let balance = account.balance;
                      // Note: This logic assumes recentTransactions are the MOST recent ones
                      for (let i = 0; i < idx; i++) {
                        const earlierTx = d.recentTransactions[i];
                        if (earlierTx.accountId?._id === account._id || earlierTx.accountId === account._id) {
                          const delta = { income: earlierTx.amount, expense: -earlierTx.amount, transfer: -earlierTx.amount }[earlierTx.type] || 0;
                          balance -= delta;
                        }
                      }
                      return balance;
                    };
                    const balanceAfter = getBalanceAfter();

                    return (
                      <Link key={tx._id} to="/transactions" className="tx-item" style={{ textDecoration: 'none', color: 'inherit', cursor: 'pointer' }}>
                        <div className="tx-icon" style={{ background: typeColor[tx.type] + '22' }}>
                          {tx.type === 'income' ? '↓' : tx.type === 'expense' ? '↑' : '⇄'}
                        </div>
                        <div className="tx-info" style={{ minWidth: 0, flex: 1, overflow: 'hidden' }}>
                          <p className="tx-title" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tx.note || tx.category}</p>
                          <p className="tx-meta" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {tx.accountId?.name} · {fmtDate(tx.date)}
                          </p>
                          {balanceAfter !== null && (
                            <p style={{ fontSize: '0.7rem', color: 'var(--text-3)', fontStyle: 'italic' }}>
                              Bal: {fmt(balanceAfter)}
                            </p>
                          )}
                        </div>
                        <span className="tx-amount" style={{ color: typeColor[tx.type] }}>
                          {typeSign[tx.type]}{fmt(tx.amount)}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </PrivacyLock>
          </div>
        </div>

          {/* Expense Categories Chart (Hoisted for mobile ordering) */}
          <Link to="/analytics" style={{ textDecoration: 'none' }} className="dashboard-chart-card">
            <div className="card fade-up" style={{ cursor: 'pointer' }}>
              <div className="section-header">
                <span className="section-title">Expense Categories</span>
                <PieIcon size={16} color="var(--text-3)" />
              </div>
              <div style={{ height: 220, width: '100%', marginTop: 10 }}>
                {d.categoryData?.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={d.categoryData}
                        innerRadius={60}
                        outerRadius={85}
                        paddingAngle={5}
                        dataKey="value"
                        fill="#8884d8"
                      >
                        {d.categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(val) => fmt(val)}
                        contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', fontSize: '0.75rem', boxShadow: 'var(--shadow-lg)' }}
                      />
                      <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle">
                        <tspan x="50%" dy="-0.5em" style={{ fontSize: '0.65rem', fontWeight: 600, fill: 'var(--text-3)', textTransform: 'uppercase' }}>Total</tspan>
                        <tspan x="50%" dy="1.4em" style={{ fontSize: '1.1rem', fontWeight: 800, fill: 'var(--text-1)' }}>{fmt(d.monthlyExpense)}</tspan>
                      </text>
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="empty-state" style={{ padding: '20px' }}>
                    <p style={{ fontSize: '0.8rem' }}>No expenses yet</p>
                  </div>
                )}
              </div>
            </div>
          </Link>

          {/* Right column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Calculator Shortcut Card */}
            <Link to="/calculator" style={{ textDecoration: 'none' }}>
              <div className="card fade-up desktop-only" style={{ border: '1px solid var(--accent-light)', background: 'linear-gradient(135deg, var(--bg-surface), var(--accent-dim))', cursor: 'pointer', padding: '12px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: 36, height: 36, background: 'var(--accent)', borderRadius: 'var(--r-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                    <CalcIcon size={20} />
                  </div>
                  <div>
                    <p style={{ fontWeight: 700, color: 'var(--text-1)', fontSize: '1rem' }}>Calculator</p>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-3)' }}>Quickly calculate budgets & splits</p>
                  </div>
                  <ArrowRight size={20} color="var(--accent)" style={{ marginLeft: 'auto' }} />
                </div>
              </div>
            </Link>

            {/* Notes Shortcut Card */}
            <Link to="/notes" style={{ textDecoration: 'none' }}>
              <div className="card fade-up" style={{ border: '1px solid var(--border)', background: 'var(--bg-surface)', cursor: 'pointer', padding: '12px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: 36, height: 36, background: 'var(--accent-dim)', borderRadius: 'var(--r-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }}>
                    <StickyNote size={20} />
                  </div>
                  <div>
                    <p style={{ fontWeight: 700, color: 'var(--text-1)', fontSize: '1rem' }}>Notes</p>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-3)' }}>Note down your daily reminders</p>
                  </div>
                  <ArrowRight size={20} color="var(--text-3)" style={{ marginLeft: 'auto' }} />
                </div>
              </div>
            </Link>

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
