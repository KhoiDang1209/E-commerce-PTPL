import React from 'react';
import { useNavigate } from 'react-router-dom';

const BackButton = ({ label = 'Back' }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(-1);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      style={{
        padding: '8px 16px',
        borderRadius: '999px',
        border: '1px solid rgba(31, 41, 55, 0.15)',
        background: '#ffffff',
        color: '#111827',
        cursor: 'pointer',
        fontSize: 13,
        fontWeight: 600,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        boxShadow: '0 4px 10px rgba(15, 23, 42, 0.08)',
      }}
    >
      <span style={{ fontSize: 16 }}>←</span>
      <span>{label}</span>
    </button>
  );
};

export default BackButton;


