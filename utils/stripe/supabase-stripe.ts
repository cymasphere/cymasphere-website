/**
 * @fileoverview Supabase Stripe integration utilities
 * 
 * This file contains utilities for checking customer subscription status
 * by querying Supabase Stripe tables (stripe_payment_intents, stripe_subscriptions,
 * stripe_invoices). Handles lifetime purchases, active subscriptions, and
 * invoice history retrieval.
 * 
 * @module utils/stripe/supabase-stripe
 */

"use server";

import { SubscriptionType } from "@/utils/supabase/types";
import { createSupabaseServiceRole } from "@/utils/supabase/service";
import { cancelSubscription } from "./actions";
import Stripe from "stripe";

/**
 * Response type for customer pro subscription check
 */
export type CustomerPurchasedProResponse = {
  success: boolean;
  subscription: SubscriptionType;
  trial_end_date?: Date;
  subscription_expiration?: Date;
  error?: Error | unknown;
};

// Type for Stripe metadata and nested properties
type StripeSubscriptionAttrs = {
  metadata?: { price_id?: string };
  refunded?: boolean;
  status?:
    | "incomplete"
    | "incomplete_expired"
    | "trialing"
    | "active"
    | "past_due"
    | "canceled"
    | "unpaid"
    | "paused";
  items?: { data?: Array<{ price?: { id?: string } }> };
  trial_end?: number;
};

/**
 * @brief Checks if a customer has purchased a pro subscription from Supabase Stripe tables
 * 
 * Determines customer subscription status by checking:
 * 1. Stripe invoices for lifetime purchases (highest priority)
 * 2. Payment intents for lifetime purchases (secondary check)
 * 3. Active subscriptions (monthly/annual)
 * 
 * If customer has both lifetime and active subscription, automatically cancels
 * the subscription since lifetime takes precedence. Returns subscription type,
 * expiration dates, and trial information.
 * 
 * @param customer_id Stripe customer ID to check
 * @returns Promise with subscription status, expiration dates, and trial info
 * @note Lifetime purchases take precedence over subscriptions
 * @note Automatically cancels active subscriptions if lifetime is detected
 * @note Handles invalid customer IDs gracefully (returns "none")
 * @note Checks invoices first for most reliable lifetime detection
 * 
 * @example
 * ```typescript
 * const result = await customerPurchasedProFromSupabase("cus_abc123");
 * // Returns: { success: true, subscription: "lifetime", ... }
 * ```
 */
