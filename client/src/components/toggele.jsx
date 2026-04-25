import React from 'react';
import styled from 'styled-components';

const Switch = ({ checked, onChange }) => {
  return (
    <StyledWrapper>
      <label className="switch">
        <input 
          type="checkbox" 
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span className="slider"></span>
      </label>
    </StyledWrapper>
  );
};

const StyledWrapper = styled.div`
  .switch {
    position: relative;
    display: inline-block;
    width: 48px;
    height: 24px;
  }

  .switch input {
    opacity: 0;
    width: 0;
    height: 0;
  }

  .slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: var(--bg-overlay);
    transition: .4s cubic-bezier(0.4, 0, 0.2, 1);
    border-radius: 24px;
    border: 1px solid var(--border);
  }

  .slider:before {
    position: absolute;
    content: "";
    height: 16px;
    width: 16px;
    left: 4px;
    bottom: 3px;
    background-color: var(--text-3);
    transition: .4s cubic-bezier(0.4, 0, 0.2, 1);
    border-radius: 50%;
    box-shadow: var(--shadow-sm);
  }

  input:checked + .slider {
    background-color: var(--accent-dim);
    border-color: var(--accent);
  }

  input:checked + .slider:before {
    transform: translateX(22px);
    background-color: var(--accent);
    box-shadow: 0 0 8px var(--accent-dim);
  }

  .switch:hover .slider {
    border-color: var(--accent-dim);
  }
`;

export default Switch;
