import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { verifyPin } from '../api/auth';
import { Lock, Delete } from 'lucide-react';
import styled from 'styled-components';

const PrivacyLock = ({ children }) => {
  const { user, isUnlocked, setUnlocked } = useAuth();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleKeyPress = (num) => {
    if (pin.length < 4) {
      setPin(prev => prev + num);
      setError('');
    }
  };

  const handleBackspace = () => {
    setPin(prev => prev.slice(0, -1));
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (pin.length !== 4) return;

    setLoading(true);
    try {
      await verifyPin(pin);
      setUnlocked(true);
    } catch (err) {
      setError('Wrong PIN');
      setPin('');
      // Vibrate if mobile?
      if (window.navigator.vibrate) window.navigator.vibrate(200);
    } finally {
      setLoading(false);
    }
  };

  const isLocked = user?.isPinEnabled && !isUnlocked;

  useEffect(() => {
    if (isLocked && pin.length === 4) {
      handleSubmit();
    }
  }, [pin, isLocked]);

  return (
    <Container className={isLocked ? 'is-locked' : ''}>
      <ContentWrapper className={isLocked ? 'blurred' : ''}>
        {children}
      </ContentWrapper>

      {isLocked && (
        <Overlay>
          <LockCard className="fade-up">
            <Header>
              <div className="icon-box">
                <Lock size={18} />
              </div>
              <div className="text-box">
                <p className="title">Secure View</p>
                <p className="subtitle">Enter 4-digit PIN</p>
              </div>
            </Header>

            <PinArea>
              <Dots>
                {[...Array(4)].map((_, i) => (
                  <Dot key={i} className={`${i < pin.length ? 'active' : ''} ${error ? 'error' : ''}`} />
                ))}
              </Dots>
              {error && <ErrorMessage>{error}</ErrorMessage>}
            </PinArea>

            <Pad>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, '', 0, 'del'].map((key, i) => {
                if (key === '') return <div key={i} />;
                if (key === 'del') return (
                  <PadBtn key={i} onClick={handleBackspace} className="functional">
                    <Delete size={20} />
                  </PadBtn>
                );
                return (
                  <PadBtn key={i} onClick={() => handleKeyPress(key)} disabled={loading}>
                    {key}
                  </PadBtn>
                );
              })}
            </Pad>
          </LockCard>
        </Overlay>
      )}
    </Container>
  );
};

const Container = styled.div`
  position: relative;
  width: 100%;
  transition: all 0.3s ease;
  border-radius: var(--r-lg);

  &.is-locked {
    min-height: 380px;
  }

  @media (max-width: 600px) {
    &.is-locked {
      min-height: 340px;
    }
  }
`;

const ContentWrapper = styled.div`
  transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  width: 100%;
  height: 100%;

  &.blurred {
    filter: blur(5px) saturate(1.1) contrast(0.9);
    opacity: 0.7;
    pointer-events: none;
    user-select: none;

    [data-theme='dark'] & {
      opacity: 0.5;
      filter: blur(6px) brightness(0.7);
    }
  }
`;

const Overlay = styled.div`
  position: absolute;
  inset: 0;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  z-index: 100;
  padding: 60px 16px 16px;
  animation: fadeIn 0.3s ease;

  @media (max-width: 600px) {
    padding-top: 40px;
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
`;

const LockCard = styled.div`
  width: 100%;
  max-width: 280px;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.4);
  border-radius: 28px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  box-shadow: 
    0 10px 30px rgba(0, 0, 0, 0.08),
    inset 0 0 0 1px rgba(255, 255, 255, 0.5);

  [data-theme='dark'] & {
    background: rgba(15, 23, 42, 0.7);
    border-color: rgba(255, 255, 255, 0.08);
    box-shadow: 0 15px 40px rgba(0, 0, 0, 0.3), inset 0 0 0 1px rgba(255, 255, 255, 0.05);
  }
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  text-align: left;

  .icon-box {
    width: 40px;
    height: 40px;
    background: var(--accent);
    color: white;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 10px var(--accent-dim);
  }

  .title {
    font-size: 1rem;
    font-weight: 800;
    color: var(--text-1);
    line-height: 1.2;
  }

  .subtitle {
    font-size: 0.75rem;
    color: var(--text-3);
    font-weight: 600;
  }
`;

const PinArea = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
`;

const Dots = styled.div`
  display: flex;
  gap: 14px;
`;

const Dot = styled.div`
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 2px solid var(--border);
  transition: all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);

  &.active {
    background: var(--accent);
    border-color: var(--accent);
    transform: scale(1.3);
    box-shadow: 0 0 10px var(--accent-dim);
  }

  &.error {
    border-color: var(--danger);
    background: var(--danger-dim);
    animation: shake 0.4s ease;
  }

  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-4px); }
    75% { transform: translateX(4px); }
  }
`;

const ErrorMessage = styled.p`
  color: var(--danger);
  font-size: 0.75rem;
  font-weight: 700;
  margin-top: 4px;
`;

const Pad = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
`;

const PadBtn = styled.button`
  height: 52px;
  border: none;
  background: var(--bg-surface);
  color: var(--text-1);
  font-size: 1.25rem;
  font-weight: 700;
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 5px rgba(0,0,0,0.04);

  &:hover:not(:disabled) {
    background: var(--bg-hover);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.08);
  }

  &:active:not(:disabled) {
    transform: scale(0.92);
  }

  &.functional {
    color: var(--text-3);
    background: transparent;
    box-shadow: none;
  }

  [data-theme='dark'] & {
    background: rgba(255, 255, 255, 0.03);
    &:hover:not(:disabled) { background: rgba(255, 255, 255, 0.08); }
  }
`;

export default PrivacyLock;
