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
    const subscriberIds: string[] = [];

    // Handle new format with rules array first
    if (filters.rules && Array.isArray(filters.rules)) {
      console.log("Processing rules array:", filters.rules);

      let hasSubscriptionRule = false;
      let hasStatusRule = false;
      let subscriptionValue = null;
      let statusValue = null;

      // Extract all rule values
      for (const rule of filters.rules) {
        if (rule.field === "subscription") {
          hasSubscriptionRule = true;
          subscriptionValue = rule.value;
        } else if (rule.field === "status") {
          hasStatusRule = true;
          statusValue = rule.value;
        }
      }

      // If we have both subscription and status rules, we need to join
      if (hasSubscriptionRule && hasStatusRule) {
        console.log(
          `Joining: subscription=${subscriptionValue} AND status=${statusValue}`
        );

        // Get profiles with subscription first
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("id")
          .eq("subscription", subscriptionValue);

        if (!profilesData || profilesData.length === 0) {
          console.log(
            "No profiles found with subscription:",
            subscriptionValue
          );
          return [];
        }

        const profileIds = profilesData.map((p: any) => p.id);
        console.log(
          `Found ${profileIds.length} profiles with subscription ${subscriptionValue}`
        );

        // Then get subscribers with status and matching profile IDs
        const { data: subscribersData } = await supabase
          .from("subscribers")
          .select("id")
          .eq("status", statusValue)
          .in("user_id", profileIds);

        if (subscribersData) {
          subscribersData.forEach((s: any) => subscriberIds.push(s.id));
        }

        console.log(`Final count after joining: ${subscriberIds.length}`);
        return subscriberIds;
      }

      // Handle single rule cases
      if (hasSubscriptionRule && !hasStatusRule) {
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("id")
          .eq("subscription", subscriptionValue);

        if (profilesData) {
          profilesData.forEach((p: any) => subscriberIds.push(p.id));
        }
        return subscriberIds;
      }

      if (hasStatusRule && !hasSubscriptionRule) {
        const { data: subscribersData } = await supabase
          .from("subscribers")
          .select("id")
          .eq("status", statusValue);

        if (subscribersData) {
          subscribersData.forEach((s: any) => subscriberIds.push(s.id));
        }
        return subscriberIds;
      }
    }

    // Initialize queries for both tables (fallback for old format)
    let profileQuery = supabase.from("profiles").select("id");
    let subscriberQuery = supabase.from("subscribers").select("id");
    let useProfiles = false;
    let useSubscribers = false;
    let needsJoin = false;

    // Process each filter (similar to calculateSubscriberCount but return IDs)
    for (const [field, value] of Object.entries(filters)) {
      if (field === "audience_type" || field === "rules") {
        continue;
      } else if (field === "subscription") {
        useProfiles = true;
        if (typeof value === "string") {
          profileQuery = profileQuery.eq("subscription", value);
        } else if (
          value &&
          typeof value === "object" &&
          "operator" in value &&
          "value" in value
        ) {
          const filterValue = value as { operator: string; value: any };
          if (filterValue.operator === "in") {
            profileQuery = profileQuery.in("subscription", filterValue.value);
          }
        }
      } else if (field === "status") {
        useSubscribers = true;
        if (typeof value === "string") {
          subscriberQuery = subscriberQuery.eq("status", value);
        }
      } else if (field === "trial_expiration") {
        useProfiles = true;
        if (
          value &&
          typeof value === "object" &&
          "operator" in value &&
          "value" in value
        ) {
          const filterValue = value as { operator: string; value: any };
          if (filterValue.operator === "gt") {
            profileQuery = profileQuery.gt(
              "trial_expiration",
              filterValue.value
            );
          } else if (filterValue.operator === "lt") {
            profileQuery = profileQuery.lt(
              "trial_expiration",
              filterValue.value
            );
          }
        }
      } else if (field === "created_at") {
        useSubscribers = true;
        if (
          value &&
          typeof value === "object" &&
          "operator" in value &&
          "value" in value
        ) {
          const filterValue = value as { operator: string; value: any };
          if (filterValue.operator === "gte") {
            subscriberQuery = subscriberQuery.gte(
              "created_at",
              filterValue.value
            );
          }
        }
      } else if (field === "updated_at") {
        if (value && typeof value === "object" && "operator" in value) {
          const filterValue = value as {
            operator: string;
            start?: any;
            end?: any;
          };
          if (
            filterValue.operator === "between" &&
            "start" in filterValue &&
            "end" in filterValue
          ) {
            useSubscribers = true;
            subscriberQuery = subscriberQuery
              .gte("updated_at", filterValue.start)
              .lte("updated_at", filterValue.end);
          }
        }
      } else if (field === "tags") {
        useSubscribers = true;
        if (
          value &&
          typeof value === "object" &&
          "operator" in value &&
          "value" in value
        ) {
          const filterValue = value as { operator: string; value: any };
          if (filterValue.operator === "contains") {
            subscriberQuery = subscriberQuery.overlaps(
              "tags",
              filterValue.value
            );
          }
        }
      }
    }

    // Determine which approach to use
    if (useProfiles && useSubscribers) {
      needsJoin = true;
    }

    if (needsJoin) {
      // Handle complex cases that need both tables
      if (filters.subscription && filters.status) {
        const { data: profilesData } = await profileQuery;
        if (profilesData && profilesData.length > 0) {
          const profileIds = profilesData.map((p: any) => p.id);
          const { data: subscribersData } = await supabase
            .from("subscribers")
            .select("id")
            .eq("status", filters.status)
            .in("user_id", profileIds);

          if (subscribersData) {
            subscribersData.forEach((s: any) => subscriberIds.push(s.id));
          }
        }
      }
    } else if (useProfiles) {
      const { data: profilesData } = await profileQuery;
      if (profilesData) {
        profilesData.forEach((p: any) => subscriberIds.push(p.id));
      }
    } else if (useSubscribers) {
      const { data: subscribersData } = await subscriberQuery;
      if (subscribersData) {
        subscribersData.forEach((s: any) => subscriberIds.push(s.id));
      }
    }

    return subscriberIds;
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