export async function customerPurchasedProFromSupabase(
  customer_id: string
): Promise<CustomerPurchasedProResponse> {
  try {
    const supabase = await createSupabaseServiceRole();
    let subscriptionType: SubscriptionType = "none";
    let current_period_end: Date | undefined;
    let trial_end_date: Date | undefined;
    let hasLifetime = false;
    let activeSubscriptionId: string | undefined;

    // FIRST: Check invoices directly from Stripe API for lifetime purchases
    // This is the most reliable method and handles $0 invoices with coupons
    // Do this BEFORE checking payment intents so it takes priority
    const lifetimePriceId = process.env.STRIPE_PRICE_ID_LIFETIME;
    const lifetimePriceId2 = process.env.LIFETIME_PRICE_ID_2;

    if (lifetimePriceId) {
      try {
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
        console.log(
          `[customerPurchasedProFromSupabase] Checking invoices FIRST for customer ${customer_id}...`
        );
        const invoices = await stripe.invoices.list({
          customer: customer_id,
          limit: 100,
          status: "paid",
          expand: ["data.lines.data.price"],
        });

        console.log(
          `[customerPurchasedProFromSupabase] Found ${invoices.data.length} paid invoices for customer ${customer_id}`
        );

        const hasLifetimeInvoice = invoices.data.some((invoice) => {
          // Check if invoice has lifetime metadata (same as normal checkout purchases)
          const hasMetadata = invoice.metadata?.purchase_type === "lifetime";

          // Check if invoice line items contain lifetime price ID
          const hasLifetimePrice = invoice.lines.data.some(
            (line) => {
              const price = (line as { price?: { id?: string } }).price;
              return (
                price?.id === lifetimePriceId ||
                (lifetimePriceId2 && price?.id === lifetimePriceId2)
              );
            }
          );

          if (hasMetadata || hasLifetimePrice) {
            console.log(
              `[customerPurchasedProFromSupabase] ✅ Lifetime invoice found: ${invoice.id} (metadata: ${hasMetadata}, price: ${hasLifetimePrice})`
            );
            return true;
          }
          return false;
        });

        if (hasLifetimeInvoice) {
          console.log(
            `[customerPurchasedProFromSupabase] ✅ Setting hasLifetime = true for customer ${customer_id} based on invoice (PRIORITY CHECK)`
          );
          hasLifetime = true;
          subscriptionType = "lifetime";
        } else {
          console.log(
            `[customerPurchasedProFromSupabase] ❌ No lifetime invoice found for customer ${customer_id}`
          );
        }
      } catch (invoiceError) {
        console.error(
          `[customerPurchasedProFromSupabase] ❌ Error checking invoices for customer ${customer_id}:`,
          invoiceError
        );
        // Continue - don't fail the whole check if invoice lookup fails
      }
    } else {
      console.warn(
        `[customerPurchasedProFromSupabase] ⚠️ STRIPE_PRICE_ID_LIFETIME not set, skipping invoice check`
      );
    }

    // Then check for lifetime purchase from payment intents (secondary check)
    const { data: paymentIntents, error: piError } = await supabase
      .schema("stripe_tables" as any)
      .from("stripe_payment_intents")
      .select("*")
      .eq("customer", customer_id)
      .order("created", { ascending: false });

    if (piError) {
      // Check if it's a Stripe API error (400 Bad Request usually means invalid customer ID)
      const errorMessage = piError.message || String(piError);
      if (
        errorMessage.includes("400 Bad Request") ||
        errorMessage.includes("request middleware failed")
      ) {
        // Invalid customer ID or customer doesn't exist in Stripe
        // Continue with empty payment intents array instead of returning error
        console.warn(
          `Could not fetch payment intents for customer ${customer_id}: Customer may not exist in Stripe`
        );
        // Continue with empty array - will check subscriptions below
      } else {
        console.error("Error querying payment intents:", piError);
        return {
          success: false,
          subscription: "none",
          error: piError,
        };
      }
    }

    // Check payment intents for lifetime purchase (only if invoice check didn't find lifetime).
    const safePaymentIntents = paymentIntents || [];

    for (const paymentIntent of safePaymentIntents) {
      const attrs =
        ((paymentIntent as any).attrs as {
          metadata?: { purchase_type?: string };
          status?: string;
          dispute?: unknown | null;
          refunded?: boolean;
        }) || {};

      // Check metadata - this should be set by checkout/payment-intent routes for all new flows
      const hasLifetimeMetadata = attrs?.metadata?.purchase_type === "lifetime";

      const isLifetimePurchase = hasLifetimeMetadata;

      if (isLifetimePurchase) {
        // If this is a lifetime purchase, check its status
        if (attrs.status === "succeeded" && !attrs.dispute && !attrs.refunded) {
          hasLifetime = true;
          subscriptionType = "lifetime";
        } else if (
          attrs.status !== "succeeded" &&
          attrs.status !== "canceled"
        ) {
          // Payment intent exists with lifetime metadata but not succeeded yet
          // Check if there's a corresponding paid invoice (for $0 invoices with coupons)
          // Don't set hasLifetime = false here - let the invoice check handle it
          console.log(
            `ℹ️ Found payment intent with lifetime metadata but status ${attrs.status} for customer ${customer_id} - will check invoices`
          );
        } else if (attrs.status === "canceled" || attrs.refunded) {
          // If this lifetime purchase was canceled or refunded, they no longer have lifetime access
          hasLifetime = false;
        }
      }
    }

    // Check for active subscriptions (even if we found a lifetime purchase)
    const { data: subscriptions, error: subscriptionsError } = await supabase
      .schema("stripe_tables" as any)
      .from("stripe_subscriptions")
      .select("*")
      .eq("customer", customer_id)
      .order("current_period_end", { ascending: false });

    let safeSubscriptions = subscriptions || [];

    if (subscriptionsError) {
      // Check if it's a Stripe API error (400 Bad Request usually means invalid customer ID)
      const errorMessage =
        subscriptionsError.message || String(subscriptionsError);
      if (
        errorMessage.includes("400 Bad Request") ||
        errorMessage.includes("request middleware failed")
      ) {
        // Invalid customer ID or customer doesn't exist in Stripe
        // Continue with empty subscriptions array
        console.warn(
          `Could not fetch subscriptions for customer ${customer_id}: Customer may not exist in Stripe`
        );
        safeSubscriptions = [];
        // Continue with empty array - will return "none" subscription below
      } else {
        console.error(
          "Error querying stripe_subscriptions:",
          subscriptionsError
        );
        return {
          success: false,
          subscription: "none",
          error: subscriptionsError,
        };
      }
    }

    // Get subscription details from the subscriptions
    const monthlyPriceId = process.env.STRIPE_PRICE_ID_MONTHLY!;
    const annualPriceId = process.env.STRIPE_PRICE_ID_ANNUAL!;

    let hasActiveSubscription = false;
    let activeSubscriptionType: "monthly" | "annual" | undefined;

    for (const subscription of safeSubscriptions) {
      // Skip canceled or incomplete subscriptions
      const attrs = (subscription as any)
        .attrs as StripeSubscriptionAttrs | null;

      switch (attrs?.status) {
        case "active":
        case "trialing":
        case "past_due":
          break;
        default:
          continue;
      }

      // Check subscription items
      const items = attrs?.items?.data || [];
      for (const item of items) {
        const priceId = item.price?.id;
        if (priceId === monthlyPriceId || priceId === annualPriceId) {
          // Consider active subscriptions - those that are active, trialing, or past_due
          // These are statuses where the customer still has access to the service
          hasActiveSubscription = true;
          activeSubscriptionType =
            priceId === monthlyPriceId ? "monthly" : "annual";
          activeSubscriptionId = (subscription as any).id || undefined;

          // Set expiration date
          if ((subscription as any).current_period_end) {
            current_period_end = new Date(
              (subscription as any).current_period_end
            );
          }

          // Check for trial end date
          const trialEnd = attrs?.trial_end;
          if (trialEnd) {
            trial_end_date = new Date(trialEnd * 1000);
          }

          break;
        }
      }

      if (hasActiveSubscription) break;
    }

    /**
     * @brief Resolves monthly/annual access from the live Stripe API when the Supabase mirror is empty.
     * @description Right after `subscriptions.create`, webhook-synced `stripe_tables.stripe_subscriptions`
     *   rows may not exist yet; `updateUserProStatus` would otherwise write `none` to the profile until refresh.
     * @param stripeCustomerId Stripe customer id (cus_…).
     * @returns Active recurring plan from API, or null if none match env price IDs.
     */
    const resolveActiveSubscriptionFromStripeApi = async (
      stripeCustomerId: string,
    ): Promise<{
      type: "monthly" | "annual";
      periodEnd: Date;
      trialEnd: Date | undefined;
      subscriptionId: string;
    } | null> => {
      const secret = process.env.STRIPE_SECRET_KEY?.trim();
      if (!secret || !monthlyPriceId || !annualPriceId) {
        return null;
      }
      const stripe = new Stripe(secret);
      const liveList = await stripe.subscriptions.list({
        customer: stripeCustomerId,
        status: "all",
        limit: 30,
      });
      const activeLive = liveList.data.filter(
        (sub) =>
          sub.status === "active" ||
          sub.status === "trialing" ||
          sub.status === "past_due",
      );
      for (const sub of activeLive) {
        for (const item of sub.items.data) {
          const priceId = item.price?.id;
          if (priceId === monthlyPriceId || priceId === annualPriceId) {
            const attrs = sub as Stripe.Subscription & {
              current_period_end: number;
              trial_end: number | null;
            };
            const periodEndSec = attrs.current_period_end;
            return {
              type: priceId === monthlyPriceId ? "monthly" : "annual",
              periodEnd: new Date(
                (typeof periodEndSec === "number" ? periodEndSec : 0) * 1000,
              ),
              trialEnd:
                typeof attrs.trial_end === "number"
                  ? new Date(attrs.trial_end * 1000)
                  : undefined,
              subscriptionId: sub.id,
            };
          }
        }
      }
      return null;
    };

    if (!hasActiveSubscription) {
      try {
        const fromApi = await resolveActiveSubscriptionFromStripeApi(
          customer_id,
        );
        if (fromApi) {
          hasActiveSubscription = true;
          activeSubscriptionType = fromApi.type;
          activeSubscriptionId = fromApi.subscriptionId;
          current_period_end = fromApi.periodEnd;
          if (fromApi.trialEnd) {
            trial_end_date = fromApi.trialEnd;
          }
          console.log(
            `[customerPurchasedProFromSupabase] Active subscription from Stripe API (mirror lag): ${fromApi.type} for ${customer_id}`,
          );
        }
      } catch (apiErr) {
        console.warn(
          `[customerPurchasedProFromSupabase] Live Stripe API fallback failed for ${customer_id}:`,
          apiErr,
        );
      }
    }

    // If the user has both lifetime and an active subscription, we should cancel the subscription
    if (hasLifetime && hasActiveSubscription && activeSubscriptionId) {
      // Initiate subscription cancellation process
      await cancelSubscription(customer_id, activeSubscriptionId);
    }

    // If user has lifetime, that takes precedence over any subscription
    // CRITICAL: Lifetime status should never be overridden by subscriptions
    if (hasLifetime) {
      subscriptionType = "lifetime";
      console.log(
        `✅ Customer ${customer_id} has lifetime access (detected via ${
          hasLifetime ? "invoice/payment intent" : "unknown"
        })`
      );
    }
    // Otherwise, use the active subscription type if any
    else if (hasActiveSubscription && activeSubscriptionType) {
      subscriptionType = activeSubscriptionType;
    }

    return {
      success: true,
      subscription: subscriptionType,
      trial_end_date,
      subscription_expiration: current_period_end,
    };
  } catch (error) {
    console.error("Error checking customer subscription:", error);
    return {
      success: false,
      subscription: "none",
      error,
    };
  }
}

