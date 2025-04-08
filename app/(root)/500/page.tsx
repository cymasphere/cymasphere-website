import Link from "next/link";

export const metadata = {
  title: "Server Error - Cymasphere",
  description: "An error occurred on the server",
};

export default function Custom500() {
  const styles = {
    errorContainer: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "100vh",
      padding: "2rem",
      textAlign: "center",
    } as const,
    title: {
      fontSize: "6rem",
      marginBottom: "1rem",
      color: "var(--error)",
    },
    subtitle: {
      fontSize: "2rem",
      marginBottom: "2rem",
      color: "var(--text)",
    },
    description: {
      fontSize: "1.2rem",
      marginBottom: "2rem",
      maxWidth: "600px",
      color: "var(--text-secondary)",
    },
    homeButton: {
      backgroundColor: "var(--primary)",
      color: "white",
      padding: "0.8rem 1.5rem",
      borderRadius: "4px",
      fontWeight: "600",
      transition: "all 0.2s ease",
    },
  };

  return (
    <div style={styles.errorContainer}>
      <h1 style={styles.title}>500</h1>
      <h2 style={styles.subtitle}>Server Error</h2>
      <p style={styles.description}>
        {`Sorry, something went wrong on our server. We're working on fixing
        the issue. Please try again later or contact support if the problem
        persists.`}
      </p>
      <Link href="/" style={styles.homeButton}>
        Return to Home
      </Link>
    </div>
  );
}
