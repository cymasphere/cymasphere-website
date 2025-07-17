import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();

  // Check if user is authenticated and is admin
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check if user is admin
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
    const resolvedParams = await params;
    const subscriberId = resolvedParams.id;

    // First, verify the subscriber exists
    const { data: subscriberData, error: subscriberError } = await supabase
      .from("subscribers")
      .select("id")
      .eq("id", subscriberId)
      .single();

    if (subscriberError || !subscriberData) {
      console.error("Failed to fetch subscriber:", subscriberError);
      return NextResponse.json(
        { error: "Subscriber not found" },
        { status: 404 }
      );
    }

    // Get all audiences
    const { data: audiences, error: audiencesError } = await supabase
      .from("email_audiences")
      .select("id, name, description, filters, subscriber_count")
      .order("name");

    if (audiencesError) {
      console.error("Failed to fetch audiences:", audiencesError);
      return NextResponse.json(
        { error: "Failed to fetch audiences" },
        { status: 500 }
      );
    }

    // Get subscriber memberships from the junction table
    const memberships: { [key: string]: boolean } = {};
    
    // Initialize all audiences as false (not a member)
    audiences?.forEach(audience => {
      memberships[audience.id] = false;
    });

    // Get actual memberships from the email_audience_subscribers table
    try {
      const { data: membershipsData, error: membershipsError } = await supabase
        .from("email_audience_subscribers")
        .select("audience_id")
        .eq("subscriber_id", subscriberId);

      if (membershipsError) {
        console.error('Error fetching subscriber memberships:', membershipsError);
        // Don't fail the entire request, just return empty memberships
      } else {
        // Mark audiences as true where the subscriber is a member
        membershipsData?.forEach(membership => {
          if (membership.audience_id) {
            memberships[membership.audience_id] = true;
          }
        });
      }
    } catch (membershipError) {
      console.error('Exception fetching subscriber memberships:', membershipError);
      // Don't fail the entire request, just return empty memberships
    }

    return NextResponse.json({ 
      memberships,
      audiences: audiences || [],
      subscriberId 
    });
  } catch (error) {
    console.error("Unexpected error in subscriber audiences API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();

  // Check if user is authenticated and is admin
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check if user is admin
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
    const resolvedParams = await params;
    const subscriberId = resolvedParams.id;
    const body = await request.json();
    const { memberships } = body;

    // Update memberships in the email_audience_subscribers table
    try {
      // Delete existing memberships for this subscriber
      const { error: deleteError } = await supabase
        .from("email_audience_subscribers")
        .delete()
        .eq("subscriber_id", subscriberId);

      if (deleteError) {
        console.error('Error deleting existing memberships:', deleteError);
        // Don't fail if delete fails, continue with insert
      }

      // Insert new memberships
      const newMemberships = Object.entries(memberships)
        .filter(([_, isMember]) => isMember)
        .map(([audienceId, _]) => ({
          subscriber_id: subscriberId,
          audience_id: audienceId,
          added_at: new Date().toISOString()
        }));

      if (newMemberships.length > 0) {
        const { error: insertError } = await supabase
          .from("email_audience_subscribers")
          .insert(newMemberships);

        if (insertError) {
          console.error('Error inserting new memberships:', insertError);
          return NextResponse.json(
            { error: "Failed to update memberships" },
            { status: 500 }
          );
        }
      }

      return NextResponse.json({
        message: "Subscriber audience memberships updated successfully",
        subscriberId,
        memberships
      });
    } catch (error) {
      console.error('Error updating memberships:', error);
      return NextResponse.json(
        { error: "Failed to update memberships" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Unexpected error in subscriber audiences update API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 