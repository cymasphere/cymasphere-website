/**
 * @fileoverview Individual email campaign management API endpoint
 * 
 * This endpoint handles operations on a single email campaign by ID.
 * Supports retrieving, updating, and deleting campaigns. Includes full
 * campaign data with audience relationships.
 * 
 * @module api/email-campaigns/campaigns/[id]
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

/**
 * @brief GET endpoint to retrieve a single email campaign by ID
 * 
 * Returns complete campaign data including content, metadata, and audience
 * relationships (included and excluded audiences). Data is transformed to
 * camelCase for frontend consumption.
 * 
 * Route parameters:
 * - id: Campaign ID (from URL path)
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
 *     "htmlContent": "<html>...</html>",
 *     "audienceIds": ["uuid1"],
 *     "excludedAudienceIds": ["uuid2"]
 *   }
 * }
 * ```
 * 
 * 404 Not Found:
 * ```json
 * {
 *   "success": false,
 *   "error": "Campaign not found"
 * }
 * ```
 * 
 * @param request Next.js request object
 * @param params Route parameters containing campaign ID
 * @returns NextResponse with campaign data or error
 * 
 * @example
 * ```typescript
 * // GET /api/email-campaigns/campaigns/uuid-123
 * // Returns: { success: true, campaign: {...} }
 * ```
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;

    // Get campaign
    const { data: campaign, error: campaignError } = await supabase
      .from("email_campaigns")
      .select("*")
      .eq("id", id)
      .single();

    if (campaignError || !campaign) {
      return NextResponse.json(
        { success: false, error: "Campaign not found" },
        { status: 404 }
      );
    }

    // Get audience relationships
    const { data: audienceRelations } = await supabase
      .from("email_campaign_audiences")
      .select("audience_id, is_excluded")
      .eq("campaign_id", id);

    const audienceIds: string[] = [];
    const excludedAudienceIds: string[] = [];

    if (audienceRelations) {
      for (const relation of audienceRelations) {
        if (relation.audience_id) {
          if (relation.is_excluded) {
            excludedAudienceIds.push(relation.audience_id);
          } else {
            audienceIds.push(relation.audience_id);
          }
        }
      }
    }

    // Transform the data for frontend consumption
    const transformedCampaign = {
      ...campaign,
      senderName: campaign.sender_name,
      senderEmail: campaign.sender_email,
      replyToEmail: campaign.reply_to_email,
      preheader: campaign.preheader,
      description: campaign.description,
      htmlContent: campaign.html_content,
      textContent: campaign.text_content,
      audienceIds,
      excludedAudienceIds,
    };

    return NextResponse.json({
      success: true,
      campaign: transformedCampaign,
    });
  } catch (error) {
    console.error("Error in GET /api/email-campaigns/campaigns/[id]:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * @brief PUT endpoint to update an email campaign
 * 
 * Updates campaign fields including content, metadata, status, scheduling,
 * and audience relationships. Only provided fields are updated (partial update).
 * 
 * Route parameters:
 * - id: Campaign ID (from URL path)
 * 
 * Request body (JSON) - all fields optional except name and subject:
 * - name: Campaign name (required if provided)
 * - subject: Email subject line (required if provided)
 * - senderName, senderEmail, replyToEmail, preheader, description
 * - htmlContent, textContent
 * - audienceIds, excludedAudienceIds
 * - status, scheduled_at
 * 
 * Responses:
 * 
 * 200 OK - Success:
 * ```json
 * {
 *   "success": true,
 *   "campaign": {
 *     "id": "uuid",
 *     "name": "Updated Name",
 *     "subject": "Updated Subject",
 *     "status": "scheduled"
 *   }
 * }
 * ```
 * 
 * 400 Bad Request:
 * ```json
 * {
 *   "success": false,
 *   "error": "Name and subject are required"
 * }
 * ```
 * 
 * @param request Next.js request object containing JSON body with update data
 * @param params Route parameters containing campaign ID
 * @returns NextResponse with updated campaign data or error
 * @note Audience relations are replaced (deleted and recreated) if provided
 * 
 * @example
 * ```typescript
 * // PUT /api/email-campaigns/campaigns/uuid-123
 * // Body: { name: "Updated Name", status: "scheduled" }
 * // Returns: { success: true, campaign: {...} }
 * ```
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;
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
      status,
      scheduled_at,
    } = body;

    // Validate required fields
    if (!name || !subject) {
      return NextResponse.json(
        { success: false, error: "Name and subject are required" },
        { status: 400 }
      );
    }

    // Update campaign
    const updateData: any = {
      name,
      subject,
      updated_at: new Date().toISOString(),
    };

    if (senderName !== undefined) updateData.sender_name = senderName;
    if (senderEmail !== undefined) updateData.sender_email = senderEmail;
    if (replyToEmail !== undefined) updateData.reply_to_email = replyToEmail;
    if (preheader !== undefined) updateData.preheader = preheader;
    if (description !== undefined) updateData.description = description;
    if (htmlContent !== undefined) updateData.html_content = htmlContent;
    if (textContent !== undefined) updateData.text_content = textContent;
    if (status !== undefined) updateData.status = status;
    if (scheduled_at !== undefined) updateData.scheduled_at = scheduled_at;

    const { data: campaign, error: campaignError } = await supabase
      .from("email_campaigns")
      .update(updateData)
      .eq("id", id)
      .select("id, name, subject, status")
      .single();

    if (campaignError) {
      console.error("Error updating campaign:", campaignError);
      return NextResponse.json(
        { success: false, error: campaignError.message || "Failed to update campaign" },
        { status: 500 }
      );
    }

    // Update audience relations if provided
    if (audienceIds !== undefined || excludedAudienceIds !== undefined) {
      // Delete existing relations
      await supabase
        .from("email_campaign_audiences")
        .delete()
        .eq("campaign_id", id);

      // Create new relations
      const relations = [
        ...((audienceIds || []) as string[]).map((audienceId: string) => ({
          campaign_id: id,
          audience_id: audienceId,
          is_excluded: false,
        })),
        ...((excludedAudienceIds || []) as string[]).map((audienceId: string) => ({
          campaign_id: id,
          audience_id: audienceId,
          is_excluded: true,
        })),
      ];

      if (relations.length > 0) {
        const { error: relationsError } = await supabase
          .from("email_campaign_audiences")
          .insert(relations);

        if (relationsError) {
          console.error("Error updating audience relations:", relationsError);
          // Don't fail the whole request, just log the error
        }
      }
    }

    return NextResponse.json({
      success: true,
      campaign,
    });
  } catch (error) {
    console.error("Error in PUT /api/email-campaigns/campaigns/[id]:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * @brief DELETE endpoint to delete an email campaign
 * 
 * Permanently deletes a campaign and all related records (cascade delete).
 * This operation cannot be undone.
 * 
 * Route parameters:
 * - id: Campaign ID (from URL path)
 * 
 * Responses:
 * 
 * 200 OK - Success:
 * ```json
 * {
 *   "success": true,
 *   "message": "Campaign deleted successfully"
 * }
 * ```
 * 
 * 500 Internal Server Error:
 * ```json
 * {
 *   "success": false,
 *   "error": "Failed to delete campaign"
 * }
 * ```
 * 
 * @param request Next.js request object
 * @param params Route parameters containing campaign ID
 * @returns NextResponse with success status or error
 * @note Related records (audiences, sends, etc.) are deleted via cascade
 * 
 * @example
 * ```typescript
 * // DELETE /api/email-campaigns/campaigns/uuid-123
 * // Returns: { success: true, message: "Campaign deleted successfully" }
 * ```
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;

    // Delete campaign (cascade will handle related records)
    const { error } = await supabase
      .from("email_campaigns")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting campaign:", error);
      return NextResponse.json(
        { success: false, error: error.message || "Failed to delete campaign" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Campaign deleted successfully",
    });
  } catch (error) {
    console.error("Error in DELETE /api/email-campaigns/campaigns/[id]:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

