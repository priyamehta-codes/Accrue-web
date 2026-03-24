import React from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { TrendingUp, Shield, Smartphone, ArrowRight } from 'lucide-react';

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

  @media (max-width: 768px) {
    padding: 20px 24px;
  }
`;

const Logo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--accent);
`;

const Section = styled.section`
  padding: 80px 24px;
  max-width: 1200px;
  margin: 0 auto;
  text-align: center;
  flex: 1;
`;

const HeroTitle = styled.h1`
  font-size: 4rem;
  font-weight: 800;
  line-height: 1.1;
  margin-bottom: 24px;
  background: linear-gradient(135deg, var(--text-1) 30%, var(--accent));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;

  @media (max-width: 768px) {
    font-size: 2.5rem;
  }
`;

const HeroSubtitle = styled.p`
  font-size: 1.25rem;
  color: var(--text-2);
  max-width: 600px;
  margin: 0 auto 48px auto;
  line-height: 1.6;
`;

const FeatureGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 32px;
  margin-top: 80px;
`;

const FeatureCard = styled.div`
  background: var(--bg-surface);
  padding: 32px;
  border-radius: var(--r-2xl);
  border: 1px solid var(--border);
  box-shadow: var(--shadow-sm);
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 16px;
`;

const IconWrapper = styled.div`
  width: 64px;
  height: 64px;
  border-radius: var(--r-xl);
  background: var(--accent-dim);
  color: var(--accent);
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Footer = styled.footer`
  padding: 40px 24px;
  text-align: center;
  border-top: 1px solid var(--border);
  background: var(--bg-surface);
  color: var(--text-3);
  font-size: 0.9rem;
`;

const Landing = () => {
  return (
    <LandingContainer>
      <Header>
        <Logo>
          <TrendingUp /> Accrue
        </Logo>
        <Link to="/login" className="btn btn-secondary">
          Sign In
        </Link>
      </Header>

      <Section>
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <HeroTitle>Your Personal Finance Ecosystem</HeroTitle>
          <HeroSubtitle>
            Accrue helps you seamlessly track budgets, stay on top of daily expenses, manage complex bill splits, and understand your financial footprint all in one minimal workspace.
          </HeroSubtitle>
          <Link to="/login" className="btn btn-primary btn-lg" style={{ fontSize: '1.1rem', padding: '16px 32px' }}>
            Get Started <ArrowRight size={20} />
          </Link>
        </motion.div>

        <FeatureGrid>
          <FeatureCard>
            <IconWrapper><Shield size={32} /></IconWrapper>
            <h3>Secure & Isolated</h3>
            <p style={{ color: 'var(--text-2)' }}>Bank-grade security ensures your data is heavily isolated and completely private. Only you can view your transactions.</p>
          </FeatureCard>
          <FeatureCard>
            <IconWrapper><Smartphone size={32} /></IconWrapper>
            <h3>Use Everywhere</h3>
            <p style={{ color: 'var(--text-2)' }}>Designed with an adaptive layout that fits right in your pocket. Access your entire dashboard clearly on mobile or desktop browsers.</p>
          </FeatureCard>
          <FeatureCard>
            <IconWrapper><TrendingUp size={32} /></IconWrapper>
            <h3>Real-Time Aggregates</h3>
            <p style={{ color: 'var(--text-2)' }}>Say goodbye to delayed reporting. Income, cash flow, and split balances are aggregated instantaneously upon any new entry.</p>
          </FeatureCard>
        </FeatureGrid>
      </Section>

      <Footer>
        <p>&copy; {new Date().getFullYear()} Accrue Expense Tracker. Built for modern financial transparency.</p>
      </Footer>
    </LandingContainer>
  );
};

export default Landing;
