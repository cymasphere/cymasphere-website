"use client";

import React, { Suspense } from "react";
import { useRouter } from 'next/navigation';
import Home from '../(root)/page';
import { motion } from 'framer-motion';

// Loading fallback component
const Loading = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      background: 'var(--background)'
    }}
  >
    <div style={{ textAlign: 'center' }}>
      <div 
        style={{ 
          width: '50px', 
          height: '50px', 
          border: '4px solid rgba(0, 0, 0, 0.1)', 
          borderLeft: '4px solid var(--primary)',
          borderRadius: '50%',
          margin: '0 auto 1rem',
          animation: 'spin 1s linear infinite'
        }} 
      />
      <p>Loading...</p>
    </div>
  </motion.div>
);

export default function LocalizedHomePage({ params }: { params: { locale: string } }) {
  return (
    <Suspense fallback={<Loading />}>
      <Home />
    </Suspense>
  );
}

// Add CSS for the spinner animation
const spinnerStyle = `
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
`;

// Add the style to the document
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.innerHTML = spinnerStyle;
  document.head.appendChild(style);
} 