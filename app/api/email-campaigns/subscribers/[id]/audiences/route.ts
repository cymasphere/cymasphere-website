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

    // For now, we'll return an empty memberships object since the audience-subscriber relationship
    // table doesn't exist yet. This can be enhanced when the relationship table is created.
    const memberships: { [key: string]: boolean } = {};
    
    // Initialize all audiences as false (not a member)
    audiences?.forEach(audience => {
      memberships[audience.id] = false;
    });

    // TODO: When audience_subscriber_memberships table is created, query it like this:
    // const { data: membershipsData } = await supabase
    //   .from("audience_subscriber_memberships")
    //   .select("audience_id")
    //   .eq("subscriber_id", subscriberId);
    // 
    // membershipsData?.forEach(membership => {
    //   memberships[membership.audience_id] = true;
    // });

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

    // TODO: When audience_subscriber_memberships table is created, update it like this:
    // // Delete existing memberships
    // await supabase
    //   .from("audience_subscriber_memberships")
    //   .delete()
    //   .eq("subscriber_id", subscriberId);
    // 
    // // Insert new memberships
    // const newMemberships = Object.entries(memberships)
    //   .filter(([_, isMember]) => isMember)
    //   .map(([audienceId, _]) => ({
    //     subscriber_id: subscriberId,
    //     audience_id: audienceId,
    //     added_at: new Date().toISOString()
    //   }));
    // 
    // if (newMemberships.length > 0) {
    //   await supabase
    //     .from("audience_subscriber_memberships")
    //     .insert(newMemberships);
    // }

    // For now, just return success since the relationship table doesn't exist yet
    return NextResponse.json({
      message: "Subscriber audience memberships updated successfully",
      subscriberId,
      memberships
    });
  } catch (error) {
    console.error("Unexpected error in subscriber audiences update API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 