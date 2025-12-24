/**
 * @fileoverview Email campaign management server actions
 * 
 * This file contains server actions for managing email campaigns including
 * listing campaigns with pagination and audience relations, and retrieving
 * individual campaign details. All operations require admin access enforced
 * by Row Level Security (RLS) policies.
 * 
 * @module actions/email-campaigns/campaigns
 */

"use server";

import { createClient } from "@/utils/supabase/server";

/**
 * Parameters for getting campaigns list
 */
export interface GetCampaignsParams {
  limit?: number;
  offset?: number;
}

export interface Campaign {
  id: string;
  name: string;
  subject: string;
  status: string;
  scheduled_at: string | null;
  sent_at: string | null;
  created_at: string;
  updated_at: string;
  template_id: string | null;
  audienceIds?: string[];
  excludedAudienceIds?: string[];
}

export interface GetCampaignsResponse {
  campaigns: Campaign[];
  total: number;
  limit: number;
  offset: number;
}

export interface GetCampaignResponse {
  campaign: Campaign & {
    senderName?: string;
    senderEmail?: string;
    replyToEmail?: string;
    preheader?: string;
    description?: string;
    htmlContent?: string;
    textContent?: string;
  };
}

/**
 * @brief Server action to get all email campaigns with pagination
 * 
 * Retrieves a paginated list of email campaigns ordered by creation date
 * (newest first). Includes audience relationships (included and excluded
 * audiences) loaded in batch for efficiency. Returns total count for pagination.
 * 
 * @param params Optional parameters for pagination (limit, offset)
 * @returns Promise with campaigns array, total count, and pagination info
 * @note Requires admin access (enforced by RLS policies)
 * @note Batch loads audience relations to avoid N+1 query problem
 * @note Falls back to simpler query if range query fails
 * @note Limits audience relations query to 1000 records for safety
 * 
 * @example
 * ```typescript
 * const result = await getCampaigns({ limit: 25, offset: 0 });
 * // Returns: { campaigns: [...], total: 100, limit: 25, offset: 0 }
 * ```
 */
export async function getCampaigns(
  params?: GetCampaignsParams
): Promise<GetCampaignsResponse> {
  try {
    const supabase = await createClient();

    // Note: RLS will enforce admin access - if user is not admin, queries will fail
    const limit = params?.limit || 25;
    const offset = params?.offset || 0;

    // Primary query (ordered + paginated)
    let campaigns: any[] | null = null;
    let error: any = null;

    const resp = await supabase
      .from("email_campaigns")
      .select(
        "id,name,subject,status,scheduled_at,sent_at,created_at,updated_at,template_id,html_content"
      )
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    campaigns = resp.data as any[] | null;
    error = resp.error;

    if (error) {
      // Fallback: try a simpler query
      const fallback = await supabase
        .from("email_campaigns")
        .select(
          "id,name,subject,status,scheduled_at,sent_at,created_at,updated_at,template_id,html_content"
        )
        .order("created_at", { ascending: false })
        .limit(limit);

      if (fallback.error) {
        throw new Error("Failed to fetch campaigns");
      }

      campaigns = fallback.data || [];
    }

    // Batch load audience relations
    const campaignIds = (campaigns || []).map((c: any) => c.id);
    let relationsMap: Record<
      string,
      { audienceIds: string[]; excludedAudienceIds: string[] }
    > = {};

    if (campaignIds.length > 0) {
      // Batch load audience relations with limit to prevent large result sets
      const { data: relations } = await supabase
        .from("email_campaign_audiences")
        .select("campaign_id,audience_id,is_excluded")
        .in("campaign_id", campaignIds)
        .limit(1000); // Prevent unbounded queries - typical campaigns have 10-20 audiences

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

    // Get total count
    let total = 0;
    try {
      const { count } = await supabase
        .from("email_campaigns")
        .select("id", { count: "exact", head: true });
      total = count || 0;
    } catch (e) {
      // Non-fatal error
    }

    return {
      campaigns: campaignsWithRelations,
      total,
      limit,
      offset,
    };
  } catch (error) {
    console.error("Error in getCampaigns:", error);
    throw error;
  }
}

/**
 * @brief Server action to get a single email campaign by ID
 * 
 * Retrieves complete campaign details including HTML/text content, sender
 * information, preheader, description, and audience relationships. Transforms
 * database field names (snake_case) to frontend-friendly names (camelCase).
 * 
 * @param campaignId Campaign ID to retrieve
 * @returns Promise with complete campaign data including content and audiences
 * @note Requires admin access (enforced by RLS policies)
 * @note Separates included and excluded audiences from relations
 * @note Transforms database fields to frontend-friendly format
 * 
 * @example
 * ```typescript
 * const result = await getCampaign("campaign-uuid");
 * // Returns: { campaign: { id: "...", name: "...", htmlContent: "...", ... } }
 * ```
 */
export async function getCampaign(
  campaignId: string
): Promise<GetCampaignResponse> {
  try {
    const supabase = await createClient();

    // Note: RLS will enforce admin access - if user is not admin, queries will fail
    // Get campaign
    const { data: campaign, error } = await supabase
      .from("email_campaigns")
      .select("*")
      .eq("id", campaignId)
      .single();

    if (error) {
      console.error("Error fetching campaign:", error);
      throw new Error("Campaign not found");
    }

    // Get audience relationships
    const { data: audienceRelations } = await supabase
      .from("email_campaign_audiences")
      .select("audience_id, is_excluded")
      .eq("campaign_id", campaignId);

    // Separate included and excluded audiences
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

    return {
      campaign: transformedCampaign,
    };
  } catch (error) {
    console.error("Error in getCampaign:", error);
    throw error;
  }
}
