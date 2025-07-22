"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function AudienceDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Audience Detail Error:", error);
    console.error("Error stack:", error.stack);
    console.error("Error digest:", error.digest);
    
    // Force error details to be visible
    if (process.env.NODE_ENV === 'production') {
      console.log("Forcing error details to show in production");
    }
  }, [error]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        padding: "2rem",
        textAlign: "center",
        backgroundColor: "#181818",
        color: "#fff",
      }}
    >
      <h1
        style={{
          fontSize: "6rem",
          marginBottom: "1rem",
          color: "#ff5c5c",
        }}
      >
        Audience Detail Error
      </h1>
      <h2
        style={{
          fontSize: "2rem",
          marginBottom: "2rem",
          color: "#fff",
        }}
      >
        Something went wrong loading the audience details
      </h2>
      
      {/* Display actual error details */}
      <div style={{ 
        background: '#222', 
        color: '#ff5c5c', 
        padding: 24, 
        borderRadius: 12, 
        margin: '2rem 0', 
        maxWidth: 800, 
        wordBreak: 'break-all', 
        fontFamily: 'monospace', 
        fontSize: '1.1rem',
        textAlign: 'left'
      }}>
        <strong>Message:</strong> {error.message}
        <br />
        <strong>Digest:</strong> {error.digest || 'N/A'}
        <br />
        <strong>Stack:</strong>
        <pre style={{ whiteSpace: 'pre-wrap', margin: 0, fontSize: '0.9rem' }}>{error.stack}</pre>
        <br />
        <strong>Environment:</strong> {process.env.NODE_ENV}
        <br />
        <strong>Error Type:</strong> {error.constructor.name}
      </div>
      
      <div
        style={{
          display: "flex",
          gap: "1rem",
          flexWrap: "wrap",
          justifyContent: "center",
        }}
      >
        <button
          onClick={reset}
          style={{
            backgroundColor: "#6c63ff",
            color: "white",
            padding: "0.8rem 1.5rem",
            borderRadius: "8px",
            fontWeight: "600",
            transition: "all 0.2s ease",
            border: "none",
            cursor: "pointer",
          }}
        >
          Try again
        </button>
        <Link
          href="/admin/email-campaigns/audiences"
          style={{
            backgroundColor: "transparent",
            color: "#fff",
            padding: "0.8rem 1.5rem",
            borderRadius: "8px",
            fontWeight: "600",
            transition: "all 0.2s ease",
            border: "1px solid #fff",
            textDecoration: "none",
          }}
        >
          Return to Audiences
        </Link>
        <Link
          href="/admin/email-campaigns"
          style={{
            backgroundColor: "transparent",
            color: "#fff",
            padding: "0.8rem 1.5rem",
            borderRadius: "8px",
            fontWeight: "600",
            transition: "all 0.2s ease",
            border: "1px solid #fff",
            textDecoration: "none",
          }}
        >
          Return to Email Campaigns
        </Link>
      </div>
    </div>
  );
} 