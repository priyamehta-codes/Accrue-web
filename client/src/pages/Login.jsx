import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';
import { TrendingUp, Shield, RefreshCw, Smartphone, ArrowLeft } from 'lucide-react';

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
      navigate('/dashboard');
    } catch (e) {
      console.error('Login failed', e);
    }
  };

  return (
    <div className="login-page">
      <div className="bg-elements">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
        <div className="blob blob-3"></div>
      </div>

      <Link to="/" className="back-home-link">
        <ArrowLeft size={18} />
        Back to Home
      </Link>

      <div className="login-card fade-up">
        <div className="login-logo">
          <div className="login-logo-icon">
            <img src="/Accrue-logo.svg" alt="Accrue logo" style={{ width: 32, height: 32 }} />
          </div>
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
          background: var(--bg-base);
          display: flex; align-items: center; justify-content: center;
          padding: 24px;
          position: relative;
          overflow: hidden;
        }

        .bg-elements {
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          z-index: 0;
          pointer-events: none;
        }

        .blob {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          opacity: 0.15;
          animation: float 20s infinite alternate;
        }

        .blob-1 {
          width: 500px; height: 500px;
          background: var(--accent);
          top: -10%; left: -10%;
          animation-duration: 25s;
        }

        .blob-2 {
          width: 400px; height: 400px;
          background: #4338ca;
          bottom: -5%; right: -5%;
          animation-duration: 30s;
          animation-delay: -5s;
        }

        .blob-3 {
          width: 300px; height: 300px;
          background: #312e81;
          top: 40%; right: 20%;
          animation-duration: 20s;
          animation-delay: -10s;
        }

        @keyframes float {
          0% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0, 0) scale(1); }
        }

        .back-home-link {
          position: absolute;
          top: 32px; left: 32px;
          display: flex; align-items: center; gap: 8px;
          color: var(--text-3);
          text-decoration: none;
          font-weight: 500;
          font-size: 0.95rem;
          transition: all 0.2s;
          z-index: 10;
        }

        .back-home-link:hover {
          color: var(--accent);
          transform: translateX(-4px);
        }

        .login-card {
          background: var(--bg-surface);
          border: 1px solid var(--border);
          border-radius: var(--r-3xl);
          padding: 48px 40px;
          width: 100%; max-width: 420px;
          box-shadow: var(--shadow-xl);
          text-align: center;
          position: relative;
          z-index: 1;
          backdrop-filter: blur(8px);
        }

        .login-logo { display: flex; flex-direction: column; align-items: center; gap: 12px; }
        .login-logo-icon {
          width: 64px; height: 64px;
          background: linear-gradient(135deg, var(--accent), #4338ca);
          border-radius: var(--r-xl);
          display: flex; align-items: center; justify-content: center;
          color: #fff;
          box-shadow: 0 8px 16px -4px rgba(99, 102, 241, 0.4);
          margin-bottom: 8px;
        }
        .login-title {
          font-size: 2.5rem; font-weight: 800;
          background: linear-gradient(135deg, var(--text-1) 20%, var(--accent));
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
        }
        .login-tagline { color: var(--text-3); font-size: 0.95rem; }
        .login-divider { height: 1px; background: var(--border); margin: 28px 0; }
        .login-features { display: flex; flex-direction: column; gap: 16px; text-align: left; }
        .login-feature {
          display: flex; align-items: center; gap: 14px;
          font-size: 0.9rem; color: var(--text-2);
        }
        .login-feature-icon {
          width: 40px; height: 40px;
          background: var(--accent-dim);
          border-radius: var(--r-lg);
          display: flex; align-items: center; justify-content: center;
          color: var(--accent-light); flex-shrink: 0;
        }
        .login-prompt { color: var(--text-3); font-size: 0.85rem; margin-bottom: 16px; }
        .login-google { display: flex; flex-direction: column; align-items: center; gap: 4px; }

        @media (max-width: 480px) {
          .login-card { padding: 40px 24px; }
          .back-home-link { top: 20px; left: 20px; }
        }
      `}</style>
    </div>
  );
};

export default Login;
