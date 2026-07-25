/**
 * @fileoverview Modal to preview and copy text from support attachments (crash zips / logs).
 * @module components/admin/SupportAttachmentTextPreview
 */

"use client";

import React, { useCallback, useEffect, useState } from "react";
import styled, { keyframes } from "styled-components";
import { FaCopy, FaCheck, FaTimes, FaSpinner } from "react-icons/fa";
import { getSupportAttachmentTextPreview } from "@/app/actions/user-management";
import { isPreviewableSupportAttachment } from "@/lib/support/extract-attachment-text";

type PreviewFile = { name: string; text: string };

type SupportAttachmentTextPreviewProps = {
  attachmentId: string;
  fileName: string;
  onClose: () => void;
};

const spin = keyframes`
  to {
    transform: rotate(360deg);
  }
`;

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.65);
  z-index: 10050;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
`;

const Modal = styled.div`
  width: min(920px, 100%);
  max-height: min(85vh, 900px);
  background: var(--card-bg, #1a1a1f);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.45);
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
`;

const Title = styled.h3`
  margin: 0;
  font-size: 1.05rem;
  color: var(--text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
`;

const Button = styled.button<{ $variant?: "primary" | "ghost" }>`
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  border: 1px solid
    ${(p) =>
      p.$variant === "primary" ? "transparent" : "rgba(255, 255, 255, 0.15)"};
  background: ${(p) =>
    p.$variant === "primary"
      ? "linear-gradient(90deg, var(--primary), var(--accent))"
      : "transparent"};
  color: ${(p) => (p.$variant === "primary" ? "#fff" : "var(--text)")};
  border-radius: 8px;
  padding: 0.45rem 0.75rem;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
`;

const Tabs = styled.div`
  display: flex;
  gap: 0.35rem;
  padding: 0.65rem 1.25rem 0;
  overflow-x: auto;
`;

const Tab = styled.button<{ $active: boolean }>`
  border: 1px solid
    ${(p) =>
      p.$active ? "rgba(108, 99, 255, 0.6)" : "rgba(255, 255, 255, 0.1)"};
  background: ${(p) =>
    p.$active ? "rgba(108, 99, 255, 0.2)" : "transparent"};
  color: var(--text);
  border-radius: 999px;
  padding: 0.3rem 0.7rem;
  font-size: 0.75rem;
  white-space: nowrap;
  cursor: pointer;
`;

const Body = styled.pre`
  margin: 0.75rem 1.25rem 1.25rem;
  padding: 1rem;
  flex: 1;
  min-height: 240px;
  overflow: auto;
  background: rgba(0, 0, 0, 0.35);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 8px;
  color: #e8e8ec;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.78rem;
  line-height: 1.45;
  white-space: pre-wrap;
  word-break: break-word;
`;

const Status = styled.div`
  padding: 2rem 1.25rem;
  text-align: center;
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
`;

const Spinner = styled(FaSpinner)`
  animation: ${spin} 0.8s linear infinite;
`;

/**
 * @brief Whether the attachment should show a Preview / Copy control.
 * @param fileName Attachment file name.
 * @param fileType MIME type.
 * @param attachmentType Stored attachment type.
 * @returns True when text or zip preview is supported.
 */
export function canPreviewSupportAttachmentText(
  fileName: string,
  fileType?: string | null,
  attachmentType?: string | null
): boolean {
  return isPreviewableSupportAttachment(
    fileName,
    fileType || "",
    attachmentType
  );
}

/**
 * @brief Loads attachment text (including zip contents) and offers copy-to-clipboard.
 * @param props.attachmentId support_attachments id.
 * @param props.fileName Display name.
 * @param props.onClose Close handler.
 */
export default function SupportAttachmentTextPreview({
  attachmentId,
  fileName,
  onClose,
}: SupportAttachmentTextPreviewProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [files, setFiles] = useState<PreviewFile[]>([]);
  const [combined, setCombined] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      const result = await getSupportAttachmentTextPreview(attachmentId);
      if (cancelled) return;
      if (!result.success || !result.files?.length) {
        setError(result.error || "No readable text found");
        setLoading(false);
        return;
      }
      setFiles(result.files);
      setCombined(
        result.combined || result.files.map((f) => f.text).join("\n\n")
      );
      setActiveIndex(0);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [attachmentId]);

  const copyText = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setError("Could not copy to clipboard");
    }
  }, []);

  const activeText = files[activeIndex]?.text || "";

  return (
    <Overlay
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="presentation"
    >
      <Modal role="dialog" aria-modal="true" aria-label={`Preview ${fileName}`}>
        <Header>
          <Title title={fileName}>{fileName}</Title>
          <HeaderActions>
            <Button
              type="button"
              $variant="primary"
              disabled={loading || !combined}
              onClick={() => copyText(files.length > 1 ? combined : activeText)}
            >
              {copied ? <FaCheck /> : <FaCopy />}
              {copied ? "Copied" : files.length > 1 ? "Copy all" : "Copy"}
            </Button>
            {files.length > 1 && activeText ? (
              <Button
                type="button"
                disabled={loading}
                onClick={() => copyText(activeText)}
              >
                <FaCopy />
                Copy file
              </Button>
            ) : null}
            <Button type="button" onClick={onClose} aria-label="Close">
              <FaTimes />
            </Button>
          </HeaderActions>
        </Header>

        {loading ? (
          <Status>
            <Spinner />
            Extracting report…
          </Status>
        ) : error ? (
          <Status>{error}</Status>
        ) : (
          <>
            {files.length > 1 ? (
              <Tabs>
                {files.map((file, index) => (
                  <Tab
                    key={`${file.name}-${index}`}
                    type="button"
                    $active={index === activeIndex}
                    onClick={() => setActiveIndex(index)}
                  >
                    {file.name.split("/").pop()}
                  </Tab>
                ))}
              </Tabs>
            ) : null}
            <Body>{activeText}</Body>
          </>
        )}
      </Modal>
    </Overlay>
  );
}
