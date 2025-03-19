import React from 'react';

const StopButton = ({ onStop }) => {
  return (
    <button
      onClick={(e) => onStop(e)}
      style={{
        padding: '8px 15px',
        borderRadius: '4px',
        backgroundColor: '#FF3366',
        color: 'white',
        border: 'none',
        cursor: 'pointer',
        fontWeight: 'bold',
        fontSize: '1rem',
        boxShadow: '0 2px 4px rgba(255, 51, 102, 0.3)',
        transition: 'all 0.2s ease',
        display: 'flex',
        alignItems: 'center',
        gap: '5px',
        minWidth: '100px',
        justifyContent: 'center'
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.backgroundColor = '#FF4D7F';
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 6px 12px rgba(255, 51, 102, 0.4)';
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.backgroundColor = '#FF3366';
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 2px 4px rgba(255, 51, 102, 0.3)';
      }}
    >
      <span style={{ fontSize: '0.8rem' }}>■</span> Stop
    </button>
  );
};

export default StopButton; 