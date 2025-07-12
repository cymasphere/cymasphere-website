import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();

  // Get authenticated user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      {
        error: "Authentication required",
      },
      { status: 401 }
    );
  }

  // Check if user is admin
  const { data: adminCheck } = await supabase
    .from("admins")
    .select("*")
    .eq("user", user.id)
    .single();

  if (!adminCheck) {
    return NextResponse.json(
      {
        error: "Admin access required",
      },
      { status: 403 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "all";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = (page - 1) * limit;

    // Build query for subscribers
    let subscribersQuery = supabase
      .from("subscribers")
      .select("id, email, status, created_at, user_id", { count: "exact" });

    // Apply status filter if not 'all'
    if (
      status !== "all" &&
      ["active", "unsubscribed", "bounced", "pending"].includes(status)
    ) {
      subscribersQuery = subscribersQuery.eq(
        "status",
        status as "active" | "unsubscribed" | "bounced" | "pending"
      );
    }

    // For search, we need to handle it differently since we need to search across profiles too
    if (search && search.length >= 2) {
      // First get all subscribers that match email
      const emailMatches = await supabase
        .from("subscribers")
        .select("id")
        .ilike("email", `%${search}%`);

      // Then get subscribers whose profiles match first/last name
      const profileMatches = await supabase
        .from("profiles")
        .select("id")
        .or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%`);

      const profileUserIds = profileMatches.data?.map((p) => p.id) || [];

      // Get subscriber IDs that match profile user_ids
      const profileSubscriberMatches =
        profileUserIds.length > 0
          ? await supabase
              .from("subscribers")
              .select("id")
              .in("user_id", profileUserIds)
          : { data: [] };

      // Combine all matching IDs
      const allMatchingIds = [
        ...(emailMatches.data?.map((s) => s.id) || []),
        ...(profileSubscriberMatches.data?.map((s) => s.id) || []),
      ];

      if (allMatchingIds.length > 0) {
        subscribersQuery = subscribersQuery.in("id", allMatchingIds);
      } else {
        // No matches found, return empty result
        subscribersQuery = subscribersQuery.eq("id", "no-match-placeholder");
      }
    }

    // Apply pagination and ordering
    subscribersQuery = subscribersQuery
      .range(offset, offset + limit - 1)
      .order("created_at", { ascending: false });

    const {
      data: subscribers,
      error: subscribersError,
      count,
    } = await subscribersQuery;

    if (subscribersError) {
      console.error("Error fetching subscribers:", subscribersError);
      return NextResponse.json(
        {
          error: "Failed to fetch subscribers",
        },
        { status: 500 }
      );
    }

    // Get stats for all subscribers
    const { data: statsData } = await supabase
      .from("subscribers")
      .select("status")
      .neq("status", null);

    const stats = {
      total: count || 0,
      active: statsData?.filter((s) => s.status === "active").length || 0,
      unsubscribed:
        statsData?.filter((s) => s.status === "unsubscribed").length || 0,
      bounced: statsData?.filter((s) => s.status === "bounced").length || 0,
      pending: statsData?.filter((s) => s.status === "pending").length || 0,
      highEngagement: Math.floor(
        (statsData?.filter((s) => s.status === "active").length || 0) * 0.3
      ), // Mock high engagement
      growthRate: "12%", // Mock growth rate
    };

    // Get profile data for subscribers to include names
    const userIds =
      subscribers
        ?.filter((s) => s.user_id)
        .map((s) => s.user_id!)
        .filter(Boolean) || [];
    const profilesMap = new Map();

    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, first_name, last_name")
        .in("id", userIds);

      profiles?.forEach((profile) => {
        profilesMap.set(profile.id, profile);
      });
    }

    // Transform subscribers to include names and mock engagement data
    const transformedSubscribers = (subscribers || []).map((subscriber) => {
      const profile = profilesMap.get(subscriber.user_id) || {};
      const firstName = profile.first_name || "";
      const lastName = profile.last_name || "";
      const fullName =
        [firstName, lastName].filter(Boolean).join(" ") ||
        subscriber.email.split("@")[0];

      return {
        id: subscriber.id,
        email: subscriber.email,
        name: fullName,
        first_name: firstName,
        last_name: lastName,
        status: subscriber.status,
        subscribeDate: subscriber.created_at,
        lastActivity: subscriber.created_at,
        engagement:
          Math.random() > 0.5 ? "High" : Math.random() > 0.5 ? "Medium" : "Low",
        totalOpens: Math.floor(Math.random() * 50),
        totalClicks: Math.floor(Math.random() * 20),
        tags: ["Email", "Newsletter"], // Mock tags
      };
    });

    const totalPages = Math.ceil((count || 0) / limit);

    return NextResponse.json({
      subscribers: transformedSubscribers,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages,
      },
      stats,
    });
  } catch (error) {
    console.error("Search subscribers API error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  // Check if user is authenticated and is admin
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check if user is admin - REQUIRED for email campaigns access
  const { data: adminCheck } = await supabase
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

  try {
    const body = await request.json();
    const { email, tags, metadata } = body;

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Create subscriber in the database
    const subscriberId = crypto.randomUUID();
    const { data: newSubscriber, error: createError } = await supabase
      .from("subscribers")
      .insert({
        id: subscriberId,
        email,
        status: "active",
        source: "manual",
        tags: tags || [],
        metadata: metadata || {},
      })
      .select()
      .single();

    if (createError) {
      console.error("Failed to create subscriber:", createError);
      return NextResponse.json(
        { error: "Failed to create subscriber" },
        { status: 500 }
      );
    }

    return NextResponse.json({ subscriber: newSubscriber }, { status: 201 });
  } catch (error) {
    console.error("Unexpected error in subscribers POST:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
