import Link from "next/link";

export const metadata = {
  title: "Page Not Found - Cymasphere",
  description: "The page you are looking for does not exist",
};

export default function Custom404() {
  const styles = {
    notFoundContainer: {
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
      color: "var(--primary)",
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
    <div style={styles.notFoundContainer}>
      <h1 style={styles.title}>404</h1>
      <h2 style={styles.subtitle}>Page Not Found</h2>
      <p style={styles.description}>
        Oops! The page you are looking for might have been removed, had its name
        changed, or is temporarily unavailable.
      </p>
      <Link href="/" style={styles.homeButton}>
        Return to Home
      </Link>
    </div>
  );
}
