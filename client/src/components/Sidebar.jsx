import React, { useState, useCallback, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, Wallet, ArrowLeftRight, Receipt, Users,
  LogOut, Menu, X, TrendingUp, BarChart2, Github,
  Sun, Moon, Settings as SettingsIcon, Calculator as CalcIcon, StickyNote
} from 'lucide-react';
import useCachedFetch from '../hooks/useCachedFetch';
import { getDashboard, getCachedDashboard } from '../api/dashboard';

const routes = [
  { to: '/dashboard',    label: 'Dashboard',    Icon: LayoutDashboard,  key: 'dashboard' },
  { to: '/transactions', label: 'Transactions', Icon: ArrowLeftRight,   key: 'transactions' },
  { to: '/accounts',     label: 'Accounts',     Icon: Wallet,           key: 'accounts'  },
  { to: '/analytics',    label: 'Analytics',    Icon: BarChart2,        key: 'analytics' },
  { to: '/bills',        label: 'Bills',        Icon: Receipt,          key: 'bills'     },
  { to: '/splits',       label: 'Splits',       Icon: Users,            key: 'splits'    },
  { to: '/calculator',   label: 'Calculator',   Icon: CalcIcon,         key: 'calculator' },
  { to: '/settings',     label: 'Settings',     Icon: SettingsIcon,     key: 'settings'  },
  { to: '/notes',        label: 'Notes',        Icon: StickyNote,       key: 'notes'     },
];

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  
  const { data } = useCachedFetch(useCallback(getDashboard, []), getCachedDashboard);
  const d = data || {};

  useEffect(() => {
    if (mobileOpen) {
      document.body.classList.add('sidebar-mobile-active');
    } else {
      document.body.classList.remove('sidebar-mobile-active');
    }
    return () => document.body.classList.remove('sidebar-mobile-active');
  }, [mobileOpen]);

  // Global Swipe Gestures
  useEffect(() => {
    let startX = 0;
    let startY = 0;

    const handleStart = (e) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    };

    const handleEnd = (e) => {
      const endX = e.changedTouches[0].clientX;
      const endY = e.changedTouches[0].clientY;
      const dx = endX - startX;
      const dy = endY - startY;

      // Vertical movement guard (don't trigger on vertical scrolls)
      if (Math.abs(dy) > 50) return;
      // Ensure horizontal dominance
      if (Math.abs(dx) < Math.abs(dy) * 1.5) return;

      if (!mobileOpen) {
        // Swipe Right to Open (from anywhere, matching original dashboard behavior)
        if (dx > 100) {
          setMobileOpen(true);
        }
      } else {
        // Swipe Left to Close
        if (dx < -80) {
          setMobileOpen(false);
        }
      }
    };

    document.addEventListener('touchstart', handleStart, { passive: true });
    document.addEventListener('touchend', handleEnd, { passive: true });
    return () => {
      document.removeEventListener('touchstart', handleStart);
      document.removeEventListener('touchend', handleEnd);
    };
  }, [mobileOpen]);

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <>
      {location.pathname === '/dashboard' && (
        <button
          className="mobile-menu-btn"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle navigation"
        >
          {mobileOpen ? null : <Menu size={22} />}
        </button>
      )}

      {mobileOpen && (
        <div className="sidebar-backdrop" onClick={() => setMobileOpen(false)} />
      )}

      <aside className={`sidebar ${mobileOpen ? 'sidebar-open' : ''}`}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingRight: '8px' }}>
          <NavLink to="/" style={{ textDecoration: 'none' }} className="sidebar-logo">
            <div className="logo-icon"><img src="/Accrue-logo.svg" alt="Accrue" style={{ width: '100%', height: '100%', objectFit: 'contain' }} /></div>
            <div>
              <span className="logo-text">Accrue</span>
              <p style={{ fontSize: '0.62rem', color: 'var(--text-3)', fontWeight: 500, marginTop: 1, lineHeight: 1 }}>Your personal finance tracker</p>
            </div>
          </NavLink>
          
          <div style={{ display: 'flex', gap: '4px' }}>
            {mobileOpen && (
              <button className="mobile-close-btn" onClick={() => setMobileOpen(false)}>
                <X size={22} />
              </button>
            )}
          </div>
        </div>

        <div className="sidebar-divider" />

        <nav className="sidebar-nav">
          {routes.map(({ to, label, Icon, key }) => {
            const hasDot = key === 'bills' ? (d.upcomingBills?.length > 0) : key === 'splits' ? (d.unsettledSplitsCount > 0) : false;
            return (
              <NavLink
                key={to}
                to={to}
                end={to === '/dashboard'}
                className={({ isActive }) => `sidebar-link ${isActive ? 'sidebar-link-active' : ''}`}
                onClick={() => setMobileOpen(false)}
                style={{ position: 'relative' }}
              >
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={18} />
                  {hasDot && (
                    <span style={{ 
                      position: 'absolute', top: -2, right: -2, 
                      width: 8, height: 8, background: 'var(--danger)', 
                      borderRadius: '50%', border: '2px solid var(--bg-surface)' 
                    }} />
                  )}
                </div>
                <span>{label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-divider" />
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

          <a href="https://github.com/owsam22" target="_blank" rel="noreferrer" className="sidebar-github">
            <Github size={14} />
            <span>Developed by owsam22</span>
          </a>
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
          z-index: 300;
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
          border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          color: var(--accent-light);
          overflow: hidden;
        }
        .logo-icon img {
          width: 100%;
          height: 100%;
          object-fit: contain;
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
        .sidebar-link:hover { background: var(--bg-hover); color: var(--text-1); }
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
        .sidebar-github {
          display: flex; align-items: center; justify-content: center; gap: 6px;
          margin-top: 12px; padding: 8px;
          color: var(--text-3); font-size: 0.75rem; text-decoration: none;
          opacity: 0.7; transition: opacity var(--transition);
        }
        .sidebar-github:hover { opacity: 1; color: var(--text-1); }

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
