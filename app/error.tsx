"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
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
        backgroundColor: "var(--background)",
      }}
    >
      <h1
        style={{
          fontSize: "6rem",
          marginBottom: "1rem",
          color: "var(--error)",
        }}
      >
        Error
      </h1>
      <h2
        style={{
          fontSize: "2rem",
          marginBottom: "2rem",
          color: "var(--text)",
        }}
      >
        Something went wrong
      </h2>
      <p
        style={{
          fontSize: "1.2rem",
          marginBottom: "2rem",
          maxWidth: "600px",
          color: "var(--text-secondary)",
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
            backgroundColor: "var(--primary)",
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
        <Link
          href="/"
          style={{
            backgroundColor: "transparent",
            color: "var(--text)",
            padding: "0.8rem 1.5rem",
            borderRadius: "4px",
            fontWeight: "600",
            transition: "all 0.2s ease",
            border: "1px solid var(--border)",
          }}
        >
          Return to Home
        </Link>
      </div>
    </div>
  );
}
