import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createClient as createSupabaseClient } from "@/utils/supabase/server";

export async function GET() {
  // Check authentication first
  const authSupabase = await createSupabaseClient();
  const {
    data: { user },
    error: authError,
  } = await authSupabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check if user is admin
  const { data: adminCheck } = await authSupabase
    .from("admins")
    .select("id")
    .eq("user", user.id)
    .single();

  if (!adminCheck) {
    return NextResponse.json(
      { error: "Forbidden - Admin access required" },
      { status: 403 }
    );
  }

  // Only use service role for admin users
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );

  try {
    // Count users in auth.users
    const { count: userCount, error: userError } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true });

    // Count subscribers
    const { count: subscriberCount, error: subscriberError } = await supabase
      .from("subscribers")
      .select("*", { count: "exact", head: true });

    // Get sample data
    const { data: sampleUsers } = await supabase
      .from("profiles")
      .select("id, first_name, last_name, subscription")
      .limit(5);

    const { data: sampleSubscribers } = await supabase
      .from("subscribers")
      .select("id, email, status, source, user_id")
      .limit(5);

    return NextResponse.json({
      counts: {
        users: userCount || 0,
        subscribers: subscriberCount || 0,
        mismatch: (userCount || 0) !== (subscriberCount || 0),
      },
      errors: {
        userError: userError?.message,
        subscriberError: subscriberError?.message,
      },
      samples: {
        users: sampleUsers,
        subscribers: sampleSubscribers,
      },
    });
  } catch (error) {
    console.error("Debug API error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error },
      { status: 500 }
    );
  }
}
