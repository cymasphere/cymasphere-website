/**
 * @fileoverview Pure helpers for admin analytics time-series aggregation.
 * @module lib/admin/analytics-time-series
 */

export type AnalyticsTimeSeriesPoint = {
  date: string;
  users: number;
  subscriptions: number;
  revenue: number;
  mrr: number;
  churnRate: number;
  sevenDayTrials: number;
  fourteenDayTrials: number;
};

/** @brief Server-action result for admin analytics charts. */
export type AnalyticsTimeSeriesResult = {
  data: AnalyticsTimeSeriesPoint[];
  error?: string;
  warnings?: string[];
};

export type AnalyticsPeriod = {
  label: string;
  startTs: number;
  endTs: number;
};

/** Stripe list page size (API max). */
export const STRIPE_PAGE_LIMIT = 100;

/** Safety cap: 40 pages × 100 = 4,000 objects per list. */
export const STRIPE_MAX_PAGES = 40;

type SubscriptionLike = {
  id: string;
  created: number;
  status: string;
  canceled_at?: number | null;
  cancel_at_period_end?: boolean;
  trial_start?: number | null;
  trial_end?: number | null;
  items?: {
    data: Array<{
      price?: {
        unit_amount?: number | null;
        recurring?: { interval?: string | null } | null;
      } | null;
    }>;
  };
};

type BalanceTxLike = {
  created: number;
  type: string;
  amount: number;
};

type CustomerLike = {
  created: number;
};

/**
 * @brief Build month (~4-day) or year (calendar month) period buckets ending at now.
 * @param timeRange Month or year window.
 * @param now Reference "now" (injectable for tests).
 */
export function buildAnalyticsPeriods(
  timeRange: "month" | "year",
  now: Date = new Date()
): AnalyticsPeriod[] {
  const periods: AnalyticsPeriod[] = [];
  const count = timeRange === "month" ? 7 : 12;
  const nowTs = Math.floor(now.getTime() / 1000);

  for (let i = count - 1; i >= 0; i--) {
    const periodDate = new Date(now);
    if (timeRange === "month") {
      periodDate.setDate(periodDate.getDate() - i * 4);
    } else {
      periodDate.setMonth(periodDate.getMonth() - i);
      periodDate.setDate(1);
    }

    const periodStart = new Date(periodDate);
    periodStart.setHours(0, 0, 0, 0);

    const periodEnd = new Date(periodStart);
    if (timeRange === "month") {
      periodEnd.setDate(periodEnd.getDate() + 4);
      periodEnd.setHours(23, 59, 59, 999);
    } else {
      periodEnd.setMonth(periodEnd.getMonth() + 1);
      periodEnd.setDate(0);
      periodEnd.setHours(23, 59, 59, 999);
    }

    let endTs = Math.floor(periodEnd.getTime() / 1000);
    if (endTs > nowTs) endTs = nowTs;

    periods.push({
      label:
        timeRange === "month"
          ? periodDate.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })
          : periodDate.toLocaleDateString("en-US", {
              month: "short",
              year: "numeric",
            }),
      startTs: Math.floor(periodStart.getTime() / 1000),
      endTs,
    });
  }

  return periods;
}

/**
 * @brief Whether a subscription was paying/active (non-trial) at a timestamp.
 * @param sub Subscription-like object.
 * @param atTimestamp Unix seconds.
 */
export function wasPaidSubscriptionActiveAt(
  sub: SubscriptionLike,
  atTimestamp: number
): boolean {
  if (sub.created > atTimestamp) return false;
  if (sub.status === "incomplete_expired") return false;
  if (sub.status === "trialing") return false;
  // Still inside trial window (e.g. later canceled without converting)
  if (wasTrialingAt(sub, atTimestamp)) return false;

  if (sub.status === "canceled") {
    if (!sub.canceled_at) return false;
    return sub.canceled_at > atTimestamp;
  }

  if (
    sub.status === "active" ||
    sub.status === "past_due" ||
    sub.status === "unpaid"
  ) {
    return true;
  }

  return false;
}

/**
 * @brief Whether a subscription was in trial at a timestamp.
 * @param sub Subscription-like object.
 * @param atTimestamp Unix seconds.
 */
export function wasTrialingAt(
  sub: SubscriptionLike,
  atTimestamp: number
): boolean {
  if (!sub.trial_start || !sub.trial_end) return false;
  return sub.trial_start <= atTimestamp && sub.trial_end > atTimestamp;
}

/**
 * @brief Classify Stripe trial length into 7-day vs 14-day buckets.
 * @param trialStart Trial start unix timestamp.
 * @param trialEnd Trial end unix timestamp.
 */
export function classifyTrialDays(
  trialStart: number,
  trialEnd: number
): "seven" | "fourteen" | null {
  const days = (trialEnd - trialStart) / (60 * 60 * 24);
  if (days >= 5.5 && days < 10) return "seven";
  if (days >= 10 && days <= 16) return "fourteen";
  return null;
}

/**
 * @brief Net revenue in a period from balance transactions (charges minus refunds).
 * @param transactions Balance transactions.
 * @param startTs Inclusive start.
 * @param endTs Inclusive end.
 */