/**
 * Invoice data interface from Supabase Stripe tables
 */
export interface InvoiceData {
  id: string;
  number?: string;
  amount: number;
  status: string;
  created: string;
  currency: string;
  pdf_url?: string;
  receipt_url?: string;
  /**
   * When set, billing UI should show `t(displayLabelKey)` instead of invoice number / Stripe id
   * (e.g. lifetime rows from PaymentIntents).
   */
  displayLabelKey?: string;
}

/** Parsed `attrs` JSON on mirrored `stripe_tables.stripe_invoices` rows. */
type StripeMirrorInvoiceAttrs = {
  hosted_invoice_url?: string;
  invoice_pdf?: string;
  created?: number;
  number?: string;
  payment_intent?: string | { id?: string };
};

/** Charge-shaped fragment sometimes embedded under PaymentIntent `charges` / `latest_charge`. */
type StripeMirrorChargeAttrs = {
  created?: number;
  status_transitions?: { paid_at?: number | null };
  receipt_url?: string | null;
};

/** Parsed `attrs` JSON on mirrored `stripe_tables.stripe_payment_intents` rows. */
type StripeMirrorPaymentIntentAttrs = {
  /** PaymentIntent `created` (unix seconds in Stripe API). */
  created?: number;
  metadata?: { purchase_type?: string };
  status?: string;
  dispute?: unknown | null;
  refunded?: boolean;
  latest_charge?: string | StripeMirrorChargeAttrs;
  charges?: { data?: Array<StripeMirrorChargeAttrs> };
};

