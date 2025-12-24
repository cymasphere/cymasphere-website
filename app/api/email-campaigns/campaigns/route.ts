/**
 * @fileoverview Email campaigns management API endpoint
 * 
 * This endpoint handles CRUD operations for email campaigns. Supports listing
 * all campaigns with pagination, creating new campaigns, and managing campaign
 * metadata including audiences, content, and scheduling information.
 * 
 * @module api/email-campaigns/campaigns
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createSupabaseServiceRole } from "@/utils/supabase/service";

/**
 * @brief GET endpoint to retrieve all email campaigns with pagination
 * 
 * Returns a paginated list of all email campaigns with their metadata,
 * including audience relationships (included and excluded audiences).
 * Results are ordered by creation date (newest first).
 * 
 * Query parameters:
 * - limit: Number of campaigns to return (default: 25)
 * - offset: Number of campaigns to skip for pagination (default: 0)
 * 
 * Responses:
 * 
 * 200 OK - Success:
 * ```json
 * {
 *   "success": true,
 *   "campaigns": [
 *     {
 *       "id": "uuid",
 *       "name": "Campaign Name",
 *       "subject": "Email Subject",
 *       "status": "draft",
 *       "scheduled_at": "2024-01-01T00:00:00.000Z",
 *       "audienceIds": ["uuid1", "uuid2"],
 *       "excludedAudienceIds": ["uuid3"]
 *     }
 *   ],
 *   "total": 100,
 *   "limit": 25,
 *   "offset": 0
 * }
 * ```
 * 
 * 500 Internal Server Error:
 * ```json
 * {
 *   "success": false,
 *   "error": "Failed to fetch campaigns"
 * }
 * ```
 * 
 * @param request Next.js request object containing query parameters
 * @returns NextResponse with campaigns array and pagination info
 * @note Includes audience relationships (included and excluded) for each campaign
 * 
 * @example
 * ```typescript
 * // GET /api/email-campaigns/campaigns?limit=50&offset=0
 * // Returns: { success: true, campaigns: [...], total: 100, limit: 50, offset: 0 }
 * ```
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get("limit") || "25");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Fetch campaigns
    const { data: campaigns, error } = await supabase
      .from("email_campaigns")
      .select("id,name,subject,status,scheduled_at,sent_at,created_at,updated_at,template_id,html_content")
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("Error fetching campaigns:", error);
      return NextResponse.json(
        { success: false, error: "Failed to fetch campaigns" },
        { status: 500 }
      );
    }

    // Get total count
    const { count } = await supabase
      .from("email_campaigns")
      .select("id", { count: "exact", head: true });

    // Get audience relations
    const campaignIds = (campaigns || []).map((c: any) => c.id);
    let relationsMap: Record<string, { audienceIds: string[]; excludedAudienceIds: string[] }> = {};

    if (campaignIds.length > 0) {
      const { data: relations } = await supabase
        .from("email_campaign_audiences")
        .select("campaign_id,audience_id,is_excluded")
        .in("campaign_id", campaignIds)
        .limit(1000);

      relationsMap =
        relations?.reduce((acc: any, r: any) => {
          const cid = r.campaign_id;
          if (!acc[cid])
            acc[cid] = { audienceIds: [], excludedAudienceIds: [] };
          if (r.audience_id) {
            if (r.is_excluded) acc[cid].excludedAudienceIds.push(r.audience_id);
            else acc[cid].audienceIds.push(r.audience_id);
          }
          return acc;
        }, {} as Record<string, { audienceIds: string[]; excludedAudienceIds: string[] }>) ||
        {};
    }

    // Attach relations to campaigns
    const campaignsWithRelations = (campaigns || []).map((c: any) => ({
      ...c,
      audienceIds: relationsMap[c.id]?.audienceIds || [],
      excludedAudienceIds: relationsMap[c.id]?.excludedAudienceIds || [],
    }));

    return NextResponse.json({
      success: true,
      campaigns: campaignsWithRelations,
      total: count || 0,
      limit,
      offset,
    });
  } catch (error) {
    console.error("Error in GET /api/email-campaigns/campaigns:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * @brief POST endpoint to create a new email campaign
 * 
 * Creates a new email campaign with content, sender information, and audience
 * targeting. Associates the campaign with included and excluded audiences.
 * Campaigns are created in "draft" status by default.
 * 
 * Request body (JSON):
 * - name: Campaign name (required)
 * - subject: Email subject line (required)
 * - senderName: Sender display name (optional, default: "Cymasphere")
 * - senderEmail: Sender email address (optional, default: "support@cymasphere.com")
 * - replyToEmail: Reply-to email address (optional)
 * - preheader: Email preheader text (optional)
 * - description: Campaign description (optional)
 * - htmlContent: HTML email content (optional)
 * - textContent: Plain text email content (optional)
 * - audienceIds: Array of audience IDs to include (optional)
 * - excludedAudienceIds: Array of audience IDs to exclude (optional)
 * - status: Campaign status (optional, default: "draft")
 * - scheduled_at: Scheduled send time (optional)
 * 
 * Responses:
 * 
 * 200 OK - Success:
 * ```json
 * {
 *   "success": true,
 *   "campaign": {
 *     "id": "uuid",
 *     "name": "Campaign Name",
 *     "subject": "Email Subject",
 *     "status": "draft"
 *   }
 * }
 * ```
 * 
 * 400 Bad Request - Missing required fields:
 * ```json
 * {
 *   "success": false,
 *   "error": "Name and subject are required"
 * }
 * ```
 * 
 * 500 Internal Server Error:
 * ```json
 * {
 *   "success": false,
 *   "error": "Failed to create campaign"
 * }
 * ```
 * 
 * @param request Next.js request object containing JSON body with campaign data
 * @returns NextResponse with created campaign data or error
 * @note Audience relations are created separately and don't block campaign creation on failure
 * 
 * @example
 * ```typescript
 * // POST /api/email-campaigns/campaigns
 * // Body: { name: "Newsletter", subject: "Monthly Update", audienceIds: ["uuid"] }
 * // Returns: { success: true, campaign: { id: "uuid", ... } }
 * ```
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
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
      audienceIds,
      excludedAudienceIds,
      status = "draft",
      scheduled_at,
    } = body;

    // Validate required fields
    if (!name || !subject) {
      return NextResponse.json(
        { success: false, error: "Name and subject are required" },
        { status: 400 }
      );
    }

    // Create campaign record
    const { data: campaign, error: campaignError } = await supabase
      .from("email_campaigns")
      .insert({
        name,
        subject,
        sender_name: senderName || "Cymasphere",
        sender_email: senderEmail || "support@cymasphere.com",
        reply_to_email: replyToEmail || senderEmail || "support@cymasphere.com",
        preheader: preheader || null,
        description: description || null,
        html_content: htmlContent || null,
        text_content: textContent || null,
        status: status || "draft",
        scheduled_at: scheduled_at || null,
      })
      .select("id")
      .single();

    if (campaignError) {
      console.error("Error creating campaign:", campaignError);
      return NextResponse.json(
        { success: false, error: campaignError.message || "Failed to create campaign" },
        { status: 500 }
      );
    }

    // Create audience relations if provided
    if (campaign && (audienceIds?.length > 0 || excludedAudienceIds?.length > 0)) {
      const relations = [
        ...(audienceIds || []).map((audienceId: string) => ({
          campaign_id: campaign.id,
          audience_id: audienceId,
          is_excluded: false,
        })),
        ...(excludedAudienceIds || []).map((audienceId: string) => ({
          campaign_id: campaign.id,
          audience_id: audienceId,
          is_excluded: true,
        })),
      ];

      if (relations.length > 0) {
        const { error: relationsError } = await supabase
          .from("email_campaign_audiences")
          .insert(relations);

        if (relationsError) {
          console.error("Error creating audience relations:", relationsError);
          // Don't fail the whole request, just log the error
        }
      }
    }

    return NextResponse.json({
      success: true,
      campaign: {
        id: campaign.id,
        name,
        subject,
        status,
      },
    });
  } catch (error) {
    console.error("Error in POST /api/email-campaigns/campaigns:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

