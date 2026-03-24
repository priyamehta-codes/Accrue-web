import React, { useState } from 'react';
import styled from 'styled-components';
import { User, Mail, LogOut, Save, Shield, Moon, Sun, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import Switch from '../components/toggele';
import { updateProfile } from '../api/auth';

const Settings = () => {
  const { user, logout, updateUser } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
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

  return (
    <Layout>
      <div className="fade-up">
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
        </SettingsGrid>
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
      `}</style>
    </Layout>
  );
};

const SettingsGrid = styled.div`
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  gap: 24px;
  align-items: start;

  @media (max-width: 968px) {
    grid-template-columns: 1fr;
  }
`;

export default Settings;
