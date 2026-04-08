import React, { useState, useEffect, useCallback } from 'react';
import { Calculator as CalcIcon, Delete, RotateCcw, Equal, Percent, Divide, X, Minus, Plus, ChevronLeft } from 'lucide-react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import Layout from '../components/Layout';
import BackButton from '../components/BackButton';
import { createGlobalStyle } from 'styled-components';

const CalculatorLayoutFix = createGlobalStyle`
  @media (max-width: 768px) {
    .calculator-layout {
      padding-bottom: 68px !important; 
      padding-top: 50px !important;
      display: flex;
      flex-direction: column;
      height: 100vh;
    }
  }
`;

const CalcContainer = styled.div`
  max-width: 440px;
  margin: 20px auto;
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 24px;
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: var(--r-2xl);
  box-shadow: var(--shadow-lg);
  position: relative;

  @media (max-width: 768px) {
    max-width: 100%;
    margin: 0;
    padding: 12px;
    border-radius: 0;
    border: none;
    min-height: calc(100vh - 160px);
    gap: 12px;
  }

  &::before {
    content: '';
    position: absolute;
    top: -1px; left: -1px; right: -1px; bottom: -1px;
    background: linear-gradient(135deg, var(--accent-light), transparent, var(--accent-light));
    border-radius: inherit;
    z-index: -1;
    opacity: 0.15;
  }
`;

const DisplayWrapper = styled(motion.div)`
  background: var(--bg-base);
  border: 1px solid var(--border);
  border-radius: var(--r-lg);
  padding: 24px;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  justify-content: flex-end;
  min-height: 140px;
  gap: 4px;
  box-shadow: inset 0 2px 4px rgba(0,0,0,0.05);
  position: relative;
  overflow: hidden;

  @media (max-width: 768px) {
    flex: 1;
    min-height: 160px;
    padding: 30px 20px;
  }

  &::after {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    background: linear-gradient(135deg, var(--accent-dim) 0%, transparent 100%);
    opacity: 0.5;
    pointer-events: none;
  }
`;

const Formula = styled.div`
  font-size: 1.1rem;
  color: var(--text-3);
  font-weight: 500;
  min-height: 1.5rem;
  word-break: break-all;
  text-align: right;
`;

const Result = styled.div`
  font-size: 3.2rem;
  font-weight: 800;
  color: var(--text-1);
  line-height: 1;
  word-break: break-all;
  text-align: right;
  z-index: 1;

  @media (max-width: 480px) {
    font-size: 2.6rem;
  }
`;

const Keypad = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;

  @media (max-width: 480px) {
    gap: 8px;
  }
`;

const CalcButton = styled(motion.button)`
  height: 64px;
  border-radius: var(--r-md);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.3rem;
  font-weight: 600;
  border: 1px solid var(--border);
  background: ${(props) => props.$type === 'op' ? 'var(--accent-dim)' : props.$type === 'action' ? 'var(--bg-overlay)' : 'var(--bg-surface)'};
  color: ${(props) => props.$type === 'op' ? 'var(--accent-light)' : 'var(--text-1)'};
  cursor: pointer;
  outline: none;
  transition: all var(--transition);

  &:hover {
    border-color: var(--accent-light);
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
    background: ${(props) => props.$type === 'op' ? 'var(--accent)' : 'var(--bg-hover)'};
    color: ${(props) => props.$type === 'op' ? '#fff' : 'var(--text-1)'};
  }

  ${(props) => props.$wide && `
    grid-column: span 2;
  `}

  ${(props) => props.$equal && `
    background: var(--accent);
    color: #fff;
    border: none;
    &:hover {
      background: var(--accent-hover);
      box-shadow: var(--accent-glow);
    }
  `}

  @media (max-width: 480px) {
    height: 72px;
    font-size: 1.5rem;
    border-radius: var(--r-lg);
  }
