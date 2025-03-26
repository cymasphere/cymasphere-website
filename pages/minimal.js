import React from 'react';
import Head from 'next/head';

export default function MinimalPage() {
  return (
    <>
      <Head>
        <title>Cymasphere - Minimal Page</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '100vh',
        backgroundColor: '#121212',
        color: 'white',
        padding: '2rem',
        textAlign: 'center'
      }}>
        <h1 style={{ 
          fontSize: '2.5rem', 
          marginBottom: '1.5rem',
          background: 'linear-gradient(90deg, #6c63ff, #4ecdc4)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          display: 'inline-block'
        }}>
          Cymasphere - Next.js Integration
        </h1>
        <p style={{ 
          fontSize: '1.2rem', 
          maxWidth: '600px', 
          marginBottom: '2rem',
          color: 'rgba(255, 255, 255, 0.8)'
        }}>
          This minimal page demonstrates basic Next.js functionality with inline styles and no problematic components.
        </p>
        <a 
          href="/"
          style={{
            background: 'linear-gradient(90deg, #6c63ff, #4ecdc4)',
            color: 'white',
            padding: '0.8rem 1.5rem',
            borderRadius: '30px',
            textDecoration: 'none',
            fontWeight: '500',
            fontSize: '1rem',
            transition: 'all 0.3s ease'
          }}
        >
          Return Home
        </a>
      </div>
    </>
  );
} 