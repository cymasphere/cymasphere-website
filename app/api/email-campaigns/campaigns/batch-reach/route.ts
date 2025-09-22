import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

// Copied helpers from calculate-reach route for batching
async function getSubscriberIdsFromFilters(supabase: any, filters: any) {
  try {
    // Align with calculate-reach logic
    let statusValue: string | null = null;
    let subscriptionValue: string | null = null;
    let additionalRules: any[] = [];

    if (Array.isArray(filters?.rules)) {
      for (const rule of filters.rules) {
        if (rule.field === "status") statusValue = rule.value;
        else if (rule.field === "subscription") subscriptionValue = rule.value;
        else additionalRules.push(rule);
      }
    }

    const effectiveStatus = statusValue || "active";

    let subscribersQuery = supabase
      .from("subscribers")
      .select("id,user_id,subscribe_date")
      .eq("status", effectiveStatus);

    if (subscriptionValue) {
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id")
        .eq("subscription", subscriptionValue);
      const profileIds = (profilesData || []).map((p: any) => p.id);
      if (profileIds.length === 0) return [];
      subscribersQuery = subscribersQuery.in("user_id", profileIds);
    }

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

async function calculateUniqueReach(
  supabase: any,
  audienceIds: string[],
  excludedAudienceIds: string[] = []
) {
  try {
    if (audienceIds.length === 0) {
      return {
        uniqueCount: 0,
        details: { totalIncluded: 0, totalExcluded: 0, includedAudiences: 0, excludedAudiences: 0 },
      };
    }

    const { data: audiences } = await supabase
      .from("email_audiences")
      .select("id, name, filters")
      .in("id", [...audienceIds, ...excludedAudienceIds]);

    if (!audiences) {
      return {
        uniqueCount: 0,
        details: { totalIncluded: 0, totalExcluded: 0, includedAudiences: 0, excludedAudiences: 0 },
      };
    }

    const includedAudiences = audiences.filter((a: any) => audienceIds.includes(a.id));
    const excludedAudiences = audiences.filter((a: any) => excludedAudienceIds.includes(a.id));

    const allIncludedSubscriberIds = new Set<string>();
    const allExcludedSubscriberIds = new Set<string>();

    for (const audience of includedAudiences) {
      const filters = (audience.filters as any) || {};
      if (filters.audience_type === "static") {
        const { data: relations } = await supabase
          .from("email_audience_subscribers")
          .select("subscriber_id")
          .eq("audience_id", audience.id);
        relations?.forEach((r: any) => r.subscriber_id && allIncludedSubscriberIds.add(r.subscriber_id));
      } else {
        const subscriberIds = await getSubscriberIdsFromFilters(supabase, filters);
        subscriberIds.forEach((id) => allIncludedSubscriberIds.add(id));
      }
    }

    for (const audience of excludedAudiences) {
      const filters = (audience.filters as any) || {};
      if (filters.audience_type === "static") {
        const { data: relations } = await supabase
          .from("email_audience_subscribers")
          .select("subscriber_id")
          .eq("audience_id", audience.id);
        relations?.forEach((r: any) => r.subscriber_id && allExcludedSubscriberIds.add(r.subscriber_id));
      } else {
        const subscriberIds = await getSubscriberIdsFromFilters(supabase, filters);
        subscriberIds.forEach((id) => allExcludedSubscriberIds.add(id));
      }
    }

    const originalIncludedCount = allIncludedSubscriberIds.size;
    allExcludedSubscriberIds.forEach((id) => allIncludedSubscriberIds.delete(id));
    const uniqueCount = allIncludedSubscriberIds.size;

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
    console.error("❌ Error calculating unique reach (batch):", error);
    return {
      uniqueCount: 0,
      details: { totalIncluded: 0, totalExcluded: 0, includedAudiences: 0, excludedAudiences: 0 },
    };
  }
}

// POST /api/email-campaigns/campaigns/batch-reach
export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const { data: adminCheck } = await supabase
    .from("admins")
    .select("*")
    .eq("user", user.id)
    .single();

  if (!adminCheck) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const items: Array<{ id: string; audienceIds: string[]; excludedAudienceIds?: string[] }> = body?.campaigns || [];
    if (!Array.isArray(items)) {
      return NextResponse.json({ error: "campaigns must be an array" }, { status: 400 });
    }

    const results: Record<string, { uniqueCount: number; details: any }> = {};
    for (const item of items) {
      const audienceIds = Array.isArray(item.audienceIds) ? item.audienceIds : [];
      const excludedAudienceIds = Array.isArray(item.excludedAudienceIds) ? item.excludedAudienceIds : [];
      const res = await calculateUniqueReach(supabase, audienceIds, excludedAudienceIds);
      results[item.id] = res;
    }

    return NextResponse.json({ results });
  } catch (error) {
    console.error("Batch reach API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}


