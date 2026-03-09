# Subscription and Checkout Invariants

This document describes the single-source-of-truth rules for subscription state, which endpoints may create or modify subscriptions, and how to extend the system without violating invariants.

## Single source of truth: `updateUserProStatus`

All subscription status visible to the app is derived from **`updateUserProStatus`** in `utils/subscriptions/check-subscription.ts`.

- **Callers**: Stripe webhooks, server actions after checkout, login refresh, dashboard, admin tools.
- **Mutex**: Per-user lock (`userUpdateLocks`) serializes concurrent calls so only one update runs per user at a time.
- **Priority**: NFR (lifetime) > iOS > Stripe. Within Stripe: lifetime > annual > monthly. If profile already has `subscription: "lifetime"`, it is preserved even when Stripe queries fail or lag.
- **Writes**: Only this flow (and the NFR early-exit path) should write `profiles.subscription`, `subscription_expiration`, `trial_expiration`, `subscription_source`. Exceptions: webhook sets `subscription: "lifetime"` on `payment_intent.succeeded` for lifetime; maintenance scripts may update profile only when they preserve invariants (e.g. `fix-duplicate-subscriptions.js` never overwrites lifetime).

## Invariants

1. **One active subscription per Stripe customer**  
   A customer must not have more than one subscription in `active`, `trialing`, or `past_due` at a time. Creation paths (checkout route, subscription-setup) block new subscriptions when one already exists, unless the request is a valid **plan change** (see below).

2. **One lifetime purchase per customer**  
   `hasCustomerPurchasedLifetime` is checked before creating any lifetime Checkout Session or PaymentIntent. Duplicate lifetime attempts return `LIFETIME_ALREADY_PURCHASED`.

3. **One cardless trial per customer**  
   `hasCustomerHadTrial` is used to block a second trial without a card. If the customer has already had a trial, they must provide a payment method (or get no trial).

4. **Plan change is backend-derived**  
   `isPlanChange` from the client is not trusted alone. The backend requires the customer to have **exactly one** active/trialing/past_due subscription. If they have zero or multiple, the request is rejected (`INVALID_PLAN_CHANGE` or `ACTIVE_SUBSCRIPTION_EXISTS`).

5. **Lifetime wins over subscriptions**  
   If a customer has both a lifetime purchase and an active subscription, `customerPurchasedProFromSupabase` treats them as lifetime and cancels the redundant subscription in Stripe.

## Endpoints that create or modify subscriptions

| Endpoint / flow | Creates/updates | Constraints |
|-----------------|------------------|-------------|
| `POST /api/stripe/checkout` | Checkout Session (subscription or payment) | Duplicate sub check; lifetime check for lifetime plan; trial check; plan change requires exactly one active sub. |
| `POST /api/stripe/subscription-setup` | Stripe Subscription | Same duplicate/trial/plan-change rules; idempotency key per customer+plan+hour. |
| `POST /api/stripe/payment-intent` | PaymentIntent (lifetime) | Lifetime duplicate check; idempotency key per customer+hour. |
| `POST /api/stripe/setup-intent` | SetupIntent only | Blocks if customer already has active/trialing subscription. |
| Stripe webhook `customer.subscription.created/updated` | Upserts `stripe_tables.stripe_subscriptions` | Idempotent by subscription id. |
| Stripe webhook `payment_intent.succeeded` (lifetime) | Sets `profiles.subscription = "lifetime"` | Metadata `purchase_type: "lifetime"` required. |
| `updateUserProStatus` | `profiles.subscription`, expiration, source | Single source of truth; mutex per user. |

No other application code should write subscription state to `profiles` unless it goes through `updateUserProStatus` or is a one-off script that preserves lifetime and single-active-sub invariants.

## Lifetime metadata schema

All lifetime purchases (Checkout Sessions, PaymentIntents, invoices) must use the same metadata so webhooks and `customerPurchasedProFromSupabase` recognize them:

- `purchase_type`: `"lifetime"`
- `plan_type`: `"lifetime"`
- `plan_name`: e.g. `"lifetime_149"` or `"lifetime_0"` for grants
- `price_id`: Stripe price ID for the lifetime product

Used in: `app/api/stripe/checkout/route.ts`, `app/api/stripe/payment-intent/route.ts`, `utils/stripe/actions.ts`, `grant-lifetime-license.js`, and read in `utils/stripe/supabase-stripe.ts` and the webhook.

## Plan changes

- **Billing UI**: User with an existing subscription can switch monthly ↔ annual via the billing page, which calls checkout with `isPlanChange: true`.
- **Backend**: When `isPlanChange` is true, the server lists the customer’s subscriptions and allows creation only if there is **exactly one** active/trialing/past_due subscription. Otherwise it returns `INVALID_PLAN_CHANGE` (no subscription) or `ACTIVE_SUBSCRIPTION_EXISTS` (multiple).
- **Trial**: Plan changes never include a trial; trial is only for new subscriptions.

## Granting lifetime and maintenance scripts

- **`grant-lifetime-license.js`**: Creates $0 invoice (and optional Checkout Session) with the standard lifetime metadata. Does not call `updateUserProStatus`; the next webhook or profile refresh will set lifetime.
- **`fix-duplicate-subscriptions.js`**: Cancels duplicate Stripe subscriptions (keeps most recent). Never overwrites `profiles.subscription` when it is already `"lifetime"`.

Both scripts must use the same lifetime metadata keys as runtime purchases so detection is consistent.

## Safe extension points

- **New plan types (e.g. biennial)**: Add price ID and plan type to the same checkout/subscription-setup flows; reuse the same duplicate-sub and trial checks and idempotency key pattern (`sub_${customerId}_${planType}_${hourKey}`).
- **New platforms (e.g. another app store)**: Add a new source in `updateUserProStatus` (similar to iOS), resolve priority (e.g. lifetime > platform sub > none), and write only via `updateUserProStatus`.
- **New discounts/promos**: Apply at checkout via existing coupon/promotion code paths; do not bypass duplicate-subscription or lifetime checks.

All subscription state that the app reads should flow from Stripe (and any other store) into `updateUserProStatus` and then to `profiles`. New endpoints that create or change subscriptions must enforce the same invariants (one active sub per customer, one lifetime per customer, backend-derived plan change).
