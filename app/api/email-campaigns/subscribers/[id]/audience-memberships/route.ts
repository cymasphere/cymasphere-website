import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Authentication required" },
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
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    // Create service role client for admin operations
    const adminSupabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { id: subscriberId } = await params;

    // Get all audiences
    const { data: audiences, error: audiencesError } = await adminSupabase
      .from("email_audiences")
      .select("id, name, filters")
      .order("name");

    if (audiencesError) {
      console.error("Error fetching audiences:", audiencesError);
      return NextResponse.json(
        { error: "Failed to fetch audiences" },
        { status: 500 }
      );
    }

    // Get subscriber data
    const { data: subscriber, error: subscriberError } = await adminSupabase
      .from("subscribers")
      .select("id, email, status, user_id")
      .eq("id", subscriberId)
      .single();

    if (subscriberError || !subscriber) {
      return NextResponse.json(
        { error: "Subscriber not found" },
        { status: 404 }
      );
    }

    // Get subscriber's profile data if user_id exists
    let profile = null;
    if (subscriber.user_id) {
      const { data: profileData } = await adminSupabase
        .from("profiles")
        .select("subscription, subscription_expiration, trial_expiration")
        .eq("id", subscriber.user_id)
        .single();
      profile = profileData;
    }

    // Check memberships for each audience
    const memberships: { [key: string]: boolean } = {};

    for (const audience of audiences || []) {
      const filters = audience.filters || {};
      const isStatic = filters.audience_type === "static";

      if (isStatic) {
        // For static audiences, check the junction table
        const { data: relation } = await adminSupabase
          .from("email_audience_subscribers")
          .select("id")
          .eq("audience_id", audience.id)
          .eq("subscriber_id", subscriberId)
          .maybeSingle();

        memberships[audience.id] = !!relation;
      } else {
        // For dynamic audiences, evaluate the filters
        const isMember = evaluateDynamicAudienceMembership(subscriber, profile, filters);
        memberships[audience.id] = isMember;
      }
    }

    return NextResponse.json({ memberships });
  } catch (error) {
    console.error("Error checking audience memberships:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

function evaluateDynamicAudienceMembership(subscriber: any, profile: any, filters: any): boolean {
  try {
    const rules = filters.rules || [];
    
    // If no rules, default to false
    if (rules.length === 0) {
      return false;
    }

    // Evaluate each rule - all rules must match (AND logic)
    for (const rule of rules) {
      const matches = evaluateRule(subscriber, profile, rule);
      if (!matches) {
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error("Error evaluating dynamic audience membership:", error);
    return false;
  }
}

function evaluateRule(subscriber: any, profile: any, rule: any): boolean {
  try {
    const { field, operator, value } = rule;

    switch (field) {
      case "status":
        return subscriber.status === value;
      
      case "subscription":
        return profile?.subscription === value;
      
      case "email":
        if (operator === "contains") {
          return subscriber.email.includes(value);
        } else if (operator === "equals") {
          return subscriber.email === value;
        }
        return false;
      
      default:
        console.warn(`Unknown rule field: ${field}`);
        return false;
    }
  } catch (error) {
    console.error("Error evaluating rule:", error);
    return false;
  }
} 