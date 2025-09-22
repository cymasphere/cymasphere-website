import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

const EMAIL_DEBUG = process.env.EMAIL_DEBUG === "1";

// Helper function to calculate subscriber count for an audience
async function calculateSubscriberCount(supabase: any, filters: any) {
  try {
    if (EMAIL_DEBUG) {
      console.log(
        "Calculating subscriber count for filters:",
        JSON.stringify(filters)
      );
    }

    // Check if this is a static audience
    if (filters.audience_type === "static") {
      // For static audiences, count from email_audience_subscribers table
      // We need the audience ID to do this, but it's not passed to this function
      // For now, return the stored subscriber_count or 0
      if (EMAIL_DEBUG) {
        console.log("Static audience detected, using stored count");
      }
      return 0; // Will be handled separately for static audiences
    }

    // Ensure filters.rules is always an array
    if (!filters.rules || !Array.isArray(filters.rules) || filters.rules.length === 0) {
      filters.rules = [{ field: 'status', operator: 'equals', value: 'active', timeframe: 'all_time' }];
    }

    // Handle different filter formats for dynamic audiences
    if (filters.rules && Array.isArray(filters.rules)) {
      // Handle new format with rules array - need to process ALL rules, not just first one
      if (EMAIL_DEBUG) {
        console.log("Processing rules array:", filters.rules);
      }

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
        if (EMAIL_DEBUG) {
          console.log(
            `Joining: subscription=${subscriptionValue} AND status=${statusValue}`
          );
        }

        // Get profiles with subscription first
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("id")
          .eq("subscription", subscriptionValue);

        if (!profilesData || profilesData.length === 0) {
        if (EMAIL_DEBUG) {
          console.log(
            "No profiles found with subscription:",
            subscriptionValue
          );
        }
          return 0;
        }

        const profileIds = profilesData.map((p: any) => p.id);
        if (EMAIL_DEBUG) {
          console.log(
            `Found ${profileIds.length} profiles with subscription ${subscriptionValue}`
          );
        }

        // Then get subscribers with status and matching profile IDs
        const { count } = await supabase
          .from("subscribers")
          .select("*", { count: "exact", head: true })
          .eq("status", statusValue)
          .in("user_id", profileIds);

        if (EMAIL_DEBUG) {
          console.log(`Final count after joining: ${count}`);
        }
        return count || 0;
      }

      // Handle single rule cases
      if (hasSubscriptionRule && !hasStatusRule) {
        const { count } = await supabase
          .from("profiles")
          .select("*", { count: "exact", head: true })
          .eq("subscription", subscriptionValue);
        if (EMAIL_DEBUG) {
          console.log(`Count for subscription '${subscriptionValue}': ${count}`);
        }
        return count || 0;
      }

      if (hasStatusRule && !hasSubscriptionRule) {
        const { count } = await supabase
          .from("subscribers")
          .select("*", { count: "exact", head: true })
          .eq("status", statusValue);
        if (EMAIL_DEBUG) {
          console.log(`Count for status '${statusValue}': ${count}`);
        }
        return count || 0;
      }
    }

    // Initialize queries for both tables
    let profileQuery = supabase
      .from("profiles")
      .select("*", { count: "exact", head: true });
    let subscriberQuery = supabase
      .from("subscribers")
      .select("*", { count: "exact", head: true });
    let useProfiles = false;
    let useSubscribers = false;
    let needsJoin = false;

    // Process each filter
    for (const [field, value] of Object.entries(filters)) {
      if (field === "audience_type") {
        continue; // Skip audience_type field
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
            // Could apply to either table, prefer subscribers
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
            // For tags array contains, we need to check if any of the tags exist
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
      // Need to join - this is more complex, let's handle specific cases
      needsJoin = true;
    }

    if (needsJoin) {
      // For now, if we need both profiles and subscribers data,
      // let's handle the most common case: subscription + status
      if (filters.subscription && filters.status) {
        // Get profiles with subscription first
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("id")
          .eq("subscription", filters.subscription);

        if (!profilesData || profilesData.length === 0) {
          return 0;
        }

        const profileIds = profilesData.map((p: any) => p.id);

        // Then get subscribers with status and matching profile IDs
        const { count } = await supabase
          .from("subscribers")
          .select("*", { count: "exact", head: true })
          .eq("status", filters.status)
          .in("user_id", profileIds);

        return count || 0;
      }

      // For other complex cases, return 0 for now
      if (EMAIL_DEBUG) {
        console.log("Complex join filters not yet fully supported, returning 0");
      }
      return 0;
    } else if (useProfiles) {
      // Query profiles table only
      const { count } = await profileQuery;
      if (EMAIL_DEBUG) {
        console.log(`Profiles count: ${count}`);
      }
      return count || 0;
    } else if (useSubscribers) {
      // Query subscribers table only
      const { count } = await subscriberQuery;
      if (EMAIL_DEBUG) {
        console.log(`Subscribers count: ${count}`);
      }
      return count || 0;
    }

    // Default: if no filters match known fields, return 0
    if (EMAIL_DEBUG) {
      console.log("No matching filters found, returning 0");
    }
    return 0;
  } catch (error) {
    if (EMAIL_DEBUG) {
      console.error("Error in calculateSubscriberCount:", error);
    }
    return 0;
  }
}

