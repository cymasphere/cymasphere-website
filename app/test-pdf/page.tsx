"use client";
import React from 'react';

export default function TestPDF() {
  const handleDownloadPDF = () => {
    // Open the PDF in a new tab
    window.open('/api/quickstart-guide', '_blank');
  };

  return (
    <div style={{ padding: '40px', textAlign: 'center' }}>
      <h1>PDF Test Page</h1>
      <p>Click the button below to test the quickstart guide PDF generation:</p>
      <button 
        onClick={handleDownloadPDF}
        style={{
          background: 'linear-gradient(135deg, #6C63FF, #4ECDCC)',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          padding: '12px 24px',
          fontSize: '16px',
          cursor: 'pointer',
          marginTop: '20px'
        }}
      >
        Download Quickstart Guide PDF
      </button>
    </div>
  );
} 