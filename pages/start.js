import React from 'react';
import Head from 'next/head';
import Link from 'next/link';

export default function StartPage() {
  return (
    <>
      <Head>
        <title>Cymasphere - Next.js Navigation</title>
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
          Cymasphere - Next.js Navigation
        </h1>
        <p style={{ 
          fontSize: '1.2rem', 
          maxWidth: '600px', 
          marginBottom: '2rem',
          color: 'rgba(255, 255, 255, 0.8)'
        }}>
          Choose which version of the site to visit:
        </p>
        
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          width: '100%',
          maxWidth: '400px',
          marginBottom: '2rem'
        }}>
          <Link href="/minimal" passHref legacyBehavior>
            <a style={linkStyle}>
              Minimal Page (No Dependencies)
            </a>
          </Link>
          
          <Link href="/basic" passHref legacyBehavior>
            <a style={linkStyle}>
              Basic Page (Styled-Components)
            </a>
          </Link>
          
          <Link href="/fallback" passHref legacyBehavior>
            <a style={linkStyle}>
              Fallback Page
            </a>
          </Link>
          
          <Link href="/" passHref legacyBehavior>
            <a style={{...linkStyle, background: 'linear-gradient(90deg, #6c63ff, #4ecdc4)'}}>
              Full Landing Page (May Have Issues)
            </a>
          </Link>
        </div>
        
        <p style={{ 
          fontSize: '0.9rem', 
          color: 'rgba(255, 255, 255, 0.5)'
        }}>
          Note: The Next.js integration is in progress. Some pages may experience rendering issues during development.
        </p>
      </div>
    </>
  );
}

const linkStyle = {
  padding: '0.8rem 1rem',
  borderRadius: '8px',
  backgroundColor: 'rgba(108, 99, 255, 0.2)',
  color: 'white',
  textDecoration: 'none',
  textAlign: 'center',
  fontWeight: '500',
  transition: 'all 0.3s ease',
  border: '1px solid rgba(108, 99, 255, 0.3)',
  width: '100%'
}; 