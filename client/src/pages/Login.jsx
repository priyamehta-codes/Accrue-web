import React from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';
import { TrendingUp, Shield, RefreshCw, Smartphone } from 'lucide-react';

const features = [
  { icon: <Shield size={20} />, text: 'Bank-grade JWT security' },
  { icon: <RefreshCw size={20} />, text: 'Real-time sync across devices' },
  { icon: <Smartphone size={20} />, text: 'Works on web & mobile' },
];

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSuccess = async ({ credential }) => {
    try {
      await login(credential);
      navigate('/');
    } catch (e) {
      console.error('Login failed', e);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card fade-up">
        <div className="login-logo">
          <div className="login-logo-icon"><TrendingUp size={28} /></div>
          <h1 className="login-title">Accrue</h1>
          <p className="login-tagline">Your finances, everywhere</p>
        </div>

        <div className="login-divider" />

        <div className="login-features">
          {features.map(({ icon, text }) => (
            <div key={text} className="login-feature">
              <span className="login-feature-icon">{icon}</span>
              <span>{text}</span>
            </div>
          ))}
        </div>

        <div className="login-divider" />

        <div className="login-google">
          <p className="login-prompt">Sign in to get started</p>
          <GoogleLogin
            onSuccess={handleSuccess}
            onError={() => console.error('Google OAuth error')}
            useOneTap
            theme="filled_black"
            shape="pill"
            size="large"
            text="signin_with"
          />
        </div>
      </div>

      <style>{`
        .login-page {
          min-height: 100vh;
          background: radial-gradient(ellipse 80% 60% at 50% -10%, rgba(99,102,241,0.25), transparent),
                      var(--bg-base);
          display: flex; align-items: center; justify-content: center;
          padding: 24px;
        }
        .login-card {
          background: var(--bg-surface);
          border: 1px solid var(--border-hover);
          border-radius: var(--r-2xl);
          padding: 42px 40px;
          width: 100%; max-width: 420px;
          box-shadow: var(--shadow-lg);
          text-align: center;
        }
        .login-logo { display: flex; flex-direction: column; align-items: center; gap: 10px; }
        .login-logo-icon {
          width: 60px; height: 60px;
          background: linear-gradient(135deg, var(--accent), #4338ca);
          border-radius: var(--r-lg);
          display: flex; align-items: center; justify-content: center;
          color: #fff;
          box-shadow: var(--accent-glow);
        }
        .login-title {
          font-size: 2.2rem; font-weight: 800;
          background: linear-gradient(135deg, var(--text-1) 20%, var(--accent));
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
        }
        .login-tagline { color: var(--text-3); font-size: 0.9rem; }
        .login-divider { height: 1px; background: var(--border); margin: 24px 0; }
        .login-features { display: flex; flex-direction: column; gap: 12px; text-align: left; }
        .login-feature {
          display: flex; align-items: center; gap: 12px;
          font-size: 0.87rem; color: var(--text-2);
        }
        .login-feature-icon {
          width: 36px; height: 36px;
          background: var(--accent-dim);
          border-radius: var(--r-sm);
          display: flex; align-items: center; justify-content: center;
          color: var(--accent-light); flex-shrink: 0;
        }
        .login-prompt { color: var(--text-3); font-size: 0.82rem; margin-bottom: 14px; }
        .login-google { display: flex; flex-direction: column; align-items: center; gap: 4px; }
      `}</style>
    </div>
  );
};

export default Login;