// GET /api/email-campaigns/audiences - Get all audiences
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
    const mode = (searchParams.get("mode") || "full").toLowerCase();

    // Get audiences (light or full)
    const { data: audiences, error } = await supabase
      .from("email_audiences")
      .select(mode === "light" ? "id,name,description,subscriber_count,created_at,updated_at,filters" : "*")
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("Error fetching audiences:", error);
      return NextResponse.json(
        {
          error: "Failed to fetch audiences",
        },
        { status: 500 }
      );
    }

    if (EMAIL_DEBUG) {
      console.log(
        `🚀 Processing ${
          audiences?.length || 0
        } audiences for subscriber counts...`
      );
    }

    // Calculate actual subscriber counts for each audience unless light mode
    const audiencesWithCounts = mode === "light" ? (audiences || []) : await Promise.all(
      (audiences || []).map(async (audience) => {
        let actualCount = 0;

        if (EMAIL_DEBUG) {
          console.log(`\n--- Processing audience: "${audience.name}" ---`);
          console.log(`Stored subscriber_count: ${audience.subscriber_count}`);
          console.log(`Filters:`, JSON.stringify(audience.filters));
        }

        // Check if this is a static audience
        if (
          audience.filters &&
          typeof audience.filters === "object" &&
          audience.filters !== null
        ) {
          const filters = audience.filters as any;
          if (EMAIL_DEBUG) {
            console.log(
              `Audience type from filters: ${filters.audience_type || "not set"}`
            );
          }

          if (filters.audience_type === "static") {
            // For static audiences, call the subscribers API to get the exact same count as the edit modal
            if (EMAIL_DEBUG) {
              console.log(
                `🔍 STATIC AUDIENCE - Getting count from subscribers API for "${audience.name}" (ID: ${audience.id})`
              );
            }

            try {
              // Make internal API call to get subscriber count (same as edit modal)
              const subscribersResponse = await fetch(
                `${
                  process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
                }/api/email-campaigns/audiences/${
                  audience.id
                }/subscribers?page=1&limit=1`,
                {
                  method: "GET",
                  headers: {
                    Authorization: request.headers.get("Authorization") || "",
                    Cookie: request.headers.get("Cookie") || "",
                  },
                }
              );

              if (subscribersResponse.ok) {
                const subscribersData = await subscribersResponse.json();
                actualCount = subscribersData.pagination?.total || 0;
                console.log(
                  `📊 STATIC AUDIENCE "${audience.name}": ${actualCount} subscribers (from subscribers API)`
                );
              } else {
                if (EMAIL_DEBUG) {
                  console.error(
                    `❌ Subscribers API call failed for "${audience.name}":`,
                    subscribersResponse.status
                  );
                }
                actualCount = 0;
              }
            } catch (error) {
              if (EMAIL_DEBUG) {
                console.error(
                  `❌ Error calling subscribers API for "${audience.name}":`,
                  error
                );
              }
              actualCount = 0;
            }
          } else {
            // For dynamic audiences, calculate from filters
            if (EMAIL_DEBUG) {
              console.log(
                `🔄 DYNAMIC AUDIENCE - Calculating for "${audience.name}"`
              );
            }
            actualCount = await calculateSubscriberCount(
              supabase,
              audience.filters || {}
            );
            if (EMAIL_DEBUG) {
              console.log(
                `📊 DYNAMIC AUDIENCE "${audience.name}": ${actualCount} subscribers (calculated)`
              );
            }
          }
        } else {
          // For dynamic audiences, calculate from filters
          if (EMAIL_DEBUG) {
            console.log(
              `🔄 NO FILTERS OBJECT - Treating as dynamic audience "${audience.name}"`
            );
          }
          actualCount = await calculateSubscriberCount(
            supabase,
            audience.filters || {}
          );
          if (EMAIL_DEBUG) {
            console.log(
              `📊 NO FILTERS AUDIENCE "${audience.name}": ${actualCount} subscribers (calculated)`
            );
          }
        }

        const result = {
          ...audience,
          subscriber_count: actualCount,
        };

        if (EMAIL_DEBUG) {
          console.log(
            `✅ Final result for "${audience.name}": subscriber_count=${result.subscriber_count}`
          );
        }
        return result;
      })
    );

    if (EMAIL_DEBUG) {
      console.log(
        `🏁 Finished processing all audiences. Returning ${audiencesWithCounts.length} audiences.`
      );
    }

    // Get total count
    const { count, error: countError } = await supabase
      .from("email_audiences")
      .select("*", { count: "exact", head: true });

    if (countError) {
    if (EMAIL_DEBUG) {
      console.error("Error getting audiences count:", countError);
    }
    }

    return NextResponse.json({
      audiences: audiencesWithCounts || [],
      total: count || 0,
      limit,
      offset,
      mode,
    });
  } catch (error) {
    if (EMAIL_DEBUG) {
      console.error("Audiences API error:", error);
    }
    return NextResponse.json(
      {
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}

// POST /api/email-campaigns/audiences - Create new audience
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
    const { name, description, filters } = body;

    if (!name) {
      return NextResponse.json(
        {
          error: "Name is required",
        },
        { status: 400 }
      );
    }

    // Calculate initial subscriber count
    let initialCount = 0;
    if (filters && typeof filters === "object" && filters !== null) {
      const filtersObj = filters as any;
      if (filtersObj.audience_type === "static") {
        // For static audiences, start with 0 subscribers
        initialCount = 0;
      } else {
        // For dynamic audiences, calculate from filters
        initialCount = await calculateSubscriberCount(supabase, filters || {});
      }
    } else {
      // Default to dynamic audience behavior
      initialCount = await calculateSubscriberCount(supabase, filters || {});
    }

    // Create new audience
    const { data: audience, error } = await supabase
      .from("email_audiences")
      .insert({
        name,
        description: description || null,
        filters: filters || {},
        created_by: user.id,
        subscriber_count: initialCount,
      })
      .select("*")
      .single();

    if (error) {
      console.error("Error creating audience:", error);
      return NextResponse.json(
        {
          error: "Failed to create audience",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ audience }, { status: 201 });
  } catch (error) {
    console.error("Create audience API error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}
