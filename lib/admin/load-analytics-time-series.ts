/**
 * @fileoverview Loads admin analytics chart series from Stripe + Supabase.
 * @module lib/admin/load-analytics-time-series
 * @note Plain server helper (not a "use server" module) so Route Handlers and
 * actions can share one implementation without Turbopack action-cache issues.
 */

import Stripe from "stripe";
import { createSupabaseServiceRole } from "@/utils/supabase/service";
import {
  aggregateAnalyticsTimeSeries,
  type AnalyticsTimeSeriesResult,
} from "@/lib/admin/analytics-time-series";

/** @brief Stripe page size (API max 100). */
const PAGE_LIMIT = 100;

/** @brief Cap pages so the Analytics tab stays under typical serverless limits. */
const MAX_PAGES = 8;

/**
 * @brief Lazy Stripe client so missing env at import time cannot poison the module.
 * @returns Configured Stripe SDK instance.
 */
function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("Stripe is not configured");
  }
  return new Stripe(key, {
    timeout: 15000,
    maxNetworkRetries: 1,
  });
}

/**
 * @brief Paginate a Stripe list with a hard page/time-safe cap.
 * @param listPage Fetches one page given an optional starting_after id.
 * @returns Collected items and whether more pages were left unread.
 */
async function listStripePagesCapped<T extends { id: string }>(
  listPage: (startingAfter?: string) => Promise<Stripe.ApiList<T>>
): Promise<{ items: T[]; truncated: boolean }> {
  const items: T[] = [];
  let startingAfter: string | undefined;
  let hasMore = true;
  let pages = 0;

  while (hasMore && pages < MAX_PAGES) {
    const page = await listPage(startingAfter);
    pages += 1;
    items.push(...page.data);
    hasMore = page.has_more;
    if (page.data.length > 0) {
      startingAfter = page.data[page.data.length - 1].id;
    } else {
      hasMore = false;
    }
  }

  return { items, truncated: hasMore };
}

/**
 * @brief Fetch and aggregate Analytics tab time-series (assumes caller authorized).
 * @param timeRange Month (~30d) or year (12 calendar months).
 * @returns Structured result with data and optional error/warnings.
 * @example
 * const result = await loadAnalyticsTimeSeries("month");
 */
export async function loadAnalyticsTimeSeries(
  timeRange: "month" | "year"
): Promise<AnalyticsTimeSeriesResult> {
  const started = Date.now();
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return { data: [], error: "Stripe is not configured" };
    }

    const stripe = getStripe();
    const supabase = await createSupabaseServiceRole();
    const usersResult = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true });

    if (usersResult.error) {
      console.error(
        "[loadAnalyticsTimeSeries] profiles count error:",
        usersResult.error
      );
      return { data: [], error: "Failed to load user totals" };
    }

    const totalUsers = usersResult.count || 0;
    const warnings: string[] = [];

    const startDate = new Date();
    if (timeRange === "month") {
      startDate.setDate(startDate.getDate() - 30);
    } else {
      startDate.setMonth(startDate.getMonth() - 12);
    }
    const startTimestamp = Math.floor(startDate.getTime() / 1000);
    const endTimestamp = Math.floor(Date.now() / 1000);

    const [txPage, activePage, trialingPage, canceledPage] = await Promise.all([
      listStripePagesCapped((startingAfter) =>
        stripe.balanceTransactions.list({
          created: { gte: startTimestamp, lte: endTimestamp },
          limit: PAGE_LIMIT,
          starting_after: startingAfter,
        })
      ),
      listStripePagesCapped((startingAfter) =>
        stripe.subscriptions.list({
          status: "active",
          limit: PAGE_LIMIT,
          starting_after: startingAfter,
        })
      ),
      listStripePagesCapped((startingAfter) =>
        stripe.subscriptions.list({
          status: "trialing",
          limit: PAGE_LIMIT,
          starting_after: startingAfter,
        })
      ),
      listStripePagesCapped((startingAfter) =>
        stripe.subscriptions.list({
          status: "canceled",
          created: { gte: startTimestamp, lte: endTimestamp },
          limit: PAGE_LIMIT,
          starting_after: startingAfter,
        })
      ),
    ]);

    if (
      txPage.truncated ||
      activePage.truncated ||
      trialingPage.truncated ||
      canceledPage.truncated
    ) {
      warnings.push(
        "Some Stripe data was truncated for performance; charts may undercount."
      );
    }

    const subscriptions = [
      ...activePage.items,
      ...trialingPage.items,
      ...canceledPage.items,
    ];

    const data = aggregateAnalyticsTimeSeries({
      timeRange,
      totalUsers,
      transactions: txPage.items,
      subscriptions,
      customers: [],
      windowStartTs: startTimestamp,
    });

    console.log(
      `[loadAnalyticsTimeSeries] ok range=${timeRange} points=${data.length} txs=${txPage.items.length} subs=${subscriptions.length} ${Date.now() - started}ms`
    );

    return warnings.length > 0 ? { data, warnings } : { data };
  } catch (error) {
    console.error("[loadAnalyticsTimeSeries] failed:", error);
    return {
      data: [],
      error:
        error instanceof Error ? error.message : "Failed to load analytics",
    };
  }
}