/**
 * @brief Normalizes a Stripe-style timestamp to unix **seconds** (handles accidental ms).
 * @param t Value from Stripe JSON
 * @returns Seconds since epoch, or undefined if invalid
 */
function stripeTimestampToUnixSeconds(t: number | undefined): number | undefined {
  if (t == null || !Number.isFinite(t) || t <= 0) return undefined;
  return t > 1_000_000_000_000 ? Math.floor(t / 1000) : Math.floor(t);
}

/**
 * @brief Picks best unix seconds for “when paid” from mirrored PI attrs (charge paid_at preferred).
 * @param attrs Synced PaymentIntent JSON
 * @returns Unix seconds in a sensible year range, or undefined
 */
function unixSecondsFromMirrorPaymentIntentAttrs(
  attrs: StripeMirrorPaymentIntentAttrs | null | undefined,
): number | undefined {
  if (!attrs) return undefined;

  const candidates: number[] = [];

  const pushSeconds = (v: number | null | undefined) => {
    const s = stripeTimestampToUnixSeconds(v ?? undefined);
    if (s != null) candidates.push(s);
  };

  const fromCharge = (c: StripeMirrorChargeAttrs | undefined) => {
    if (!c) return;
    pushSeconds(c.status_transitions?.paid_at ?? undefined);
    pushSeconds(c.created);
  };

  fromCharge(attrs.charges?.data?.[0]);
  if (attrs.latest_charge && typeof attrs.latest_charge === "object") {
    fromCharge(attrs.latest_charge);
  }

  pushSeconds(attrs.created);

  for (const sec of candidates) {
    const y = new Date(sec * 1000).getUTCFullYear();
    if (y >= 2000 && y <= 2100) {
      return sec;
    }
  }
  return undefined;
}

