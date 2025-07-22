"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Global Error:", error);
    console.error("Error stack:", error.stack);
    console.error("Error digest:", error.digest);
    
    // Try to extract more error details
    console.error("Error constructor:", error.constructor.name);
    console.error("Error properties:", Object.getOwnPropertyNames(error));
    console.error("Error prototype:", Object.getPrototypeOf(error));
    
    // Try to access any hidden properties
    const errorAny = error as any;
    console.error("Error cause:", errorAny.cause);
    console.error("Error code:", errorAny.code);
    console.error("Error details:", errorAny.details);
    console.error("Error originalMessage:", errorAny.originalMessage);
    
    // Force error details to be visible
    if (process.env.NODE_ENV === 'production') {
      console.log("Forcing error details to show in production");
    }
  }, [error]);

  // Try to extract the actual error message
  const getActualErrorMessage = () => {
    const errorAny = error as any;
    
    // Try different ways to get the actual error
    if (errorAny.cause?.message) {
      return errorAny.cause.message;
    }
    
    if (errorAny.originalMessage) {
      return errorAny.originalMessage;
    }
    
    if (errorAny.details) {
      return errorAny.details;
    }
    
    // If it's the generic Next.js error, try to extract from the message
    if (error.message.includes("specific message is omitted in production builds")) {
      return "Next.js is hiding the actual error. Check the console for more details or use the error digest to investigate.";
    }
    
    return error.message;
  };

  const actualErrorMessage = getActualErrorMessage();

  return (
    <html>
      <body>
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
            fontFamily: "system-ui, -apple-system, sans-serif",
          }}
        >
          <h1
            style={{
              fontSize: "6rem",
              marginBottom: "1rem",
              color: "#ff5c5c",
            }}
          >
            Global Error
          </h1>
          <h2
            style={{
              fontSize: "2rem",
              marginBottom: "2rem",
              color: "#fff",
            }}
          >
            Something went wrong in the application
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
            <strong>Message:</strong> {actualErrorMessage}
            <br />
            <strong>Digest:</strong> {error.digest || 'N/A'}
            <br />
            <strong>Error Type:</strong> {error.constructor.name}
            <br />
            <strong>Environment:</strong> {process.env.NODE_ENV}
            <br />
            <strong>Stack:</strong>
            <pre style={{ whiteSpace: 'pre-wrap', margin: 0, fontSize: '0.9rem' }}>{error.stack}</pre>
            <br />
            <strong>Additional Info:</strong>
            <pre style={{ whiteSpace: 'pre-wrap', margin: 0, fontSize: '0.9rem', color: '#ffa500' }}>
              {JSON.stringify({
                cause: (error as any).cause,
                code: (error as any).code,
                details: (error as any).details,
                originalMessage: (error as any).originalMessage,
                properties: Object.getOwnPropertyNames(error)
              }, null, 2)}
            </pre>
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
            <button
              onClick={() => window.location.href = '/'}
              style={{
                backgroundColor: "transparent",
                color: "#fff",
                padding: "0.8rem 1.5rem",
                borderRadius: "8px",
                fontWeight: "600",
                transition: "all 0.2s ease",
                border: "1px solid #fff",
                cursor: "pointer",
              }}
            >
              Go to Home
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
