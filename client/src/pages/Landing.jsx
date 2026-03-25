import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { TrendingUp, Shield, Smartphone, ArrowRight, Github, Instagram, Linkedin, LogOut, LayoutDashboard, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const LandingContainer = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--bg-base);
  color: var(--text-1);
`;

const Header = styled.header`
  padding: 24px 48px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: sticky;
  top: 0;
  z-index: 10;
  background: rgba(var(--bg-base-rgb), 0.8);
  backdrop-filter: blur(12px);

  @media (max-width: 768px) {
    padding: 16px 20px;
  }
`;

const Logo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--accent);
  
  img {
    transition: transform 0.3s ease;
  }
  
  &:hover img {
    transform: rotate(-10deg) scale(1.1);
  }
`;

const AuthActions = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

const UserBadge = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 14px;
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: var(--r-full);
  font-size: 0.9rem;
  color: var(--text-2);
  
  .username {
    font-weight: 600;
    color: var(--text-1);
  }

  @media (max-width: 500px) {
    display: none;
  }
`;

const Section = styled.section`
  padding: 100px 24px;
  max-width: 1200px;
  margin: 0 auto;
  text-align: center;
  flex: 1;
`;

const HeroTitle = styled.h1`
  font-size: 4.5rem;
  font-weight: 800;
  line-height: 1.05;
  margin-bottom: 24px;
  background: linear-gradient(135deg, var(--text-1) 30%, var(--accent));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;

  @media (max-width: 768px) {
    font-size: 3rem;
  }
`;

const HeroSubtitle = styled.p`
  font-size: 1.25rem;
  color: var(--text-2);
  max-width: 650px;
  margin: 0 auto 48px auto;
  line-height: 1.6;
`;

const FeatureGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 32px;
  margin-top: 100px;
`;

const FeatureCard = styled.div`
  background: var(--bg-surface);
  padding: 40px 32px;
  border-radius: var(--r-2xl);
  border: 1px solid var(--border);
  box-shadow: var(--shadow-sm);
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 20px;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-8px);
    border-color: var(--accent);
    box-shadow: var(--shadow-lg);
  }
`;

const IconWrapper = styled.div`
  width: 72px;
  height: 72px;
  border-radius: var(--r-xl);
  background: var(--accent-dim);
  color: var(--accent);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 8px;
`;

const Footer = styled.footer`
  padding: 60px 48px 40px;
  border-top: 1px solid var(--border);
  background: var(--bg-surface);

  @media (max-width: 768px) {
    padding: 60px 24px 30px;
  }
`;

const FooterContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 40px;
  margin-bottom: 40px;
`;

const FooterBrand = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 300px;
  
  .footer-tagline {
    color: var(--text-3);
    font-size: 0.95rem;
    line-height: 1.5;
  }
`;

const FooterLinks = styled.div`
  display: flex;
  gap: 80px;

  @media (max-width: 600px) {
    gap: 40px;
  }
`;

const LinkGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  
  h4 {
    font-size: 0.85rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--text-1);
    margin-bottom: 4px;
  }
  
  a {
    font-size: 0.9rem;
    color: var(--text-3);
    text-decoration: none;
    transition: color 0.2s;
    
    &:hover {
      color: var(--accent);
    }
  }
`;

const SocialLinks = styled.div`
  display: flex;
  gap: 16px;
  margin-top: 8px;
  
  a {
    width: 40px;
    height: 40px;
    border-radius: var(--r-lg);
    background: var(--bg-base);
    border: 1px solid var(--border);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-2);
    transition: all 0.2s;
    
    &:hover {
      background: var(--accent-dim);
      color: var(--accent);
      border-color: var(--accent-light);
      transform: translateY(-2px);
    }
  }
`;

const Copyright = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding-top: 30px;
  border-top: 1px solid var(--border);
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: var(--text-3);
  font-size: 0.85rem;

  @media (max-width: 600px) {
    flex-direction: column;
    gap: 12px;
    text-align: center;
  }
`;

