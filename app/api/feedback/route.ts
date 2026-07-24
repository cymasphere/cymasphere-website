/**
 * @fileoverview App feedback submission (bug / feature / crash) → typed support tickets.
 * @module api/feedback
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createSupabaseServiceRole } from "@/utils/supabase/service";
import { createTypedSupportTicket } from "@/lib/support/create-typed-support-ticket";
import {
  parseFeedbackForm,
  requireFeedbackUser,
} from "@/lib/support/feedback-api";

/**
 * POST /api/feedback
 *
 * Multipart: type (bug|feature|crash|support), subject, description|message,
 * optional database/log/crash_report files. Bearer or cookie auth.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const authHeader = request.headers.get("Authorization");
    const accessToken = authHeader?.startsWith("Bearer ")
      ? authHeader.slice(7)
      : null;

    const authApi = {
      getUser: async () => {
        if (accessToken) {
          return supabase.auth.getUser(accessToken);
        }
        return supabase.auth.getUser();
      },
    };

    const auth = await requireFeedbackUser(authApi);
    if (!auth.ok) {
      return NextResponse.json(
        { success: false, error: auth.error },
        { status: auth.status }
      );
    }

    const formData = await request.formData();
    const parsed = await parseFeedbackForm(formData);
    if (!parsed.ok) {
      return NextResponse.json(
        { success: false, error: parsed.error },
        { status: parsed.status }
      );
    }

    const serviceSupabase = await createSupabaseServiceRole();
    if (!serviceSupabase && parsed.value.attachments.length > 0) {
      return NextResponse.json(
        { success: false, error: "Server configuration error" },
        { status: 500 }
      );
    }

    const result = await createTypedSupportTicket({
      supabase,
      serviceSupabase: serviceSupabase ?? undefined,
      userId: auth.user.id,
      subject: parsed.value.subject,
      description: parsed.value.description,
      ticketType: parsed.value.ticketType,
      attachments: parsed.value.attachments,
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      ticketId: result.ticket.id,
      ticket_number: result.ticket.ticket_number,
    });
  } catch (error) {
    console.error("[feedback] Unexpected error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unexpected error",
      },
      { status: 500 }
    );
  }
}
