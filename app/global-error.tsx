"use client";

import React from 'react';

export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <html>
      <body style={{ background: '#181818', color: '#fff', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <h1 style={{ color: '#ff5c5c', fontSize: '5rem', marginBottom: 0 }}>Error</h1>
        <h2 style={{ fontWeight: 700, fontSize: '2.5rem', margin: '1rem 0' }}>Something went wrong</h2>
        <div style={{ background: '#222', color: '#ff5c5c', padding: 24, borderRadius: 12, margin: '2rem 0', maxWidth: 800, wordBreak: 'break-all', fontFamily: 'monospace', fontSize: '1.1rem' }}>
          <strong>Message:</strong> {error.message}
          <br />
          <strong>Stack:</strong>
          <pre style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{error.stack}</pre>
        </div>
        <button onClick={reset} style={{ background: '#6c63ff', color: '#fff', border: 'none', borderRadius: 8, padding: '12px 32px', fontSize: '1.2rem', cursor: 'pointer', marginRight: 16 }}>Try again</button>
        <a href="/" style={{ background: 'none', color: '#fff', border: '1px solid #fff', borderRadius: 8, padding: '12px 32px', fontSize: '1.2rem', textDecoration: 'none', marginLeft: 16 }}>Return to Home</a>
      </body>
    </html>
  );
}
