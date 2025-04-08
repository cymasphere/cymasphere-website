import Link from "next/link";

export default function NotFound() {
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
          color: "var(--primary)",
        }}
      >
        404
      </h1>
      <h2
        style={{
          fontSize: "2rem",
          marginBottom: "2rem",
          color: "var(--text)",
        }}
      >
        Page Not Found
      </h2>
      <p
        style={{
          fontSize: "1.2rem",
          marginBottom: "2rem",
          maxWidth: "600px",
          color: "var(--text-secondary)",
        }}
      >
        Oops! The page you are looking for might have been removed, had its name
        changed, or is temporarily unavailable.
      </p>
      <Link
        href="/"
        style={{
          backgroundColor: "var(--primary)",
          color: "white",
          padding: "0.8rem 1.5rem",
          borderRadius: "4px",
          fontWeight: "600",
          transition: "all 0.2s ease",
        }}
      >
        Return to Home
      </Link>
    </div>
  );
}
