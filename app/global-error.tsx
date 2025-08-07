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
    console.error(error);
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
        backgroundColor:
          "#0d0d15" /* Using direct color value as CSS variables may not be available */,
        color: "#ffffff",
      }}
    >
      <h1
        style={{
          fontSize: "6rem",
          marginBottom: "1rem",
          color: "#ff3366" /* Error color */,
        }}
      >
        500
      </h1>
      <h2
        style={{
          fontSize: "2rem",
          marginBottom: "2rem",
          color: "#ffffff",
        }}
      >
        Server Error
      </h2>
      <p
        style={{
          fontSize: "1.2rem",
          marginBottom: "2rem",
          maxWidth: "600px",
          color: "#cccccc",
        }}
      >
        {`Sorry, something went wrong on our server. We're working on fixing
        the issue. Please try again later or contact support if the problem
        persists.`}
      </p>
      <div
        style={{
          display: "flex",
          gap: "1rem",
        }}
      >
        <button
          onClick={reset}
          style={{
            backgroundColor: "#6c63ff" /* Primary color */,
            color: "white",
            padding: "0.8rem 1.5rem",
            borderRadius: "4px",
            fontWeight: "600",
            transition: "all 0.2s ease",
            border: "none",
            cursor: "pointer",
          }}
        >
          Try again
        </button>
        {/* Using standard a tag since Link requires client navigation */}
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a
          href="/"
          style={{
            backgroundColor: "transparent",
            color: "#ffffff",
            padding: "0.8rem 1.5rem",
            borderRadius: "4px",
            fontWeight: "600",
            transition: "all 0.2s ease",
            border: "1px solid #333333",
            textDecoration: "none",
          }}
        >
          Return to Home
        </a>
      </div>
    </div>
  );
}
