import React, { useState } from 'react';
import styled from 'styled-components';
import { User, Mail, LogOut, Save, Shield, Moon, Sun, CheckCircle, Share2, Home, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import BackButton from '../components/BackButton';
import { useAuth } from '../context/AuthContext';
import Switch from '../components/toggele';
import { updateProfile, updatePin as apiUpdatePin } from '../api/auth';
import { getDashboard } from '../api/dashboard';
import { RefreshCw, Lock, LockKeyhole } from 'lucide-react';

const Settings = () => {
  const { user, logout, updateUser } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const [pin, setPin] = useState('');
  const [isPinEnabled, setIsPinEnabled] = useState(user?.isPinEnabled || false);
  const [pinLoading, setPinLoading] = useState(false);
  const [pinSuccess, setPinSuccess] = useState(false);
  
  // Theme logic mirrored from Sidebar
  const [isDark, setIsDark] = useState(() => localStorage.getItem('accrue-theme') === 'dark');

  const handleThemeChange = (checked) => {
    setIsDark(checked);
    const root = document.documentElement;
    if (checked) {
      root.setAttribute('data-theme', 'dark');
      localStorage.setItem('accrue-theme', 'dark');
    } else {
      root.setAttribute('data-theme', 'light');
      localStorage.setItem('accrue-theme', 'light');
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    setLoading(true);
    try {
      const updatedUser = await updateProfile(name);
      updateUser(updatedUser);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to update profile:', err);
      alert('Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const [syncing, setSyncing] = useState(false);
  const handleSyncData = async () => {
    setSyncing(true);
    try {
      await getDashboard();
    } catch (err) {
      console.error('Sync failed:', err);
    } finally {
      setSyncing(false);
    }
  };

  const handleUpdatePin = async (e) => {
    if (e) e.preventDefault();
    setPinLoading(true);
    try {
      const data = await apiUpdatePin(pin || undefined, isPinEnabled);
      updateUser({ ...user, isPinEnabled: data.isPinEnabled, hasPin: data.hasPin });
      setPinSuccess(true);
      setPin('');
      setTimeout(() => setPinSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to update PIN:', err);
      alert(err?.response?.data?.message || 'Failed to update PIN.');
    } finally {
      setPinLoading(false);
    }
  };

  const handleTogglePin = async (checked) => {
    setIsPinEnabled(checked);
    // If enabling and user has no pin, they must set one, 
    // but the backend will handle that or we can just send the toggle.
    // To be safe, we only toggle here and save.
    try {
      const data = await apiUpdatePin(undefined, checked);
      updateUser({ ...user, isPinEnabled: data.isPinEnabled, hasPin: data.hasPin });
    } catch (err) {
      console.error('Toggle PIN failed:', err);
      setIsPinEnabled(!checked);
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: 'Accrue Expense Tracker',
      text: 'Check out Accrue - a modern and secure way to track your finances!',
      url: window.location.origin
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.origin);
        alert('App link copied to clipboard!');
      }
    } catch (err) {
      console.error('Error sharing:', err);
    }
  };

  return (
    <Layout>
      <div className="fade-up">
        <BackButton />

        <div className="page-header">
          <div>
            <h1 className="page-title">Settings</h1>
            <p className="page-subtitle">Manage your account preferences and theme</p>
          </div>
        </div>

        <SettingsGrid>
          {/* Profile Section */}
          <section className="settings-section card">
            <div className="section-header">
              <div className="header-left">
                <User size={20} className="icon-accent" />
                <h3>Profile Information</h3>
              </div>
            </div>
            
            <form onSubmit={handleUpdateProfile}>
              <div className="form-group">
                <label className="form-label">Display Name</label>
                <div className="input-with-icon">
                  <User size={18} className="input-icon" />
                  <input 
                    type="text" 
                    className="form-input" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                  />
                </div>
              </div>

              <div className="form-group disabled">
                <label className="form-label">Email Address</label>
                <div className="input-with-icon">
                  <Mail size={18} className="input-icon" />
                  <input 
                    type="email" 
                    className="form-input" 
                    value={user?.email || ''} 
                    readOnly 
                    disabled
                  />
                </div>
                <p className="helper-text">Email is managed by Google and cannot be changed.</p>
              </div>

              <div className="form-actions">
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  disabled={loading || name === user?.name}
                >
                  {loading ? 'Saving...' : success ? 'Saved!' : 'Save Changes'}
                  {success ? <CheckCircle size={18} /> : <Save size={18} />}
                </button>
              </div>
            </form>
          </section>

          {/* Preferences Section */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <section className="settings-section card">
              <div className="section-header">
                <div className="header-left">
                  <Shield size={20} className="icon-accent" />
                  <h3>Preferences</h3>
                </div>
              </div>

              <div className="preference-item">
                <div className="preference-info">
                  <p className="preference-title">Dark Mode</p>
                  <p className="preference-desc">Switch between light and dark themes</p>
                </div>
                <Switch checked={isDark} onChange={handleThemeChange} />
              </div>

              <div className="divider" />

              <div className="preference-item">
                <div className="preference-info">
                  <p className="preference-title">Refresh Dashboard</p>
                  <p className="preference-desc">Manually sync dashboard data with server</p>
                </div>
                <button 
                  className="btn btn-secondary btn-sm" 
                  onClick={handleSyncData} 
                  disabled={syncing}
                >
                  <RefreshCw size={14} className={syncing ? 'spin-once' : ''} />
                  {syncing ? 'Syncing...' : 'Refresh'}
                </button>
              </div>
            </section>

            {/* Privacy Section */}
            <section className="settings-section card">
              <div className="section-header">
                <div className="header-left">
                  <LockKeyhole size={20} className="icon-accent" style={{ color: 'var(--warning)' }} />
                  <h3>Privacy & Security</h3>
                </div>
              </div>

              <div className="preference-item">
                <div className="preference-info">
                  <p className="preference-title">Enable Privacy PIN</p>
                  <p className="preference-desc">Require PIN to view transactions on dashboard</p>
                </div>
                <Switch checked={isPinEnabled} onChange={handleTogglePin} />
              </div>

              <div className="divider" />

              <form onSubmit={handleUpdatePin}>
                <div className="form-group">
                  <label className="form-label">Set New PIN</label>
                  <div className="input-with-icon">
                    <Lock size={18} className="input-icon" />
                    <input 
                      type="password" 
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={4}
                      className="form-input" 
                      value={pin} 
                      onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      placeholder={user?.hasPin ? "**** (Enter to change)" : "Set 4 digit PIN"}
                    />
                  </div>
                  <p className="helper-text">Enter exactly 4 digits to set or change your privacy PIN.</p>
                </div>

                <div className="form-actions" style={{ marginTop: 16 }}>
                  <button 
                    type="submit" 
                    className="btn btn-primary" 
                    disabled={pinLoading || (pin.length > 0 && pin.length !== 4)}
                    style={{ background: 'var(--warning)', borderColor: 'var(--warning)' }}
                  >
                    {pinLoading ? 'Updating...' : pinSuccess ? 'PIN Set!' : 'Update PIN'}
                    {pinSuccess ? <CheckCircle size={18} /> : <Lock size={18} />}
                  </button>
                </div>
              </form>

              <div className="divider" />

              <div className="preference-item danger-zone">
                <div className="preference-info">
                  <p className="preference-title">Sign Out</p>
                  <p className="preference-desc">Sign out of your account on this device</p>
                </div>
                <button className="btn btn-danger btn-sm" onClick={logout}>
                  Sign Out
                  <LogOut size={16} />
                </button>
              </div>
            </section>
          </div>
        </SettingsGrid>

        <FooterSection>
          <div className="footer-card card">
            <div className="footer-content">
              <div>
                <h3>Share Accrue</h3>
                <p>Help others manage their finances better by sharing this app.</p>
              </div>
              <button className="btn btn-secondary share-btn" onClick={handleShare}>
                <Share2 size={18} />
                Share App
              </button>
            </div>
            
            <div className="divider" />
            
            <div className="footer-links">
              <Link to="/" className="footer-link">
                <Home size={18} />
                Return to Home Page
              </Link>
              <div className="credentials">
                <span>Accrue v1.0.0</span>
                <span className="dot">•</span>
                <span>Highly Secure</span>
              </div>
            </div>
          </div>
        </FooterSection>
      </div>

      <style>{`
        .icon-accent { color: var(--accent); }
        .header-left { display: flex; align-items: center; gap: 12px; }
        .header-left h3 { font-size: 1.1rem; font-weight: 700; color: var(--text-1); }
        
        .input-with-icon { position: relative; }
        .input-icon { 
          position: absolute; 
          left: 12px; 
          top: 50%; 
          transform: translateY(-50%); 
          color: var(--text-3); 
        }
        .input-with-icon .form-input { padding-left: 40px; }
        
        .form-group.disabled { opacity: 0.7; }
        .helper-text { font-size: 0.75rem; color: var(--text-3); margin-top: 4px; }
        
        .form-actions { margin-top: 24px; display: flex; justify-content: flex-end; }
        
        .preference-item { 
          display: flex; 
          align-items: center; 
          justify-content: space-between; 
          padding: 12px 0; 
        }
        .preference-title { font-weight: 600; color: var(--text-1); font-size: 0.95rem; }
        .preference-desc { font-size: 0.85rem; color: var(--text-3); }
        
        .danger-zone { margin-top: 8px; }

        .share-btn {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .footer-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-bottom: 20px;
          gap: 20px;
        }

        .footer-content h3 { font-size: 1rem; color: var(--text-1); margin-bottom: 4px; }
        .footer-content p { font-size: 0.85rem; color: var(--text-3); }

        .footer-links {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 20px;
        }

        .footer-link {
          display: flex;
          align-items: center;
          gap: 8px;
          color: var(--accent);
          text-decoration: none;
          font-weight: 600;
          font-size: 0.9rem;
          transition: all 0.2s;
        }

        .footer-link:hover {
          opacity: 0.8;
          transform: translateX(-4px);
        }

        .credentials {
          font-size: 0.8rem;
          color: var(--text-3);
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .dot { opacity: 0.5; }

        @media (max-width: 600px) {
          .footer-content { flex-direction: column; text-align: center; }
          .footer-links { flex-direction: column; gap: 16px; }
        }
      `}</style>
    </Layout>
  );
};

const SettingsGrid = styled.div`
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  gap: 24px;
  align-items: start;
  margin-bottom: 24px;

  @media (max-width: 968px) {
    grid-template-columns: 1fr;
  }
`;

const FooterSection = styled.div`
  margin-top: 24px;
`;

export default Settings;
