/**
 * @fileoverview Shared support-ticket creation (typed + optional attachments).
 * @module lib/support/create-typed-support-ticket
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/database.types";

export type TicketType = "support" | "bug" | "feature" | "crash";

export type SupportAttachmentInput = {
  fieldName: string;
  fileName: string;
  contentType: string;
  bytes: Uint8Array;
};

export type CreateTypedSupportTicketInput = {
  /** User-scoped Supabase client (RPC + ticket/message inserts). */
  supabase: SupabaseClient<Database>;
  /** Service-role client for storage + attachment rows (optional if no attachments). */
  serviceSupabase?: SupabaseClient<Database>;
  userId: string;
  subject: string;
  description: string;
  ticketType?: TicketType;
  attachments?: SupportAttachmentInput[];
};

export type CreateTypedSupportTicketResult =
  | {
      success: true;
      ticket: { id: string; ticket_number: string };
    }
  | { success: false; error: string };

const BUCKET_NAME = "support-attachments";

type AttachmentType = "image" | "video" | "document" | "audio" | "other";

function attachmentTypeForFile(
  fileName: string,
  mimeType: string
): AttachmentType {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType.startsWith("audio/")) return "audio";
  if (
    mimeType.includes("text") ||
    fileName.endsWith(".txt") ||
    fileName.endsWith(".log") ||
    fileName.endsWith(".db") ||
    fileName.endsWith(".lz4") ||
    fileName.endsWith(".zip") ||
    mimeType.includes("zip")
  ) {
    return "document";
  }
  return "other";
}

type InsertBuilder = {
  insert: (row: Record<string, unknown>) => InsertBuilder;
  select: (cols: string) => InsertBuilder;
  single: () => Promise<{
    data: Record<string, unknown> | null;
    error: { message?: string; code?: string } | null;
  }>;
};

function asInsertable(client: { from: (t: string) => unknown }, table: string) {
  return client.from(table) as InsertBuilder;
}

/**
 * @brief Creates a typed support ticket, initial message, and optional attachments.
 * Caller owns authentication; this helper does not check auth.
 */
export async function createTypedSupportTicket(
  input: CreateTypedSupportTicketInput
): Promise<CreateTypedSupportTicketResult> {
  const ticketType: TicketType = input.ticketType ?? "support";
  const subject = input.subject?.trim() ?? "";
  const description = input.description?.trim() ?? "";

  if (!subject || !description) {
    return { success: false, error: "All fields are required" };
  }

  const { data: ticketNumber, error: numError } = await input.supabase.rpc(
    "generate_ticket_number"
  );
  if (numError || !ticketNumber || typeof ticketNumber !== "string") {
    return { success: false, error: "Failed to generate ticket number" };
  }

  const { data: ticket, error: ticketError } = await asInsertable(
    input.supabase,
    "support_tickets"
  )
    .insert({
      subject,
      description,
      user_id: input.userId,
      status: "open",
      ticket_number: ticketNumber,
      ticket_type: ticketType,
    })
    .select("id, ticket_number")
    .single();

  if (ticketError || !ticket?.id) {
    return {
      success: false,
      error: ticketError?.message ?? "Failed to create support ticket",
    };
  }

  const ticketId = String(ticket.id);
  const ticketNum = String(ticket.ticket_number ?? ticketNumber);

  const { data: message, error: messageError } = await asInsertable(
    input.supabase,
    "support_messages"
  )
    .insert({
      ticket_id: ticketId,
      user_id: input.userId,
      content: description,
      is_admin: false,
    })
    .select("id")
    .single();

  if (messageError || !message?.id) {
    // Ticket exists; still return success for parity with legacy createSupportTicket
    console.error(
      "[createTypedSupportTicket] Message create error:",
      messageError
    );
    return {
      success: true,
      ticket: { id: ticketId, ticket_number: ticketNum },
    };
  }

  const attachments = input.attachments ?? [];
  if (attachments.length > 0 && !input.serviceSupabase) {
    console.error(
      "[createTypedSupportTicket] Attachments present but serviceSupabase missing"
    );
  }
  if (attachments.length > 0 && input.serviceSupabase) {
    const messageId = String(message.id);
    // Match web uploadSupportTicketAttachment path convention so storage policies
    // and signed-URL helpers that expect support-attachments/… keep working.
    for (const att of attachments) {
      if (!att.bytes?.length) continue;
      const ext = att.fileName.includes(".")
        ? att.fileName.split(".").pop()
        : "bin";
      const storagePath = `support-attachments/feedback-${ticketId}-${Date.now()}-${att.fieldName}.${ext}`;
      const buffer = Buffer.from(att.bytes);

      const { error: uploadError } = await input.serviceSupabase.storage
        .from(BUCKET_NAME)
        .upload(storagePath, buffer, {
          contentType: att.contentType || "application/octet-stream",
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        console.error(
          "[createTypedSupportTicket] Storage upload error:",
          uploadError,
          { storagePath, fieldName: att.fieldName, bytes: att.bytes.length }
        );
        continue;
      }

      const { error: attachmentError } = await asInsertable(
        input.serviceSupabase,
        "support_attachments"
      )
        .insert({
          message_id: messageId,
          file_name: att.fileName,
          file_size: att.bytes.length,
          file_type: att.contentType || "application/octet-stream",
          attachment_type: attachmentTypeForFile(
            att.fileName,
            att.contentType || ""
          ),
          storage_path: storagePath,
        })
        .select("id")
        .single();

      if (attachmentError) {
        console.error(
          "[createTypedSupportTicket] Attachment insert error:",
          attachmentError,
          { storagePath, fieldName: att.fieldName }
        );
      }
    }
  }

  return {
    success: true,
    ticket: { id: ticketId, ticket_number: ticketNum },
  };
}
