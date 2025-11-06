/**
 * Shared utility for calculating subscriber counts for email audiences
 * Extracted from app/api/email-campaigns/audiences/route.ts
 */

const EMAIL_DEBUG = process.env.EMAIL_DEBUG === "1";

/**
 * Calculate subscriber count for an audience based on filters
 */
export async function calculateSubscriberCount(supabase: any, filters: any): Promise<number> {
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
      let hasTrialStatusRule = false;
      let subscriptionValue = null;
      let statusValue = null;
      let trialStatusValue = null;

      // Extract all rule values
      for (const rule of filters.rules) {
        if (rule.field === "subscription") {
          hasSubscriptionRule = true;
          subscriptionValue = rule.value;
        } else if (rule.field === "status") {
          hasStatusRule = true;
          statusValue = rule.value;
        } else if (rule.field === "trial_status") {
          hasTrialStatusRule = true;
          trialStatusValue = rule.value;
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

      // Handle trial_status rule
      if (hasTrialStatusRule) {
        const effectiveStatus = statusValue || "active";
        const nowIso = new Date().toISOString();
        
        let profilesQuery = supabase.from("profiles").select("id");
        
        if (trialStatusValue === "active") {
          profilesQuery = profilesQuery.gt("trial_expiration", nowIso).eq("subscription", "none");
        } else if (trialStatusValue === "expired") {
          profilesQuery = profilesQuery.lte("trial_expiration", nowIso);
        }
        
        const { data: profilesData } = await profilesQuery;
        
        if (!profilesData || profilesData.length === 0) {
          if (EMAIL_DEBUG) {
            console.log(`No profiles found with trial_status '${trialStatusValue}'`);
          }
          return 0;
        }
        
        const profileIds = profilesData.map((p: any) => p.id);
        if (EMAIL_DEBUG) {
          console.log(`Found ${profileIds.length} profiles with trial_status '${trialStatusValue}'`);
        }
        
        // Count subscribers with matching profile IDs and status
        const { count } = await supabase
          .from("subscribers")
          .select("*", { count: "exact", head: true })
          .eq("status", effectiveStatus)
          .in("user_id", profileIds);
          
        if (EMAIL_DEBUG) {
          console.log(`Final count for trial_status '${trialStatusValue}': ${count}`);
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

