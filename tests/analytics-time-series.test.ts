/**
 * @fileoverview Unit tests for admin analytics time-series helpers.
 * @module tests/analytics-time-series
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  STRIPE_PAGE_LIMIT,
  aggregateAnalyticsTimeSeries,
  buildAnalyticsPeriods,
  churnRateInPeriod,
  classifyTrialDays,
  cumulativeUsersAt,
  mrrAt,
  netRevenueInPeriod,
  wasPaidSubscriptionActiveAt,
} from "../lib/admin/analytics-time-series";

describe("analytics-time-series helpers", () => {
  it("keeps Stripe page limit within API max", () => {
    assert.ok(STRIPE_PAGE_LIMIT <= 100);
    assert.ok(STRIPE_PAGE_LIMIT >= 1);
  });

  it("builds clamped month and year periods", () => {
    const now = new Date("2026-07-25T12:00:00Z");
    const month = buildAnalyticsPeriods("month", now);
    const year = buildAnalyticsPeriods("year", now);
    assert.equal(month.length, 7);
    assert.equal(year.length, 12);
    assert.ok(month.every((p) => p.endTs >= p.startTs));
    assert.ok(month[month.length - 1].endTs <= Math.floor(now.getTime() / 1000));
  });

  it("classifies 7-day and 14-day trials", () => {
    const start = 1_700_000_000;
    assert.equal(classifyTrialDays(start, start + 7 * 86400), "seven");
    assert.equal(classifyTrialDays(start, start + 14 * 86400), "fourteen");
    assert.equal(classifyTrialDays(start, start + 2 * 86400), null);
  });

  it("treats paid actives and excludes trials from paid-active checks", () => {
    assert.equal(
      wasPaidSubscriptionActiveAt(
        { id: "1", created: 100, status: "active" },
        200
      ),
      true
    );
    assert.equal(
      wasPaidSubscriptionActiveAt(
        {
          id: "2",
          created: 100,
          status: "trialing",
          trial_start: 100,
          trial_end: 300,
        },
        200
      ),
      false
    );
    assert.equal(
      wasPaidSubscriptionActiveAt(
        { id: "3", created: 100, status: "canceled", canceled_at: 150 },
        200
      ),
      false
    );
    assert.equal(
      wasPaidSubscriptionActiveAt(
        { id: "4", created: 100, status: "canceled", canceled_at: 250 },
        200
      ),
      true
    );
  });

  it("nets charges and refunds for period revenue", () => {
    const revenue = netRevenueInPeriod(
      [
        { created: 110, type: "charge", amount: 5000 },
        { created: 120, type: "refund", amount: -1000 },
        { created: 50, type: "charge", amount: 9999 },
      ],
      100,
      200
    );
    assert.equal(revenue, 40);
  });

  it("computes MRR from monthly and annual paid subs", () => {
    const value = mrrAt(
      [
        {
          id: "m",
          created: 1,
          status: "active",
          items: {
            data: [
              { price: { unit_amount: 2000, recurring: { interval: "month" } } },
            ],
          },
        },
        {
          id: "y",
          created: 1,
          status: "active",
          items: {
            data: [
              {
                price: { unit_amount: 12000, recurring: { interval: "year" } },
              },
            ],
          },
        },
        {
          id: "t",
          created: 1,
          status: "trialing",
          trial_start: 1,
          trial_end: 999,
          items: {
            data: [
              { price: { unit_amount: 2000, recurring: { interval: "month" } } },
            ],
          },
        },
      ],
      500
    );
    assert.equal(value, 30);
  });

  it("excludes trial cancellations from churn", () => {
    const rate = churnRateInPeriod(
      [
        { id: "a", created: 1, status: "active" },
        { id: "b", created: 1, status: "active" },
        {
          id: "c",
          created: 1,
          status: "canceled",
          canceled_at: 150,
          trial_start: 1,
          trial_end: 200,
        },
        {
          id: "d",
          created: 1,
          status: "canceled",
          canceled_at: 160,
        },
      ],
      100,
      200
    );
    // Paid-active at start: a, b, d (3). Paid cancel in window: d only → ~33.3%
    assert.equal(rate, 33.3);
  });

  it("builds cumulative users from baseline + window customers", () => {
    assert.equal(
      cumulativeUsersAt(
        100,
        [{ created: 150 }, { created: 250 }, { created: 50 }],
        200,
        100
      ),
      99
    );
  });

  it("aggregates a full series with expected shape", () => {
    const now = new Date("2026-07-25T12:00:00Z");
    const nowTs = Math.floor(now.getTime() / 1000);
    const windowStart = nowTs - 30 * 86400;
    const series = aggregateAnalyticsTimeSeries({
      timeRange: "month",
      now,
      totalUsers: 10,
      windowStartTs: windowStart,
      customers: [{ created: nowTs - 86400 }],
      transactions: [
        {
          created: nowTs - 3600,
          type: "charge",
          amount: 2500,
        },
      ],
      subscriptions: [
        {
          id: "s1",
          created: windowStart - 10000,
          status: "active",
          items: {
            data: [
              { price: { unit_amount: 1000, recurring: { interval: "month" } } },
            ],
          },
        },
      ],
    });
    assert.equal(series.length, 7);
    assert.ok(series.every((p) => typeof p.date === "string"));
    assert.ok(series.some((p) => p.revenue > 0));
    assert.ok(series.every((p) => p.mrr === 10));
  });
});