export function netRevenueInPeriod(
  transactions: BalanceTxLike[],
  startTs: number,
  endTs: number
): number {
  const raw =
    transactions
      .filter((t) => t.created >= startTs && t.created <= endTs)
      .filter(
        (t) =>
          t.type === "charge" ||
          t.type === "payment" ||
          t.type === "refund" ||
          t.type === "payment_refund"
      )
      .reduce((sum, t) => sum + t.amount, 0) / 100;
  return Math.round(raw * 100) / 100;
}

/**
 * @brief MRR from paid active subscriptions at a timestamp.
 * @param subscriptions Subscription list.
 * @param atTimestamp Unix seconds.
 */
export function mrrAt(
  subscriptions: SubscriptionLike[],
  atTimestamp: number
): number {
  let mrrRaw = 0;
  for (const sub of subscriptions) {
    if (!wasPaidSubscriptionActiveAt(sub, atTimestamp)) continue;
    const item = sub.items?.data?.[0];
    if (!item?.price) continue;
    const amount = (item.price.unit_amount || 0) / 100;
    const interval = item.price.recurring?.interval;
    if (interval === "month") mrrRaw += amount;
    else if (interval === "year") mrrRaw += amount / 12;
  }
  return Math.round(mrrRaw * 100) / 100;
}

/**
 * @brief Paid-sub churn rate for a period (excludes trials).
 * @param subscriptions Subscription list.
 * @param startTs Period start.
 * @param endTs Period end.
 */
export function churnRateInPeriod(
  subscriptions: SubscriptionLike[],
  startTs: number,
  endTs: number
): number {
  const activeAtStart = subscriptions.filter((s) =>
    wasPaidSubscriptionActiveAt(s, startTs)
  ).length;

  const canceledPaid = subscriptions.filter((s) => {
    if (!s.canceled_at) return false;
    if (s.canceled_at < startTs || s.canceled_at > endTs) return false;
    // Exclude pure trial cancellations (never converted)
    if (s.status === "canceled" && s.trial_end && s.canceled_at <= s.trial_end) {
      return false;
    }
    return true;
  }).length;

  if (activeAtStart <= 0) return 0;
  return Math.round((canceledPaid / activeAtStart) * 1000) / 10;
}

/**
 * @brief Count trials overlapping a period by 7/14-day class.
 * @param subscriptions Subscription list.
 * @param startTs Period start.
 * @param endTs Period end.
 */
export function trialCountsInPeriod(
  subscriptions: SubscriptionLike[],
  startTs: number,
  endTs: number
): { sevenDayTrials: number; fourteenDayTrials: number } {
  let sevenDayTrials = 0;
  let fourteenDayTrials = 0;
  for (const sub of subscriptions) {
    if (!sub.trial_start || !sub.trial_end) continue;
    if (sub.trial_end < startTs || sub.trial_start > endTs) continue;
    const kind = classifyTrialDays(sub.trial_start, sub.trial_end);
    if (kind === "seven") sevenDayTrials += 1;
    else if (kind === "fourteen") fourteenDayTrials += 1;
  }
  return { sevenDayTrials, fourteenDayTrials };
}

/**
 * @brief Cumulative user estimate: baseline + customers created by period end.
 * @param totalUsers Current total user count.
 * @param customers Customers created inside the analytics window.
 * @param periodEndTs Period end unix seconds.
 * @param windowStartTs Analytics window start.
 */
export function cumulativeUsersAt(
  totalUsers: number,
  customers: CustomerLike[],
  periodEndTs: number,
  windowStartTs: number
): number {
  const createdInWindow = customers.filter((c) => c.created >= windowStartTs);
  const createdByPeriodEnd = createdInWindow.filter(
    (c) => c.created <= periodEndTs
  ).length;
  const baseline = Math.max(0, totalUsers - createdInWindow.length);
  return baseline + createdByPeriodEnd;
}

/**
 * @brief Aggregate chart points from prefetched Stripe/Supabase inputs.
 * @param args Aggregation inputs.
 */
export function aggregateAnalyticsTimeSeries(args: {
  timeRange: "month" | "year";
  now?: Date;
  totalUsers: number;
  transactions: BalanceTxLike[];
  subscriptions: SubscriptionLike[];
  customers: CustomerLike[];
  windowStartTs: number;
}): AnalyticsTimeSeriesPoint[] {
  const now = args.now ?? new Date();
  const periods = buildAnalyticsPeriods(args.timeRange, now);

  return periods.map((period) => {
    const { sevenDayTrials, fourteenDayTrials } = trialCountsInPeriod(
      args.subscriptions,
      period.startTs,
      period.endTs
    );

    return {
      date: period.label,
      users: cumulativeUsersAt(
        args.totalUsers,
        args.customers,
        period.endTs,
        args.windowStartTs
      ),
      subscriptions: args.subscriptions.filter((s) =>
        wasPaidSubscriptionActiveAt(s, period.endTs)
      ).length,
      revenue: netRevenueInPeriod(
        args.transactions,
        period.startTs,
        period.endTs
      ),
      mrr: mrrAt(args.subscriptions, period.endTs),
      churnRate: churnRateInPeriod(
        args.subscriptions,
        period.startTs,
        period.endTs
      ),
      sevenDayTrials,
      fourteenDayTrials,
    };
  });
}
