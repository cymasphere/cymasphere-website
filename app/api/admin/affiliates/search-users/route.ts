/**
 * @fileoverview Admin endpoint for searching users to invite as affiliates.
 *
 * Returns a small list of profiles matching the query string against
 * email / first name / last name. Limited to admin callers and capped
 * at 20 results to keep the dropdown light.
 *
 * @module api/admin/affiliates/search-users
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createSupabaseServiceRole } from "@/utils/supabase/service";

/**
 * @brief GET endpoint to search profiles by email / name.
 *
 * Query params:
 * - q: search string (case-insensitive, at least 2 chars)
 *
 * Responses:
 * - 200 OK: `{ users: [{ id, email, first_name, last_name }] }`
 * - 400 Bad Request: missing/short query
 * - 401/403 Auth
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { data: adminRow } = await supabase
    .from("admins")
    .select("user")
    .eq("user", user.id)
    .maybeSingle();
  if (!adminRow) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) {
    return NextResponse.json({ users: [] });
  }

  const service = await createSupabaseServiceRole();
  const escaped = q.replace(/[%_]/g, (m) => `\\${m}`);
  const like = `%${escaped}%`;

  const { data, error } = await service
    .from("profiles")
    .select("id, email, first_name, last_name")
    .or(
      `email.ilike.${like},first_name.ilike.${like},last_name.ilike.${like}`,
    )
    .limit(20);

  if (error) {
    console.error("[admin/affiliates/search-users] error:", error);
    return NextResponse.json(
      { error: "Search failed" },
      { status: 500 },
    );
  }

  return NextResponse.json({ users: data ?? [] });
}
