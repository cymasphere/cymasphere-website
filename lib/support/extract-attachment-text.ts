/**
 * @fileoverview Extract readable text from support attachments (plain text or zip).
 * @module lib/support/extract-attachment-text
 */

import { unzipSync, strFromU8 } from "fflate";

export type ExtractedTextFile = {
  /** Path or file name within the attachment (zip entry or original name). */
  name: string;
  /** UTF-8 text content (may be truncated). */
  text: string;
};

export type ExtractAttachmentTextResult = {
  files: ExtractedTextFile[];
  /** All extracted files joined for one-click copy. */
  combined: string;
};

const MAX_TOTAL_CHARS = 400_000;
const MAX_FILE_CHARS = 200_000;
const TEXT_NAME_RE =
  /\.(txt|log|md|json|stack|crash|xml|csv|yml|yaml|ini|conf|plist)$/i;
const PREFERRED_NAME_RE = /(stack|trace|crash|exception|error|report|log)/i;

/**
 * @brief Returns true when a file name looks like plain text worth extracting.
 * @param name File or zip entry name.
 */
function looksLikeTextName(name: string): boolean {
  const base = name.split("/").pop() || name;
  if (base.startsWith(".")) return false;
  if (TEXT_NAME_RE.test(base)) return true;
  // Extensionless small dump names often used for stacks
  if (!base.includes(".") && PREFERRED_NAME_RE.test(base)) return true;
  return false;
}

/**
 * @brief Heuristic: buffer looks like UTF-8/ASCII text (not binary).
 * @param bytes File bytes.
 */
function looksLikeTextBytes(bytes: Uint8Array): boolean {
  if (bytes.length === 0) return false;
  const sample = bytes.subarray(0, Math.min(bytes.length, 1024));
  let suspicious = 0;
  for (let i = 0; i < sample.length; i++) {
    const b = sample[i];
    if (b === 0) return false;
    if (b < 7 || (b > 14 && b < 32 && b !== 9 && b !== 10 && b !== 13)) {
      suspicious++;
    }
  }
  return suspicious / sample.length < 0.1;
}

/**
 * @brief Decode bytes as UTF-8 and optionally truncate.
 * @param bytes Source bytes.
 * @param maxChars Max characters to keep.
 */
function decodeTruncated(bytes: Uint8Array, maxChars: number): string {
  const text = new TextDecoder("utf-8", { fatal: false }).decode(bytes);
  if (text.length <= maxChars) return text;
  return `${text.slice(0, maxChars)}\n\n…[truncated]`;
}

/**
 * @brief Score zip entries so stack/crash logs float to the top.
 * @param name Entry path.
 */
function preferenceScore(name: string): number {
  const base = name.split("/").pop() || name;
  let score = 0;
  if (PREFERRED_NAME_RE.test(base)) score += 10;
  if (/\.(txt|log|stack|crash)$/i.test(base)) score += 5;
  if (base.toLowerCase().includes("stack")) score += 5;
  return score;
}

/**
 * @brief Extract readable text from a support attachment buffer.
 * @param fileName Original attachment file name.
 * @param mimeType MIME type if known.
 * @param bytes Raw file bytes.
 * @returns Extracted text files plus a combined copy payload.
 * @example
 * const result = extractAttachmentText("crash-report.zip", "application/zip", bytes);
 * navigator.clipboard.writeText(result.combined);
 */
export function extractAttachmentText(
  fileName: string,
  mimeType: string,
  bytes: Uint8Array
): ExtractAttachmentTextResult {
  const lowerName = fileName.toLowerCase();
  const isZip =
    lowerName.endsWith(".zip") ||
    mimeType.includes("zip") ||
    mimeType === "application/x-zip-compressed";

  if (!isZip) {
    if (!looksLikeTextName(fileName) && !looksLikeTextBytes(bytes)) {
      return { files: [], combined: "" };
    }
    const text = decodeTruncated(bytes, MAX_FILE_CHARS);
    return {
      files: [{ name: fileName, text }],
      combined: text,
    };
  }

  let entries: Record<string, Uint8Array>;
  try {
    entries = unzipSync(bytes);
  } catch (error) {
    console.error("[extractAttachmentText] unzip failed:", error);
    return { files: [], combined: "" };
  }

  const candidates = Object.entries(entries)
    .filter(([name, data]) => {
      if (name.endsWith("/")) return false;
      if (data.length === 0 || data.length > 5_000_000) return false;
      return looksLikeTextName(name) || looksLikeTextBytes(data);
    })
    .sort((a, b) => preferenceScore(b[0]) - preferenceScore(a[0]));

  const files: ExtractedTextFile[] = [];
  let total = 0;
  for (const [name, data] of candidates) {
    if (total >= MAX_TOTAL_CHARS) break;
    const remaining = MAX_TOTAL_CHARS - total;
    let text: string;
    try {
      text = strFromU8(data, true);
    } catch {
      text = decodeTruncated(data, Math.min(MAX_FILE_CHARS, remaining));
    }
    if (text.length > Math.min(MAX_FILE_CHARS, remaining)) {
      text = `${text.slice(0, Math.min(MAX_FILE_CHARS, remaining))}\n\n…[truncated]`;
    }
    files.push({ name, text });
    total += text.length;
  }

  const combined = files
    .map((f) => `===== ${f.name} =====\n${f.text}`)
    .join("\n\n");

  return { files, combined };
}

/**
 * @brief Whether an attachment should offer an inline text/crash preview.
 * @param fileName Attachment file name.
 * @param mimeType Attachment MIME type.
 * @param attachmentType Stored attachment_type enum value.
 */
export function isPreviewableSupportAttachment(
  fileName: string,
  mimeType: string,
  attachmentType?: string | null
): boolean {
  const lower = fileName.toLowerCase();
  if (lower.endsWith(".zip") || mimeType.includes("zip")) return true;
  if (looksLikeTextName(fileName)) return true;
  if (
    attachmentType === "document" &&
    (lower.includes("crash") || lower.includes("log") || lower.includes("stack"))
  ) {
    return true;
  }
  return false;
}
