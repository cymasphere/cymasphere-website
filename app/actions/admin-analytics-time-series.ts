/**
 * @fileoverview Server action wrapper for admin Analytics time-series.
 * @module app/actions/admin-analytics-time-series
 * @note Prefer `/api/admin/analytics` from the client — this action remains for
 * any residual callers. Implementation lives in lib (not this "use server" file).
 */

"use server";

import { createClient } from "@/utils/supabase/server";
import { loadAnalyticsTimeSeries } from "@/lib/admin/load-analytics-time-series";

/**
 * @brief Require the calling user to be in the admins table.
 */
async function requireAnalyticsAdmin(): Promise<boolean> {
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
      console.error("[getAnalyticsTimeSeries] admin check error:", error);
      return false;
    }
    return !!adminCheck;
  } catch (error) {
    console.error("[getAnalyticsTimeSeries] admin check failed:", error);
    return false;
  }
}

/**
 * @brief Fetches analytics chart series for the admin dashboard.
 * @param timeRange Month (~30d) or year (12 calendar months).
 * @returns Structured result with data and optional error/warnings.
 */
export async function getAnalyticsTimeSeries(timeRange: "month" | "year") {
  if (!(await requireAnalyticsAdmin())) {
    return { data: [], error: "Unauthorized" as const };
  }
  return loadAnalyticsTimeSeries(timeRange);
}
