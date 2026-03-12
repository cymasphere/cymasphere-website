/**
 * @fileoverview Shared utility to resolve audience IDs to subscriber lists
 *
 * Used by send.ts (immediate sends) and process-scheduled (scheduled sends).
 * Handles static and dynamic audiences, exclusion lists, and active-only filtering.
 *
 * @module utils/email-campaigns/get-subscribers
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { AudienceFilter, AudienceFilterRule, SubscriberRecord } from "@/types/email-campaigns";

/**
 * @brief Resolves audience IDs (and excluded IDs) to a list of active subscribers
 *
 * @param supabase Authenticated Supabase client
 * @param audienceIds Included audience IDs
 * @param excludedAudienceIds Optional excluded audience IDs
 * @returns SubscriberRecord[] (active only; unsubscribed/INACTIVE excluded)
 */
export async function getSubscribersForAudiences(
  supabase: SupabaseClient,
  audienceIds: string[],
  excludedAudienceIds: string[] = []
): Promise<SubscriberRecord[]> {
  if (!audienceIds || audienceIds.length === 0) {
    return [];
  }

  const allSubscribers = new Set<string>();
  const subscriberDetails = new Map<string, SubscriberRecord>();

  for (const audienceId of audienceIds) {
    const { data: audience } = await supabase
      .from("email_audiences")
      .select("id, name, filters")
      .eq("id", audienceId)
      .single();

    if (!audience) continue;

    const filters = (audience.filters as AudienceFilter | null) || {};
    const rules = filters.rules || [];
    let statusValue: string | null = null;
    let subscriptionValue: string | null = null;
    const additionalRules: AudienceFilterRule[] = [];

    for (const rule of rules) {
      if (rule.field === "status") statusValue = rule.value as string;
      else if (rule.field === "subscription") subscriptionValue = rule.value as string;
      else additionalRules.push(rule);
    }

    const effectiveStatus = statusValue || "active";
    let subscribers: SubscriberRecord[] = [];

    if (filters.audience_type === "static") {
      const { data: relations, error: relationsError } = await supabase
        .from("email_audience_subscribers")
        .select(
          `
          subscriber_id,
          subscribers (
            id,
            email,
            status,
            created_at,
            metadata,
            user_id
          )
        `
        )
        .eq("audience_id", audienceId);

      if (relationsError) continue;

      const raw = ((relations || []) as Array<{ subscribers: SubscriberRecord | SubscriberRecord[] | null }>)
        .flatMap((rel) => {
          const s = rel.subscribers;
          return Array.isArray(s) ? s : s ? [s] : [];
        })
        .filter((s): s is SubscriberRecord => Boolean(s));
      subscribers = raw;
    } else {
      let query = supabase
        .from("subscribers")
        .select("id, email, status, created_at, metadata, user_id")
        .eq("status", effectiveStatus);

      if (subscriptionValue) {
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("id")
          .eq("subscription", subscriptionValue);
        const profileIds = (profilesData || []).map((p: { id: string }) => p.id);
        if (profileIds.length === 0) continue;
        query = query.in("user_id", profileIds);
      }

      const { data: dynamicSubscribers, error: dynamicError } = await query;
      if (dynamicError) continue;
      subscribers = (dynamicSubscribers || []) as SubscriberRecord[];
    }

    for (const sub of subscribers) {
      if (sub.status === "INACTIVE" || sub.status === "unsubscribed") continue;
      allSubscribers.add(sub.id);
      const meta = (sub.metadata as Record<string, unknown>) || {};
      const firstName = meta.first_name ?? sub.first_name ?? "";
      const lastName = meta.last_name ?? sub.last_name ?? "";
      subscriberDetails.set(sub.id, {
        ...sub,
        id: sub.id,
        email: sub.email,
        status: sub.status,
        metadata: meta,
        first_name: firstName as string | null,
        last_name: lastName as string | null,
        name: [firstName, lastName].filter(Boolean).join(" ") || sub.email.split("@")[0],
      });
    }
  }

  for (const excludedAudienceId of excludedAudienceIds) {
    const { data: excludedAudience } = await supabase
      .from("email_audiences")
      .select("id, name, filters")
      .eq("id", excludedAudienceId)
      .single();

    if (!excludedAudience) continue;

    const excludedFilters = (excludedAudience.filters as AudienceFilter | null) || {};
    const rules = excludedFilters.rules || [];
    let statusValue: string | null = null;
    let subscriptionValue: string | null = null;

    for (const rule of rules) {
      if (rule.field === "status") statusValue = rule.value as string;
      else if (rule.field === "subscription") subscriptionValue = rule.value as string;
    }

    const effectiveStatus = statusValue || "active";
    let excludedSubscribers: SubscriberRecord[] = [];

    if (excludedFilters.audience_type === "static") {
      const { data: relations, error: relationsError } = await supabase
        .from("email_audience_subscribers")
        .select("subscriber_id, subscribers (id, email, status, metadata, user_id)")
        .eq("audience_id", excludedAudienceId);

      if (relationsError) continue;
      excludedSubscribers = ((relations || []) as Array<{ subscribers: SubscriberRecord | SubscriberRecord[] | null }>)
        .flatMap((rel) => {
          const s = rel.subscribers;
          return Array.isArray(s) ? s : s ? [s] : [];
        })
        .filter((s): s is SubscriberRecord => Boolean(s));
    } else {
      let query = supabase
        .from("subscribers")
        .select("id, email, status, metadata, user_id")
        .eq("status", effectiveStatus);

      if (subscriptionValue) {
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("id")
          .eq("subscription", subscriptionValue);
        const profileIds = (profilesData || []).map((p: { id: string }) => p.id);
        if (profileIds.length > 0) query = query.in("user_id", profileIds);
      }

      const { data: dynamicSubscribers, error: dynamicError } = await query;
      if (dynamicError) continue;
      excludedSubscribers = (dynamicSubscribers || []) as SubscriberRecord[];
    }

    for (const sub of excludedSubscribers) {
      allSubscribers.delete(sub.id);
      subscriberDetails.delete(sub.id);
    }
  }

  return Array.from(allSubscribers)
    .map((id) => subscriberDetails.get(id))
    .filter((s): s is SubscriberRecord => s != null);
}
