"use client";

import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import { Loader2 } from "lucide-react";
import styles from "./patch-notes.module.css";

const PatchNotesPage = () => {
  const [patchNotes, setPatchNotes] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPatchNotes = async () => {
      try {
        const response = await fetch(
          "https://jibirpbauzqhdiwjlrmf.supabase.co/storage/v1/object/public/builds//patch_notes.md",
          { cache: "no-store" } // Ensure we get the latest version
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch patch notes: ${response.status}`);
        }

        const text = await response.text();
        setPatchNotes(text);
      } catch (err) {
        console.error("Error fetching patch notes:", err);
        setError(
          "Unable to fetch patch notes. Please check your connection and try again later."
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchPatchNotes();
  }, []);

  return (
    <div className={styles.container}>
      {isLoading && (
        <div className={styles.loadingContainer}>
          <Loader2 className={styles.loadingSpinner} />
          <p>Loading patch notes...</p>
        </div>
      )}

      {error && (
        <div className={styles.errorContainer}>
          <p className={styles.errorMessage}>{error}</p>
        </div>
      )}

      {patchNotes && (
        <div className={styles.markdownContainer}>
          <div className={styles.markdown}>
            <ReactMarkdown rehypePlugins={[rehypeSanitize]}>
              {patchNotes}
            </ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatchNotesPage;
