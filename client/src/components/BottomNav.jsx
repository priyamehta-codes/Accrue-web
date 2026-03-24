import React, { useState, useCallback } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Wallet, ArrowLeftRight, Receipt, Users, Plus, X, BarChart2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import styled from 'styled-components';
import Modal from './Modal';
import { getAccounts, getCachedAccounts } from '../api/accounts';
import { createTransaction } from '../api/transactions';
import { getDashboard, getCachedDashboard } from '../api/dashboard';
import useCachedFetch from '../hooks/useCachedFetch';

/* ── Styled Components ───────────────────────────────────────────────── */
const Nav = styled.nav`
  display: none;
  @media (max-width: 768px) {
    display: flex;
    position: fixed;
    bottom: 0; left: 0; right: 0;
    height: 68px;
    background: rgba(255,255,255,0.82);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border-top: 1px solid rgba(15,23,42,0.08);
    box-shadow: 0 -4px 24px rgba(0,0,0,0.06);
    align-items: center;
    justify-content: space-around;
    z-index: 200;
    padding-bottom: env(safe-area-inset-bottom);
  }
`;

const NavItem = styled(NavLink)`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  color: var(--text-3);
  text-decoration: none;
  font-size: 0.65rem;
  font-weight: 600;
  padding: 8px 12px;
  border-radius: var(--r-md);
  transition: color var(--transition);
  width: 56px;

  &.active { color: var(--accent); }
  svg { transition: transform var(--transition); }
  &.active svg { transform: scale(1.15); }
`;

const FabWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  position: relative;
  top: -14px;
`;

const FabButton = styled(motion.button)`
  width: 56px; height: 56px;
  border-radius: 50%;
  background: var(--accent);
  color: #fff;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 16px rgba(79,70,229,0.45);
`;

/* ── Categories ─────────────────────────────────────────────────────── */
const INCOME_CATEGORIES = ['Salary', 'Freelance', 'Refund', 'Gift', 'Other'];
const EXPENSE_CATEGORIES = ['Food', 'Transport', 'Shopping', 'Entertainment', 'Bills', 'Health', 'Travel', 'Education', 'Other'];
const EMPTY_FORM = { accountId: '', toAccountId: '', type: 'expense', amount: '', category: 'Food', specifiedCategory: '', note: '', date: new Date().toISOString().slice(0, 10) };

/* ── BottomNav ───────────────────────────────────────────────────────── */
const BottomNav = ({ onTxAdded }) => {
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [fabOpen, setFabOpen] = useState(false);

  const fetchAcc = useCallback(getAccounts, []);
  const { data: accounts } = useCachedFetch(fetchAcc, getCachedAccounts);
  const { data: dashData } = useCachedFetch(useCallback(getDashboard, []), getCachedDashboard);
  const d = dashData || {};

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const finalCategory = (form.category === 'Other' && form.specifiedCategory.trim()) ? form.specifiedCategory : form.category;
      await createTransaction({ ...form, category: finalCategory, amount: parseFloat(form.amount) });
      setModal(false);
      setFabOpen(false);
      setForm(EMPTY_FORM);
      onTxAdded?.();
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  };

  const navItems = [
    { to: '/dashboard',    label: 'Home',      Icon: LayoutDashboard, key: 'dashboard' },
    { to: '/analytics',    label: 'Analytics', Icon: BarChart2,        key: 'analytics' },
    null, // FAB placeholder
    { to: '/bills',     label: 'Bills',    Icon: Receipt,          key: 'bills'     },
    { to: '/splits',    label: 'Splits',   Icon: Users,            key: 'splits'    },
  ];

  return (
    <>
      <Nav>
        {navItems.map((item, i) => {
          if (!item) return (
            <FabWrapper key="fab">
              <FabButton
                whileTap={{ scale: 0.92 }}
                animate={{ rotate: modal ? 45 : 0 }}
                transition={{ duration: 0.2 }}
                onClick={() => { setForm(EMPTY_FORM); setModal(true); }}
                aria-label="Add Transaction"
              >
                <Plus size={26} />
              </FabButton>
              <span style={{ fontSize: '0.65rem', fontWeight: 600, color: 'var(--accent)' }}>Add</span>
            </FabWrapper>
          );
          const { to, label, Icon, key } = item;
          const hasDot = key === 'bills' ? (d.upcomingBills?.length > 0) : key === 'splits' ? (d.unsettledSplitsCount > 0) : false;
          return (
            <NavItem key={to} to={to} end={to === '/dashboard'}>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={22} />
                {hasDot && (
                  <span style={{ 
                    position: 'absolute', top: -2, right: -2, 
                    width: 9, height: 9, background: 'var(--danger)', 
                    borderRadius: '50%', border: '2px solid rgba(255,255,255,0.9)' 
                  }} />
                )}
              </div>
              <span>{label}</span>
            </NavItem>
          );
        })}
      </Nav>

      <Modal isOpen={modal} onClose={() => setModal(false)} title="Add Transaction">
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Type */}
          <div style={{ display: 'flex', gap: 8 }}>
            {['expense', 'income', 'transfer'].map((t) => (
              <button key={t} type="button"
                className={`btn btn-sm ${form.type === t ? 'btn-primary' : 'btn-secondary'}`}
                style={{ flex: 1, textTransform: 'capitalize' }}
                onClick={() => setForm({ ...form, type: t })}
              >{t === 'transfer' ? 'Self transfer' : t}</button>
            ))}
          </div>

          {/* Amount + Date */}
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Amount *</label>
              <input className="form-input" type="number" required min="0.01" step="0.01"
                value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="0.00" />
            </div>
            <div className="form-group">
              <label className="form-label">Date</label>
              <input className="form-input" type="date" value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })} />
            </div>
          </div>

          {/* Account */}
          <div className="form-group">
            <label className="form-label">Account *</label>
            <select className="form-select" required value={form.accountId}
              onChange={(e) => setForm({ ...form, accountId: e.target.value })}>
              <option value="">Select account</option>
              {(accounts || []).map((a) => <option key={a._id} value={a._id}>{a.name}</option>)}
            </select>
          </div>

          {/* To Account for transfer */}
          {form.type === 'transfer' && (
            <div className="form-group">
              <label className="form-label">To Account *</label>
              <select className="form-select" required value={form.toAccountId}
                onChange={(e) => setForm({ ...form, toAccountId: e.target.value })}>
                <option value="">Select destination</option>
                {(accounts || []).filter((a) => a._id !== form.accountId).map((a) =>
                  <option key={a._id} value={a._id}>{a.name}</option>
                )}
              </select>
            </div>
          )}

          {/* Category */}
          <div className="form-group">
            <label className="form-label">Category</label>
            <select className="form-select" value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {(form.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map((c) => <option key={c}>{c}</option>)}
            </select>
            {form.category === 'Other' && (
              <input className="form-input" style={{ marginTop: 6 }} value={form.specifiedCategory}
                onChange={(e) => setForm({ ...form, specifiedCategory: e.target.value })}
                placeholder="Please specify (optional)" />
            )}
          </div>

          {/* Note */}
          <div className="form-group">
            <label className="form-label">Note</label>
            <input className="form-input" value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="Optional" />
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving…' : 'Add Transaction'}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
};

export default BottomNav;