`;

const Calculator = () => {
    const [formula, setFormula] = useState('');
    const [result, setResult] = useState('0');
    const [lastAction, setLastAction] = useState(null);

    const calculate = useCallback((expr) => {
        try {
            // Safety check: replace fancy chars and eval
            // Note: In a production app, use a proper expression evaluator like mathjs
            // But for a "just normal calculator", simple eval with sanitization is common
            const sanitized = expr.replace(/×/g, '*').replace(/÷/g, '/');
            if (!sanitized || /[^-+/*\d.]/.test(sanitized)) return '0';
            
            // Avoid eval directly on user input if possible, but here input is controlled by buttons
            // eslint-disable-next-line no-eval
            const res = eval(sanitized);
            return Number.isFinite(res) ? parseFloat(res.toFixed(8)).toString() : 'Error';
        } catch (e) {
            return 'Error';
        }
    }, []);

    const handleInput = useCallback((val) => {
        if (result === 'Error') {
            setFormula('');
            setResult('0');
        }

        if (typeof val === 'number' || val === '.') {
            if (lastAction === 'equal') {
                setFormula(val.toString());
                setResult(val.toString());
            } else {
                const current = result === '0' || lastAction === 'op' ? '' : result;
                if (val === '.' && current.includes('.')) return;
                setResult(current + val);
                setFormula(formula + val);
            }
        } else if (['+', '-', '×', '÷'].includes(val)) {
            if (lastAction === 'equal') {
                setFormula(result + val);
            } else if (lastAction === 'op') {
                setFormula(formula.slice(0, -1) + val);
            } else {
                setFormula(formula + val);
            }
            setLastAction('op');
        } else if (val === '=') {
            const res = calculate(formula);
            setResult(res);
            setFormula(formula); // Keep formula for history or clear? Let's keep it until next num
            setLastAction('equal');
        } else if (val === 'AC') {
            setFormula('');
            setResult('0');
            setLastAction(null);
        } else if (val === 'DEL') {
            if (formula.length > 0) {
                const newFormula = formula.slice(0, -1);
                setFormula(newFormula);
                // Simple result back-calculation or just reset result to prev? 
                // Let's just update formula. 
                setResult(calculate(newFormula) || '0');
            }
        } else if (val === '%') {
            if (result !== '0') {
                const res = (parseFloat(result) / 100).toString();
                setResult(res);
                setFormula(res);
            }
        }
    }, [formula, result, lastAction, calculate]);

    // Keyboard support
    useEffect(() => {
        const handleKeyDown = (e) => {
            const key = e.key;
            if (/[0-9]/.test(key)) handleInput(parseInt(key));
            if (key === '.') handleInput('.');
            if (key === '+') handleInput('+');
            if (key === '-') handleInput('-');
            if (key === '*') handleInput('×');
            if (key === '/') handleInput('÷');
            if (key === 'Enter' || key === '=') handleInput('=');
            if (key === 'Backspace') handleInput('DEL');
            if (key === 'Escape') handleInput('AC');
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleInput]);

    return (
        <Layout mainClassName="calculator-layout">
            <CalculatorLayoutFix />
            <BackButton />
            
            <div className="page-header" style={{ marginTop: 0 }}>
                <div>
                    <h1 className="page-title" style={{ fontSize: 'var(--mobile-title-size, 1.3rem)' }}>Calculator</h1>
                    <p className="page-subtitle desktop-only">Quick calculations for your budget</p>
                </div>
                <div className="desktop-only" style={{ background: 'var(--accent-dim)', color: 'var(--accent-light)', padding: '8px 12px', borderRadius: 'var(--r-md)', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <CalcIcon size={18} />
                    <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>Basic Arithmetic</span>
                </div>
            </div>

            <CalcContainer>
                <DisplayWrapper
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <Formula>{formula || ' '}</Formula>
                    <Result>{result}</Result>
                </DisplayWrapper>

                <Keypad>
                    <CalcButton $type="action" onClick={() => handleInput('AC')} whileTap={{ scale: 0.95 }}>
                        <RotateCcw size={20} />
                    </CalcButton>
                    <CalcButton $type="action" onClick={() => handleInput('DEL')} whileTap={{ scale: 0.95 }}>
                        <Delete size={20} />
                    </CalcButton>
                    <CalcButton $type="action" onClick={() => handleInput('%')} whileTap={{ scale: 0.95 }}>
                        <Percent size={20} />
                    </CalcButton>
                    <CalcButton $type="op" onClick={() => handleInput('÷')} whileTap={{ scale: 0.95 }}>
                        <Divide size={22} />
                    </CalcButton>

                    {[7, 8, 9].map(num => (
                        <CalcButton key={num} onClick={() => handleInput(num)} whileTap={{ scale: 0.95 }}>
                            {num}
                        </CalcButton>
                    ))}
                    <CalcButton $type="op" onClick={() => handleInput('×')} whileTap={{ scale: 0.95 }}>
                        <X size={22} />
                    </CalcButton>

                    {[4, 5, 6].map(num => (
                        <CalcButton key={num} onClick={() => handleInput(num)} whileTap={{ scale: 0.95 }}>
                            {num}
                        </CalcButton>
                    ))}
                    <CalcButton $type="op" onClick={() => handleInput('-')} whileTap={{ scale: 0.95 }}>
                        <Minus size={22} />
                    </CalcButton>

                    {[1, 2, 3].map(num => (
                        <CalcButton key={num} onClick={() => handleInput(num)} whileTap={{ scale: 0.95 }}>
                            {num}
                        </CalcButton>
                    ))}
                    <CalcButton $type="op" onClick={() => handleInput('+')} whileTap={{ scale: 0.95 }}>
                        <Plus size={22} />
                    </CalcButton>

                    <CalcButton $wide onClick={() => handleInput(0)} whileTap={{ scale: 0.95 }}>
                        0
                    </CalcButton>
                    <CalcButton onClick={() => handleInput('.')} whileTap={{ scale: 0.95 }}>
                        .
                    </CalcButton>
                    <CalcButton $equal onClick={() => handleInput('=')} whileTap={{ scale: 0.95 }}>
                        <Equal size={26} />
                    </CalcButton>
                </Keypad>
            </CalcContainer>
        </Layout>
    );
};

export default Calculator;
