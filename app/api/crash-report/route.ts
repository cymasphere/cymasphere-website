/**
 * @fileoverview Crash report submission API endpoint
 *
 * Accepts multipart form data (message, log, database, crash_report files)
 * from the Cymasphere desktop app after a crash. Creates a support ticket
 * and uploads attachments to Supabase storage. Requires Bearer token auth.
 *
 * @module api/crash-report
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createSupabaseServiceRole } from "@/utils/supabase/service";

const BUCKET_NAME = "support-attachments";
const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB per file
const MAX_TOTAL_BYTES = 50 * 1024 * 1024; // 50 MB total

type AttachmentType =
  | "image"
  | "video"
  | "document"
  | "audio"
  | "other";

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
    fileName.endsWith(".db")
  )
    return "document";
  return "other";
}

/**
 * POST /api/crash-report
 *
 * Creates a support ticket from a desktop crash report with optional
 * attachments (log, database, crash_report files). Requires Bearer token.
 *
 * @param request Multipart form with: message (text), log (file),
 *   database (file, optional), crash_report (file)
 * @returns 200 { success, ticketId, ticket_number } or 4xx/5xx error
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const authHeader = request.headers.get("Authorization");
    const accessToken = authHeader?.startsWith("Bearer ")
      ? authHeader.slice(7)
      : null;

    const {
      data: { user },
      error: authError,
    } = accessToken
      ? await supabase.auth.getUser(accessToken)
      : await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const message = formData.get("message");
    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { success: false, error: "Missing required field: message" },
        { status: 400 }
      );
    }

    const dateStr = new Date().toISOString().slice(0, 10);
    const subject = `Crash Report - ${dateStr}`;

    const { data: ticket, error: ticketError } = await supabase
      .from("support_tickets")
      .insert({
        subject,
        description: message,
        user_id: user.id,
        status: "open",
      })
      .select("id, ticket_number")
      .single();

    if (ticketError || !ticket) {
      console.error("[crash-report] Ticket create error:", ticketError);
      return NextResponse.json(
        {
          success: false,
          error: ticketError?.message ?? "Failed to create support ticket",
        },
        { status: 500 }
      );
    }

    const { data: supportMessage, error: messageError } = await supabase
      .from("support_messages")
      .insert({
        ticket_id: ticket.id,
        user_id: user.id,
        content: message,
        is_admin: false,
      })
      .select("id")
      .single();

    if (messageError || !supportMessage) {
      console.error("[crash-report] Message create error:", messageError);
      return NextResponse.json(
        {
          success: false,
          error: messageError?.message ?? "Failed to create message",
        },
        { status: 500 }
      );
    }

    let totalBytes = 0;
    const files: { name: string; file: File }[] = [];
    const fileKeys = ["log", "database", "crash_report"];
    for (const key of fileKeys) {
      const value = formData.get(key);
      if (value instanceof File && value.size > 0) {
        if (value.size > MAX_FILE_SIZE_BYTES) continue;
        if (totalBytes + value.size > MAX_TOTAL_BYTES) continue;
        totalBytes += value.size;
        files.push({ name: key, file: value });
      }
    }

    const serviceSupabase = await createSupabaseServiceRole();
    if (!serviceSupabase) {
      return NextResponse.json(
        { success: false, error: "Server configuration error" },
        { status: 500 }
      );
    }

    const prefix = `crash-reports/${ticket.id}`;
    for (const { name, file } of files) {
      const ext = file.name.split(".").pop() || "bin";
      const storagePath = `${prefix}/${Date.now()}-${name}.${ext}`;
      const buffer = Buffer.from(await file.arrayBuffer());
      const { error: uploadError } = await serviceSupabase.storage
        .from(BUCKET_NAME)
        .upload(storagePath, buffer, {
          contentType: file.type || "application/octet-stream",
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        console.error("[crash-report] Storage upload error:", uploadError);
        continue;
      }

      const attachmentType = attachmentTypeForFile(file.name, file.type);
      const { error: attachmentError } = await serviceSupabase
        .from("support_attachments")
        .insert({
          message_id: supportMessage.id,
          file_name: file.name,
          file_size: file.size,
          file_type: file.type || "application/octet-stream",
          attachment_type: attachmentType,
          storage_path: storagePath,
        });

      if (attachmentError) {
        console.error("[crash-report] Attachment insert error:", attachmentError);
      }
    }

    return NextResponse.json({
      success: true,
      ticketId: ticket.id,
      ticket_number: ticket.ticket_number,
    });
  } catch (error) {
    console.error("[crash-report] Unexpected error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
