import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, Wallet, ArrowLeftRight, Receipt, Users,
  LogOut, Menu, X, TrendingUp,
} from 'lucide-react';

const navItems = [
  { to: '/dashboard',    label: 'Dashboard',    Icon: LayoutDashboard },
  { to: '/accounts',     label: 'Accounts',     Icon: Wallet           },
  { to: '/transactions', label: 'Transactions', Icon: ArrowLeftRight   },
  { to: '/bills',        label: 'Bills',        Icon: Receipt          },
  { to: '/splits',       label: 'Splits',       Icon: Users            },
];

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <>
      {/* Mobile toggle */}
      <button
        className="mobile-menu-btn"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label="Toggle navigation"
      >
        {mobileOpen ? null : <Menu size={22} />}
      </button>

      {/* Backdrop */}
      {mobileOpen && (
        <div className="sidebar-backdrop" onClick={() => setMobileOpen(false)} />
      )}

      <aside className={`sidebar ${mobileOpen ? 'sidebar-open' : ''}`}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingRight: '8px' }}>
          {/* Logo */}
          <NavLink to="/" style={{ textDecoration: 'none' }} className="sidebar-logo">
            <div className="logo-icon"><TrendingUp size={20} /></div>
            <span className="logo-text">Accrue</span>
          </NavLink>
          {mobileOpen && (
            <button className="mobile-close-btn" onClick={() => setMobileOpen(false)}>
              <X size={22} />
            </button>
          )}
        </div>

        <div className="sidebar-divider" />

        {/* Nav */}
        <nav className="sidebar-nav">
          {navItems.map(({ to, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/dashboard'}
              className={({ isActive }) => `sidebar-link ${isActive ? 'sidebar-link-active' : ''}`}
              onClick={() => setMobileOpen(false)}
            >
              <Icon size={18} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-divider" />
          {/* User info */}
          {user && (
            <div className="sidebar-user">
              {user.picture
                ? <img src={user.picture} alt={user.name} className="user-avatar" />
                : <div className="user-avatar-fallback">{user.name?.[0]}</div>
              }
              <div className="user-info">
                <p className="user-name">{user.name}</p>
                <p className="user-email">{user.email}</p>
              </div>
            </div>
          )}
          <button className="sidebar-logout" onClick={handleLogout}>
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <style>{`
        .sidebar {
          position: fixed;
          top: 0; left: 0;
          width: var(--sidebar-w);
          height: 100vh;
          background: var(--bg-surface);
          border-right: 1px solid var(--border);
          display: flex;
          flex-direction: column;
          padding: 20px 12px;
          z-index: 100;
          transition: transform var(--transition);
        }
        .sidebar-logo {
          display: flex; align-items: center; gap: 10px;
          padding: 4px 8px 16px;
        }
        .logo-icon {
          width: 36px; height: 36px;
          background: var(--accent-dim);
          border: 1px solid rgba(99,102,241,0.3);
          border-radius: var(--r-md);
          display: flex; align-items: center; justify-content: center;
          color: var(--accent-light);
        }
        .logo-text {
          font-size: 1.35rem; font-weight: 800;
          background: linear-gradient(135deg, var(--accent-light), var(--text-1));
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
        }
        .sidebar-divider { height: 1px; background: var(--border); margin: 6px 0; }
        .sidebar-nav { flex: 1; display: flex; flex-direction: column; gap: 2px; padding: 8px 0; }
        .sidebar-link {
          display: flex; align-items: center; gap: 11px;
          padding: 10px 12px;
          border-radius: var(--r-md);
          color: var(--text-2);
          font-weight: 500;
          transition: all var(--transition);
          text-decoration: none;
        }
        .sidebar-link:hover {
          background: var(--bg-hover);
          color: var(--text-1);
        }
        .sidebar-link-active {
          background: var(--accent-dim);
          color: var(--accent-light);
          font-weight: 600;
          box-shadow: inset 2px 0 0 var(--accent);
        }
        .sidebar-footer { display: flex; flex-direction: column; gap: 8px; }
        .sidebar-user {
          display: flex; align-items: center; gap: 10px;
          padding: 10px 12px;
          border-radius: var(--r-md);
          border: 1px solid var(--border);
          background: var(--bg-elevated);
          margin-bottom: 4px;
        }
        .user-avatar { width: 34px; height: 34px; border-radius: 50%; object-fit: cover; flex-shrink: 0; }
        .user-avatar-fallback {
          width: 34px; height: 34px; border-radius: 50%;
          background: var(--accent-dim); color: var(--accent-light);
          display: flex; align-items: center; justify-content: center;
          font-weight: 700; font-size: 0.9rem; flex-shrink: 0;
        }
        .user-info { overflow: hidden; }
        .user-name { font-size: 0.82rem; font-weight: 600; color: var(--text-1); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .user-email { font-size: 0.72rem; color: var(--text-3); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .sidebar-logout {
          display: flex; align-items: center; gap: 9px;
          width: 100%; padding: 9px 12px;
          background: transparent; border: none; cursor: pointer;
          border-radius: var(--r-md); color: var(--text-3);
          font-size: 0.85rem; font-weight: 500; font-family: inherit;
          transition: all var(--transition);
        }
        .sidebar-logout:hover { background: var(--danger-dim); color: var(--danger); }

        /* Mobile */
        .mobile-menu-btn {
          display: none;
          position: fixed; top: 14px; left: 14px; z-index: 200;
          background: var(--bg-surface); border: 1px solid var(--border);
          color: var(--text-1); border-radius: var(--r-md);
          padding: 8px; cursor: pointer;
        }
        .sidebar-backdrop {
          display: none;
          position: fixed; inset: 0; background: rgba(0,0,0,0.6);
          backdrop-filter: blur(4px); z-index: 99;
        }
        .mobile-close-btn {
          display: none;
          background: transparent; border: none;
          color: var(--text-1); cursor: pointer; padding: 4px;
        }
        @media (max-width: 768px) {
          .mobile-menu-btn { display: flex; align-items: center; }
          .mobile-close-btn { display: flex; align-items: center; }
          .sidebar-backdrop { display: block; }
          .sidebar { transform: translateX(-100%); }
          .sidebar-open { transform: translateX(0); box-shadow: var(--shadow-lg); }
        }
      `}</style>
    </>
  );
};

export default Sidebar;
