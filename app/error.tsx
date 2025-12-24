/**
 * @fileoverview Error boundary component for handling application errors.
 * @module app/error
 * @description Displays a user-friendly error page when an error occurs in the application.
 * Provides options to retry or return to the homepage.
 */

"use client";

import { useEffect } from "react";
import Link from "next/link";

/**
 * @brief Error boundary component.
 * @description Displays an error page with retry and home navigation options.
 * Logs errors to the console for debugging.
 * @param {Object} props - Component props.
 * @param {Error & { digest?: string }} props.error - The error object that triggered the boundary.
 * @param {Function} props.reset - Function to reset the error state and retry rendering.
 * @returns {JSX.Element} Error page UI.
 * @note Automatically logs errors to console on mount.
 */
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
