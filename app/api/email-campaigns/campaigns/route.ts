import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

// GET /api/email-campaigns/campaigns - Get all campaigns
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
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Primary query (ordered + paginated)
    let campaigns: any[] | null = null;
    let error: any = null;
    {
      const resp = await supabase
        .from("email_campaigns")
        .select("*")
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);
      campaigns = resp.data as any[] | null;
      error = resp.error;
    }

    if (error) {
      console.error("Error fetching campaigns (ordered/ranged):", error);
      // Fallback: try a simpler query to avoid transient errors with order/range
      const fallback = await supabase
        .from("email_campaigns")
        .select("*")
        .limit(limit);

      if (fallback.error) {
        console.error("Fallback query also failed:", fallback.error);
        return NextResponse.json(
          {
            error: "Failed to fetch campaigns",
            details:
              process.env.NODE_ENV !== "production"
                ? {
                    primary: String(error?.message || error),
                    fallback: String(fallback.error.message),
                  }
                : undefined,
          },
          { status: 500 }
        );
      }

      campaigns = fallback.data || [];
    }

    // Get total count
    const { count, error: countError } = await supabase
      .from("email_campaigns")
      .select("*", { count: "exact", head: true });

    if (countError) {
      console.error("Error getting campaigns count:", countError);
    }

    return NextResponse.json({
      campaigns: campaigns || [],
      total: count || 0,
      limit,
      offset,
    });
  } catch (error) {
    console.error("Campaigns API error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}

// POST /api/email-campaigns/campaigns - Create new campaign
export async function POST(request: NextRequest) {
  const supabase = await createClient();

  console.log("🔐 POST /api/email-campaigns/campaigns called");
  console.log("📝 Headers:", Object.fromEntries(request.headers.entries()));

  // Get authenticated user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  console.log("👤 User:", user ? `${user.email} (${user.id})` : "null");
  console.log("❌ Auth error:", authError);

  if (authError || !user) {
    console.log("🚫 Returning 401 - Authentication required");
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
    const body = await request.json();
    const {
      name,
      subject,
      senderName,
      senderEmail,
      replyToEmail,
      preheader,
      description,
      htmlContent,
      textContent,
      audienceIds = [],
      excludedAudienceIds = [],
      template_id,
      status = "draft",
      scheduled_at,
    } = body;

    console.log("📊 Campaign data received:", {
      name,
      subject,
      senderName,
      senderEmail,
      replyToEmail,
      audienceIds,
      excludedAudienceIds,
    });

    if (!name || !subject) {
      return NextResponse.json(
        {
          error: "Name and subject are required",
        },
        { status: 400 }
      );
    }

    // Create new campaign using correct field names
    const { data: campaign, error } = await supabase
      .from("email_campaigns")
      .insert({
        name,
        subject,
        description,
        sender_name: senderName || "Cymasphere",
        sender_email: senderEmail || "support@cymasphere.com",
        reply_to_email: replyToEmail,
        preheader,
        html_content: htmlContent,
        text_content: textContent,
        template_id,
        status,
        scheduled_at,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error("🚨 Database error creating campaign:", error);
      console.error("🚨 Error details:", JSON.stringify(error, null, 2));
      return NextResponse.json(
        {
          error: "Failed to create campaign",
          details: error.message,
        },
        { status: 500 }
      );
    }

    console.log("✅ Campaign created:", campaign.id);

    // Now handle audience relationships using the junction table
    const audienceInserts = [];

    // Add included audiences
    for (const audienceId of audienceIds) {
      audienceInserts.push({
        campaign_id: campaign.id,
        audience_id: audienceId,
        is_excluded: false,
      });
    }

    // Add excluded audiences
    for (const audienceId of excludedAudienceIds) {
      audienceInserts.push({
        campaign_id: campaign.id,
        audience_id: audienceId,
        is_excluded: true,
      });
    }

    // Insert audience relationships if any
    if (audienceInserts.length > 0) {
      const { error: audienceError } = await supabase
        .from("email_campaign_audiences")
        .insert(audienceInserts);

      if (audienceError) {
        console.error(
          "🚨 Database error creating campaign audiences:",
          audienceError
        );
        // Don't fail the entire request, just log the error
        console.warn("⚠️ Campaign created but audience relationships failed");
      } else {
        console.log(
          `✅ Created ${audienceInserts.length} audience relationships`
        );
      }
    }

    return NextResponse.json(
      {
        campaign,
        audienceCount: audienceInserts.length,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create campaign API error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
