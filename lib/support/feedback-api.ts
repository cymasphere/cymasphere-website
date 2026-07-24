/**
 * @fileoverview Pure helpers for POST /api/feedback (auth gate + multipart parse).
 * @module lib/support/feedback-api
 */

import type { TicketType } from "@/lib/support/create-typed-support-ticket";

export type FeedbackParseOk = {
  ok: true;
  value: {
    ticketType: TicketType;
    subject: string;
    description: string;
    attachments: {
      fieldName: string;
      fileName: string;
      contentType: string;
      bytes: Uint8Array;
    }[];
  };
};

export type FeedbackParseErr = {
  ok: false;
  status: number;
  error: string;
};

const ALLOWED_TYPES = new Set<TicketType>(["support", "bug", "feature", "crash"]);
const FILE_KEYS = ["database", "log", "crash_report"] as const;
const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024;

/**
 * @brief Maps multipart feedback form into createTypedSupportTicket args.
 */
export async function parseFeedbackForm(
  formData: FormData
): Promise<FeedbackParseOk | FeedbackParseErr> {
  const typeRaw = formData.get("type");
  const type =
    typeof typeRaw === "string" && typeRaw.length > 0 ? typeRaw : "support";

  if (!ALLOWED_TYPES.has(type as TicketType)) {
    return { ok: false, status: 400, error: "Invalid type" };
  }

  const ticketType = type as TicketType;
  let subject =
    typeof formData.get("subject") === "string"
      ? (formData.get("subject") as string).trim()
      : "";
  const description =
    typeof formData.get("description") === "string"
      ? (formData.get("description") as string).trim()
      : typeof formData.get("message") === "string"
        ? (formData.get("message") as string).trim()
        : "";

  if (ticketType === "crash" && !subject) {
    const dateStr = new Date().toISOString().slice(0, 10);
    subject = `Crash Report - ${dateStr}`;
  }

  if (!description) {
    return { ok: false, status: 400, error: "Missing required field: description" };
  }
  if (!subject) {
    return { ok: false, status: 400, error: "Missing required field: subject" };
  }

  const attachments: FeedbackParseOk["value"]["attachments"] = [];
  for (const key of FILE_KEYS) {
    const value = formData.get(key);
    if (value instanceof File && value.size > 0) {
      if (value.size > MAX_FILE_SIZE_BYTES) continue;
      const buffer = new Uint8Array(await value.arrayBuffer());
      attachments.push({
        fieldName: key,
        fileName: value.name || key,
        contentType: value.type || "application/octet-stream",
        bytes: buffer,
      });
    }
  }

  return {
    ok: true,
    value: { ticketType, subject, description, attachments },
  };
}

export type FeedbackAuthOk = { ok: true; user: { id: string } };
export type FeedbackAuthErr = { ok: false; status: 401; error: string };

/**
 * @brief Resolves authenticated user from a supabase.auth-like getUser API.
 */
export async function requireFeedbackUser(auth: {
  getUser: (
    jwt?: string
  ) => Promise<{
    data: { user: { id: string } | null };
    error: { message?: string } | null;
  }>;
}): Promise<FeedbackAuthOk | FeedbackAuthErr> {
  const { data, error } = await auth.getUser();
  if (error || !data.user) {
    return { ok: false, status: 401, error: "Not authenticated" };
  }
  return { ok: true, user: { id: data.user.id } };
}
