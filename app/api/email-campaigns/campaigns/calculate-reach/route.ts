import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

// Helper function to get unique subscribers across multiple audiences
async function calculateUniqueReach(
  supabase: any,
  audienceIds: string[],
  excludedAudienceIds: string[] = []
) {
  try {
    console.log("🎯 Calculating unique reach for audiences:", audienceIds);
    console.log("🚫 Excluding audiences:", excludedAudienceIds);

    if (audienceIds.length === 0) {
      return {
        uniqueCount: 0,
        details: {
          totalIncluded: 0,
          totalExcluded: 0,
          includedAudiences: 0,
          excludedAudiences: 0,
        },
      };
    }

    // Get all audiences to understand their types and filters
    const { data: audiences } = await supabase
      .from("email_audiences")
      .select("id, name, filters")
      .in("id", [...audienceIds, ...excludedAudienceIds]);

    if (!audiences) {
      return {
        uniqueCount: 0,
        details: {
          totalIncluded: 0,
          totalExcluded: 0,
          includedAudiences: 0,
          excludedAudiences: 0,
        },
      };
    }

    const includedAudiences = audiences.filter((a: any) =>
      audienceIds.includes(a.id)
    );
    const excludedAudiences = audiences.filter((a: any) =>
      excludedAudienceIds.includes(a.id)
    );

    const allIncludedSubscriberIds = new Set<string>();
    const allExcludedSubscriberIds = new Set<string>();

    // Process included audiences
    for (const audience of includedAudiences) {
      const filters = (audience.filters as any) || {};

      if (filters.audience_type === "static") {
        // For static audiences, get subscribers from junction table
        const { data: relations } = await supabase
          .from("email_audience_subscribers")
          .select("subscriber_id")
          .eq("audience_id", audience.id);

        if (relations) {
          relations.forEach((r: any) => {
            if (r.subscriber_id) {
              allIncludedSubscriberIds.add(r.subscriber_id);
            }
          });
        }
      } else {
        // For dynamic audiences, calculate from filters
        const subscriberIds = await getSubscriberIdsFromFilters(
          supabase,
          filters
        );
        subscriberIds.forEach((id) => allIncludedSubscriberIds.add(id));
      }
    }

    // Process excluded audiences
    for (const audience of excludedAudiences) {
      const filters = (audience.filters as any) || {};

      if (filters.audience_type === "static") {
        const { data: relations } = await supabase
          .from("email_audience_subscribers")
          .select("subscriber_id")
          .eq("audience_id", audience.id);

        if (relations) {
          relations.forEach((r: any) => {
            if (r.subscriber_id) {
              allExcludedSubscriberIds.add(r.subscriber_id);
            }
          });
        }
      } else {
        const subscriberIds = await getSubscriberIdsFromFilters(
          supabase,
          filters
        );
        subscriberIds.forEach((id) => allExcludedSubscriberIds.add(id));
      }
    }

    // Store original included count before exclusions
    const originalIncludedCount = allIncludedSubscriberIds.size;

    // Remove excluded subscribers from included set
    allExcludedSubscriberIds.forEach((id) => {
      allIncludedSubscriberIds.delete(id);
    });

    const uniqueCount = allIncludedSubscriberIds.size;

    console.log(`✅ Unique reach calculated: ${uniqueCount} subscribers`);
    console.log(
      `📊 Original included: ${originalIncludedCount}, Excluded: ${allExcludedSubscriberIds.size}, Final: ${uniqueCount}`
    );

    return {
      uniqueCount,
      details: {
        totalIncluded: originalIncludedCount,
        totalExcluded: allExcludedSubscriberIds.size,
        includedAudiences: includedAudiences.length,
        excludedAudiences: excludedAudiences.length,
      },
    };
  } catch (error) {
    console.error("❌ Error calculating unique reach:", error);
    return {
      uniqueCount: 0,
      details: {
        totalIncluded: 0,
        totalExcluded: 0,
        includedAudiences: 0,
        excludedAudiences: 0,
      },
    };
  }
}

// Helper function to get subscriber IDs from dynamic audience filters
async function getSubscriberIdsFromFilters(supabase: any, filters: any) {
  try {
    // Build from rules array if present
    let statusValue: string | null = null;
    let subscriptionValue: string | null = null;
    let trialStatusValue: string | null = null; // 'active' | 'expired'
    let additionalRules: any[] = [];

    if (Array.isArray(filters?.rules)) {
      for (const rule of filters.rules) {
        if (rule.field === "status") statusValue = rule.value;
        else if (rule.field === "subscription") subscriptionValue = rule.value;
        else if (rule.field === "trial_status") trialStatusValue = rule.value;
        else additionalRules.push(rule);
      }
    }

    // Default to active if no explicit status provided
    const effectiveStatus = statusValue || "active";

    // Base subscribers query
    let subscribersQuery = supabase
      .from("subscribers")
      .select("id,user_id,subscribe_date")
      .eq("status", effectiveStatus);

    // Apply profile-derived filters by joining via profiles
    if (subscriptionValue || trialStatusValue) {
      let profilesSel = supabase.from("profiles").select("id");
      if (subscriptionValue) {
        profilesSel = profilesSel.eq("subscription", subscriptionValue);
      }
      if (trialStatusValue) {
        const nowIso = new Date().toISOString();
        if (trialStatusValue === "active") {
          // active trial AND not converted
          profilesSel = profilesSel.gt("trial_expiration", nowIso).eq("subscription", "none");
        } else if (trialStatusValue === "expired") {
          profilesSel = profilesSel.lte("trial_expiration", nowIso);
        }
      }
      const { data: profilesData } = await profilesSel;
      const profileIds = (profilesData || []).map((p: any) => p.id);
      if (profileIds.length === 0) return [];
      subscribersQuery = subscribersQuery.in("user_id", profileIds);
    }

    // Apply additional rules on subscribersQuery
    for (const rule of additionalRules) {
      if (rule.field === "signup_date" && rule.operator === "within") {
        const days = parseInt(String(rule.value).replace("_days", ""));
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - (isNaN(days) ? 7 : days));
        subscribersQuery = subscribersQuery.gte("subscribe_date", cutoff.toISOString());
      }
    }

    const { data: baseSubs, error: subsErr } = await subscribersQuery;
    if (subsErr) return [];
    let ids = (baseSubs || []).map((s: any) => s.id);

    // Handle last_email_open older_than X_days by excluding recent openers
    const lastOpenRule = additionalRules.find((r) => r.field === "last_email_open");
    if (lastOpenRule && lastOpenRule.operator === "older_than") {
      const days = parseInt(String(lastOpenRule.value).replace("_days", ""));
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - (isNaN(days) ? 60 : days));
      const { data: recentOpeners } = await supabase
        .from("email_opens")
        .select("subscriber_id")
        .gte("opened_at", cutoff.toISOString());
      const exclude = new Set((recentOpeners || []).map((r: any) => r.subscriber_id));
      ids = ids.filter((id) => !exclude.has(id));
    }

    return ids;
  } catch (error) {
    console.error("Error getting subscriber IDs from filters:", error);
    return [];
  }
}

// POST /api/email-campaigns/campaigns/calculate-reach
export async function POST(request: NextRequest) {
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
    const body = await request.json();
    const { audienceIds = [], excludedAudienceIds = [] } = body;

    if (!Array.isArray(audienceIds)) {
      return NextResponse.json(
        {
          error: "audienceIds must be an array",
        },
        { status: 400 }
      );
    }

    const result = await calculateUniqueReach(
      supabase,
      audienceIds,
      excludedAudienceIds
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("Calculate reach API error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}
