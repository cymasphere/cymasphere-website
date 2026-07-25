/**
 * @fileoverview Admin Analytics tab time-series API.
 * @module api/admin/analytics
 * @note Prefer this Route Handler over a server action — Turbopack was serving
 * stale broken action chunks after refactors, which left the tab empty.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { loadAnalyticsTimeSeries } from "@/lib/admin/load-analytics-time-series";

/**
 * @brief Require the calling user to be in the admins table.
 * @returns True when the session user is an admin.
 */
async function requireAdmin(): Promise<boolean> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return false;

    const { data: adminCheck, error } = await supabase
      .from("admins")
      .select("user")
      .eq("user", user.id)
      .maybeSingle();

    if (error) {
      console.error("[GET /api/admin/analytics] admin check error:", error);
      return false;
    }
    return !!adminCheck;
  } catch (error) {
    console.error("[GET /api/admin/analytics] admin check failed:", error);
    return false;
  }
}

/**
 * @brief GET analytics chart series for the admin dashboard.
 * @param request Next request; query `range` = `month` | `year` (default month).
 * @returns JSON `{ data, error?, warnings? }` with HTTP 200/401/400.
 *
 * 200 OK:
 * ```json
 * { "data": [{ "date": "Jul 25", "users": 8000, "mrr": 374.08 }] }
 * ```
 *
 * 401 Unauthorized:
 * ```json
 * { "data": [], "error": "Unauthorized" }
 * ```
 *
 * 400 Bad Request:
 * ```json
 * { "data": [], "error": "Invalid range" }
 * ```
 */
export async function GET(request: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json(
      { data: [], error: "Unauthorized" },
      { status: 401 }
    );
  }

  const rangeParam = request.nextUrl.searchParams.get("range") || "month";
  if (rangeParam !== "month" && rangeParam !== "year") {
    return NextResponse.json(
      { data: [], error: "Invalid range" },
      { status: 400 }
    );
  }

  const result = await loadAnalyticsTimeSeries(rangeParam);
  const status = result.error ? 500 : 200;
  return NextResponse.json(result, { status });
}