/**
 * @brief Builds an ISO timestamp for a mirrored PaymentIntent (charge paid time, PI attrs, DB column).
 * @param rowCreated Value from `stripe_payment_intents.created` column
 * @param attrs Synced Stripe PaymentIntent JSON
 * @returns ISO string in UTC
 */
function paymentIntentCreatedIso(
  rowCreated: string | null | undefined,
  attrs: StripeMirrorPaymentIntentAttrs | null | undefined,
): string {
  const fromAttrs = unixSecondsFromMirrorPaymentIntentAttrs(attrs);
  if (fromAttrs != null) {
    return new Date(fromAttrs * 1000).toISOString();
  }
  if (rowCreated) {
    const d = new Date(rowCreated);
    if (!Number.isNaN(d.getTime()) && d.getUTCFullYear() >= 2000) {
      return d.toISOString();
    }
  }
  return new Date().toISOString();
}

/**
 * @brief Collects PaymentIntent ids already represented by synced invoices (avoid duplicate rows).
 * @param rows Raw invoice rows from `stripe_invoices`
 * @returns Set of `pi_…` ids
 */
function paymentIntentIdsFromMirrorInvoices(
  rows: ReadonlyArray<{ attrs?: unknown }>,
): Set<string> {
  const ids = new Set<string>();
  for (const row of rows) {
    const attrs = row.attrs as StripeMirrorInvoiceAttrs | null | undefined;
    const raw = attrs?.payment_intent;
    if (typeof raw === "string" && raw.startsWith("pi_")) {
      ids.add(raw);
    } else if (
      raw &&
      typeof raw === "object" &&
      "id" in raw &&
      typeof (raw as { id?: string }).id === "string"
    ) {
      const id = (raw as { id: string }).id;
      if (id.startsWith("pi_")) ids.add(id);
    }
  }
  return ids;
}

/**
 * @brief Best-effort receipt URL from a mirrored PaymentIntent `attrs` payload.
 * @param attrs Stripe PaymentIntent-shaped JSON from sync
 */
function receiptUrlFromPaymentIntentAttrs(
  attrs: StripeMirrorPaymentIntentAttrs | null | undefined,
): string | undefined {
  if (!attrs) return undefined;
  const fromCharges = attrs.charges?.data?.[0]?.receipt_url;
  if (typeof fromCharges === "string" && fromCharges.length > 0) {
    return fromCharges;
  }
  const lc = attrs.latest_charge;
  if (lc && typeof lc === "object" && "receipt_url" in lc) {
    const url = lc.receipt_url;
    if (typeof url === "string" && url.length > 0) return url;
  }
  return undefined;
}

/**
 * @brief Fetches billing history for a customer from Supabase Stripe mirror tables
 *
 * Merges recurring subscription invoices with succeeded **lifetime** PaymentIntents.
 * Lifetime checkout often has no `stripe_invoices` row (payment mode), so PIs fill the gap.
 *
 * @param customerId Stripe customer ID to fetch invoices for
 * @param limit Max combined rows after merge (default: 10)
 * @returns Promise with invoices array and error status
 * @note Uses service role client to access stripe_tables schema
 * @note Handles invalid customer IDs gracefully (returns empty array)
 * @note Converts amounts from cents to dollars
 *
 * @example
 * ```typescript
 * const result = await getCustomerInvoices("cus_abc123", 20);
 * // Returns: { invoices: [...], error: null }
 * ```
 */
