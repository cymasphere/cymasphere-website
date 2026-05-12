/**
 * @fileoverview Nightly approval-cron for affiliate commissions.
 *
 * Promotes commissions from `pending` to `approved` once their
 * `approve_at` timestamp has elapsed AND the row has not been voided
 * by a refund/dispute event. Commissions in `void` or `refunded` are
 * skipped — they never become approved.
 *
 * Triggered by the Vercel cron schedule in `vercel.json`. Manual
 * triggers must supply `Authorization: Bearer ${CRON_SECRET}`.
 *
 * @module api/affiliates/approve-commissions
 */

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServiceRole } from "@/utils/supabase/service";

/**
 * @brief Authorize the caller as a cron-job invoker.
 *
 * Accepts Vercel's `x-vercel-cron-signature` header (set automatically
 * by Vercel's scheduler) OR an `Authorization: Bearer <CRON_SECRET>`
 * header for manual / local invocation. Returns null on success,
 * a NextResponse with 401 otherwise.
 */
function authorizeCron(request: NextRequest): NextResponse | null {
  const vercelSig = request.headers.get("x-vercel-cron-signature");
  if (vercelSig) return null;

  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  if (cronSecret && authHeader === `Bearer ${cronSecret}`) return null;

  // In development we allow unauthenticated calls (matches the pattern
  // used in other crons in this codebase).
  if (!cronSecret) return null;

  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

/**
 * @brief POST handler for the approval cron.
 *
 * Promotes eligible `pending` commissions to `approved`. Returns the
 * number of rows promoted so the cron log shows real activity.
 */
export async function POST(request: NextRequest) {
  const unauthorized = authorizeCron(request);
  if (unauthorized) return unauthorized;

  return runApprovalSweep();
}

/**
 * @brief GET handler — convenience for Vercel cron, which issues GET by default.
 */
export async function GET(request: NextRequest) {
  const unauthorized = authorizeCron(request);
  if (unauthorized) return unauthorized;

  return runApprovalSweep();
}

/**
 * @brief Run the actual promotion sweep against the database.
 *
 * Selects up to 1000 due-pending rows then updates them in a single
 * batch. Returns the count of rows promoted. We cap the batch so a
 * single cron execution never spirals on a huge backlog — the next
 * scheduled run will pick up the rest.
 */
async function runApprovalSweep(): Promise<NextResponse> {
  try {
    const supabase = await createSupabaseServiceRole();
    const nowIso = new Date().toISOString();

    const { data: due, error: selectErr } = await supabase
      .from("affiliate_commissions")
      .select("id")
      .eq("status", "pending")
      .lte("approve_at", nowIso)
      .limit(1000);

    if (selectErr) {
      console.error(
        "[affiliates/approve-commissions] select failed:",
        selectErr,
      );
      return NextResponse.json(
        { error: "DB select failed", details: selectErr.message },
        { status: 500 },
      );
    }

    if (!due || due.length === 0) {
      return NextResponse.json({ success: true, promoted: 0 });
    }

    const ids = due.map((r) => r.id);
    const { error: updateErr, count } = await supabase
      .from("affiliate_commissions")
      .update({ status: "approved" }, { count: "exact" })
      .in("id", ids)
      .eq("status", "pending");

    if (updateErr) {
      console.error(
        "[affiliates/approve-commissions] update failed:",
        updateErr,
      );
      return NextResponse.json(
        { error: "DB update failed", details: updateErr.message },
        { status: 500 },
      );
    }

    const promoted = count ?? ids.length;
    console.log(
      `[affiliates/approve-commissions] Promoted ${promoted} commissions to approved`,
    );
    return NextResponse.json({ success: true, promoted });
  } catch (err) {
    console.error("[affiliates/approve-commissions] error:", err);
    return NextResponse.json(
      {
        error: "Internal error",
        details: err instanceof Error ? err.message : "Unknown",
      },
      { status: 500 },
    );
  }
}