const Landing = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  return (
    <LandingContainer>
      <Header>
        <Logo>
          <img src="/Accrue-logo.svg" alt="Accrue logo" style={{ width: 32, height: 32 }} />
          <span>Accrue</span>
        </Logo>
        <AuthActions>
          {isAuthenticated ? (
            <>
              <UserBadge>
                <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <User size={12} color="#fff" />
                </div>
                <span>Hi, <span className="username">{user?.name?.split(' ')[0]}</span></span>
              </UserBadge>
              <Link to="/dashboard" className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <LayoutDashboard size={18} />
                Dashboard
              </Link>
              <button onClick={logout} className="btn" style={{ padding: '8px', color: 'var(--text-3)' }} title="Sign Out">
                <LogOut size={20} />
              </button>
            </>
          ) : (
            <Link to="/login" className="btn btn-secondary">
              Sign In
            </Link>
          )}
        </AuthActions>
      </Header>

      <Section>
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <HeroTitle>Your Personal Finance Ecosystem</HeroTitle>
          <HeroSubtitle>
            Accrue helps you seamlessly track budgets, stay on top of daily expenses, manage complex bill splits, and understand your financial footprint all in one minimal workspace.
          </HeroSubtitle>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
            <Link to={isAuthenticated ? "/dashboard" : "/login"} className="btn btn-primary btn-lg" style={{ fontSize: '1.1rem', padding: '16px 32px' }}>
              {isAuthenticated ? "Go to Dashboard" : "Get Started"} <ArrowRight size={20} />
            </Link>
            {!isAuthenticated && (
              <a href="#features" className="btn btn-secondary btn-lg" style={{ fontSize: '1.1rem', padding: '16px 32px' }}>
                See Features
              </a>
            )}
          </div>
        </motion.div>

        <FeatureGrid id="features">
          <FeatureCard>
            <IconWrapper><Shield size={36} /></IconWrapper>
            <h3>Secure & Isolated</h3>
            <p style={{ color: 'var(--text-2)' }}>Bank-grade security ensures your data is heavily isolated and completely private. Only you can view your transactions.</p>
          </FeatureCard>
          <FeatureCard>
            <IconWrapper><Smartphone size={36} /></IconWrapper>
            <h3>Use Everywhere</h3>
            <p style={{ color: 'var(--text-2)' }}>Designed with an adaptive layout that fits right in your pocket. Access your entire dashboard clearly on mobile or desktop browsers.</p>
          </FeatureCard>
          <FeatureCard>
            <IconWrapper><TrendingUp size={36} /></IconWrapper>
            <h3>Real-Time Aggregates</h3>
            <p style={{ color: 'var(--text-2)' }}>Say goodbye to delayed reporting. Income, cash flow, and split balances are aggregated instantaneously upon any new entry.</p>
          </FeatureCard>
          <FeatureCard>
            <IconWrapper><LayoutDashboard size={36} /></IconWrapper>
            <h3>Smart Dashboard</h3>
            <p style={{ color: 'var(--text-2)' }}>Get a bird's-eye view of your finances with automated reminders, upcoming bills, and balance trends updated in real-time.</p>
          </FeatureCard>
        </FeatureGrid>
      </Section>

      <Footer>
        <FooterContent>
          <FooterBrand>
            <Logo>
              <img src="/Accrue-logo.svg" alt="Accrue logo" style={{ width: 28, height: 28 }} />
              <span>Accrue</span>
            </Logo>
            <p className="footer-tagline">
              Empowering financial transparency through modern design and secure tracking.
            </p>
            <SocialLinks>
              <a href="https://github.com/owsam22" target="_blank" rel="noopener noreferrer"><Github size={18} /></a>
              <a href="https://linkedin.com/in/samarpan22" target="_blank" rel="noopener noreferrer"><Linkedin size={18} /></a>
              <a href="https://instagram.com/owsam22" target="_blank" rel="noopener noreferrer"><Instagram size={18} /></a>
            </SocialLinks>
          </FooterBrand>

          <FooterLinks>
            <LinkGroup>
              <h4>Product</h4>
              <a href="#features">Features</a>
              <Link to="/login">Security</Link>
              <Link to="/login">Analytics</Link>
            </LinkGroup>
            <LinkGroup>
              <h4>Support</h4>
              <a href="mailto:22.samarpan@gmail.com">Contact</a>

            </LinkGroup>
          </FooterLinks>
        </FooterContent>

        <Copyright>
          <p>&copy; {new Date().getFullYear()} Accrue. Built with Excellence.</p>
          <p style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            Crafted for <span style={{ fontWeight: 700, color: 'var(--text-1)' }}>Modern Finance</span>
          </p>
        </Copyright>
      </Footer>
    </LandingContainer>
  );
};

export default Landing;