export async function getCustomerInvoices(
  customerId: string | null,
  limit: number = 10,
): Promise<{ invoices: InvoiceData[]; error: string | null }> {
  try {
    if (!customerId) {
      return { invoices: [], error: null };
    }

    // Create Supabase service role client to access the stripe_tables schema
    const supabase = await createSupabaseServiceRole();

    const fetchLimit = Math.max(limit, 10);

    // Query the stripe_invoices table for invoices belonging to this customer
    const { data, error } = await supabase
      .schema("stripe_tables" as any)
      .from("stripe_invoices")
      .select("*")
      .eq("customer", customerId)
      .order("period_end", { ascending: false })
      .limit(fetchLimit);

    if (error) {
      // Check if it's a Stripe API error (400 Bad Request usually means invalid customer ID)
      const errorMessage = error.message || String(error);
      if (
        errorMessage.includes("400 Bad Request") ||
        errorMessage.includes("request middleware failed")
      ) {
        // Invalid customer ID or customer doesn't exist in Stripe
        // Return empty array instead of error to avoid breaking the UI
        console.warn(
          `Could not fetch invoices for customer ${customerId}: Customer may not exist in Stripe`
        );
        return { invoices: [], error: null };
      }
      console.error("Error querying stripe_invoices:", error);
      return { invoices: [], error: null }; // Return empty array instead of error
    }

    const invoiceRows = data || [];

    // Format the invoice data for the UI
    const invoicesFromTable: InvoiceData[] = invoiceRows.map((invoice) => {
      const row = invoice as {
        id?: string | null;
        attrs?: unknown;
        total?: number | null;
        status?: string | null;
        currency?: string | null;
      };
      const attrs = row.attrs as StripeMirrorInvoiceAttrs | null | undefined;

      return {
        id: String(row.id || ""),
        number: attrs?.number,
        amount: (row.total || 0) / 100, // Convert cents to dollars
        status: row.status || "unknown",
        created: new Date(
          attrs?.created ? attrs.created * 1000 : Date.now()
        ).toISOString(),
        currency: row.currency || "usd",
        pdf_url: attrs?.invoice_pdf,
        receipt_url: attrs?.hosted_invoice_url,
      };
    });

    const linkedPiIds = paymentIntentIdsFromMirrorInvoices(invoiceRows);

    const { data: piRows, error: piError } = await supabase
      .schema("stripe_tables" as any)
      .from("stripe_payment_intents")
      .select("*")
      .eq("customer", customerId)
      .order("created", { ascending: false })
      .limit(fetchLimit);

    if (piError) {
      const errorMessage = piError.message || String(piError);
      if (
        errorMessage.includes("400 Bad Request") ||
        errorMessage.includes("request middleware failed")
      ) {
        console.warn(
          `Could not fetch payment intents for customer ${customerId}: Customer may not exist in Stripe`
        );
      } else {
        console.error("Error querying stripe_payment_intents:", piError);
      }
    }

    const fromPaymentIntents: InvoiceData[] = [];
    for (const row of piRows || []) {
      const r = row as {
        id?: string | null;
        amount?: number | null;
        currency?: string | null;
        created?: string | null;
        attrs?: unknown;
      };
      const attrs = r.attrs as StripeMirrorPaymentIntentAttrs | null | undefined;
      const isLifetime = attrs?.metadata?.purchase_type === "lifetime";
      const ok =
        isLifetime &&
        attrs?.status === "succeeded" &&
        !attrs?.dispute &&
        !attrs?.refunded;
      if (!ok || !r.id || linkedPiIds.has(r.id)) {
        continue;
      }
      const createdIso = paymentIntentCreatedIso(r.created, attrs);
      const receiptUrl = receiptUrlFromPaymentIntentAttrs(attrs);
      const entry: InvoiceData = {
        id: r.id,
        amount: (r.amount || 0) / 100,
        status: "paid",
        created: createdIso,
        currency: r.currency || "usd",
        displayLabelKey: "dashboard.billing.paymentHistoryLifetime",
      };
      if (receiptUrl) {
        entry.receipt_url = receiptUrl;
      }
      fromPaymentIntents.push(entry);
    }

    const merged = [...invoicesFromTable, ...fromPaymentIntents].sort(
      (a, b) =>
        new Date(b.created).getTime() - new Date(a.created).getTime(),
    );

    return { invoices: merged.slice(0, limit), error: null };
  } catch (error: unknown) {
    console.error("Error fetching customer invoices:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { invoices: [], error: errorMessage };
  }
}

// NOTE: deleteUserAccount has been moved to API route /api/user/delete-account
// This provides proper authentication handling where:
// - Regular users can only delete their own account
// - Admins can delete any user's account via ?userId= query parameter
