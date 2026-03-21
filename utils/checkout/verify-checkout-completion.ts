/**
 * @fileoverview Verifies Stripe checkout artifacts (Checkout Session, PaymentIntent, SetupIntent)
 * before post-purchase invite or subscription refresh. Centralizes success rules aligned with
 * checkout-result and billing security requirements.
 *
 * @module utils/checkout/verify-checkout-completion
 */

import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

/**
 * @brief Successful verification payload for post-checkout flows
 */
export type VerifiedCheckoutContext = {
  ok: true;
  customerId: string | null;
  customerEmail: string | null;
  value: number | null;
  currency: string;
  isTrial: boolean;
  mode: "payment" | "subscription" | "setup";
  /** Present for Checkout Session flow only (hosted checkout metadata). */
  sessionMetadata?: Record<string, string> | null;
};

/**
 * @brief Verification failure
 */
export type VerifyCheckoutFailure = {
  ok: false;
  error: string;
  /** When true, client may retry shortly (e.g. subscription still provisioning). */
  retryable?: boolean;
};

export type VerifyCheckoutResult = VerifiedCheckoutContext | VerifyCheckoutFailure;

/**
 * @brief Verifies exactly one of session_id, payment_intent_id, or setup_intent_id.
 * @param params - At most one id should be non-null; caller enforces exclusivity.
 * @returns Verified context or failure reason.
 */
export async function verifyCheckoutArtifact(params: {
  sessionId?: string | null;
  paymentIntentId?: string | null;
  setupIntentId?: string | null;
}): Promise<VerifyCheckoutResult> {
  const {
    sessionId,
    paymentIntentId,
    setupIntentId,
  }: {
    sessionId?: string | null;
    paymentIntentId?: string | null;
    setupIntentId?: string | null;
  } = params;

  const count = [sessionId, paymentIntentId, setupIntentId].filter(Boolean)
    .length;
  if (count !== 1) {
    return { ok: false, error: "Exactly one of session_id, payment_intent_id, setup_intent_id is required." };
  }

  if (sessionId) {
    return verifyCheckoutSession(sessionId.trim());
  }
  if (paymentIntentId) {
    return verifyPaymentIntent(paymentIntentId.trim());
  }
  return verifySetupIntent(setupIntentId!.trim());
}

/**
 * @brief Resolves customer email from a Stripe Customer id or expanded object.
 */
async function resolveCustomerEmail(
  customer: string | Stripe.Customer | Stripe.DeletedCustomer | null,
): Promise<{ id: string | null; email: string | null }> {
  if (!customer) return { id: null, email: null };
  if (typeof customer === "string") {
    try {
      const c = await stripe.customers.retrieve(customer);
      if (typeof c === "object" && !c.deleted && "email" in c && c.email) {
        return { id: c.id, email: c.email.toLowerCase().trim() };
      }
      return { id: customer, email: null };
    } catch {
      return { id: customer, email: null };
    }
  }
  if ("deleted" in customer && customer.deleted) {
    return { id: null, email: null };
  }
  const em =
    "email" in customer && customer.email
      ? customer.email.toLowerCase().trim()
      : null;
  return { id: customer.id, email: em };
}

/**
 * @brief Verifies a completed Checkout Session (hosted checkout).
 */
async function verifyCheckoutSession(
  sessionId: string,
): Promise<VerifyCheckoutResult> {
  const session = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ["customer", "subscription", "payment_intent"],
  });

  if (session.status !== "complete") {
    return { ok: false, error: "CHECKOUT_SESSION_INCOMPLETE" };
  }

  if (session.mode === "payment") {
    if (session.payment_status !== "paid") {
      return { ok: false, error: "PAYMENT_NOT_PAID" };
    }
  } else if (session.mode === "subscription") {
    if (!session.subscription) {
      return { ok: false, error: "SUBSCRIPTION_MISSING" };
    }
  } else {
    return { ok: false, error: "UNSUPPORTED_SESSION_MODE" };
  }

  let customerId: string | null = null;
  if (session.customer) {
    customerId =
      typeof session.customer === "string"
        ? session.customer
        : session.customer.id;
  }

  const { email: customerEmail } = await resolveCustomerEmail(
    session.customer ?? null,
  );

  let value: number | null = null;
  let currency = (session.currency ?? "usd").toUpperCase();
  let isTrial = false;

  if (session.mode === "subscription" && session.subscription) {
    const subId =
      typeof session.subscription === "string"
        ? session.subscription
        : session.subscription.id;
    const subscription = await stripe.subscriptions.retrieve(subId, {
      expand: ["items.data.price"],
    });

    const now = Math.floor(Date.now() / 1000);
    // Active trial only: Stripe keeps trial_start after trial ends; do not use trial_start alone.
    if (subscription.status === "trialing") {
      isTrial = true;
    }
    if (subscription.trial_end != null && subscription.trial_end > now) {
      isTrial = true;
    }

    const subData = (
      session as Stripe.Checkout.Session & {
        subscription_data?: { trial_period_days?: number };
      }
    ).subscription_data;
    if (subData?.trial_period_days && subData.trial_period_days > 0) {
      isTrial = true;
    }

    if (!isTrial && subscription.items?.data?.[0]?.price?.unit_amount != null) {
      value =
        (subscription.items.data[0].price.unit_amount ?? 0) / 100;
      currency = (subscription.currency ?? "usd").toUpperCase();
    }
  } else if (session.mode === "payment" && session.amount_total != null) {
    value = session.amount_total / 100;
    currency = (session.currency ?? "usd").toUpperCase();
    isTrial = false;
  }

  return {
    ok: true,
    customerId,
    customerEmail,
    value,
    currency,
    isTrial,
    mode: session.mode === "payment" ? "payment" : "subscription",
    sessionMetadata: session.metadata ?? null,
  };
}

/**
 * @brief Verifies a succeeded PaymentIntent (in-app lifetime).
 */
async function verifyPaymentIntent(
  paymentIntentId: string,
): Promise<VerifyCheckoutResult> {
  const pi = await stripe.paymentIntents.retrieve(paymentIntentId, {
    expand: ["customer"],
  });

  if (pi.status !== "succeeded") {
    return { ok: false, error: "PAYMENT_INTENT_NOT_SUCCEEDED" };
  }

  const { id: customerId, email: customerEmail } =
    await resolveCustomerEmail(pi.customer);

  const value =
    pi.amount_received != null && pi.amount_received > 0
      ? pi.amount_received / 100
      : pi.amount != null
        ? pi.amount / 100
        : null;
  const currency = (pi.currency ?? "usd").toUpperCase();

  return {
    ok: true,
    customerId,
    customerEmail,
    value,
    currency,
    isTrial: false,
    mode: "payment",
    sessionMetadata: null,
  };
}

/**
 * @brief Verifies SetupIntent succeeded and customer has an active-ish subscription (in-app sub after 3DS).
 */
async function verifySetupIntent(
  setupIntentId: string,
): Promise<VerifyCheckoutResult> {
  const si = await stripe.setupIntents.retrieve(setupIntentId, {
    expand: ["customer"],
  });

  if (si.status !== "succeeded") {
    return { ok: false, error: "SETUP_INTENT_NOT_SUCCEEDED" };
  }

  const customerRef = si.customer;
  const customerId =
    typeof customerRef === "string"
      ? customerRef
      : customerRef && typeof customerRef === "object" && "id" in customerRef
        ? customerRef.id
        : null;

  const { email: customerEmail } =
    await resolveCustomerEmail(customerRef ?? null);

  if (!customerId) {
    return { ok: false, error: "SETUP_INTENT_NO_CUSTOMER" };
  }

  const subscriptions = await stripe.subscriptions.list({
    customer: customerId,
    status: "all",
    limit: 20,
  });
  const activeLike = subscriptions.data.filter(
    (s) =>
      s.status === "active" ||
      s.status === "trialing" ||
      s.status === "past_due",
  );
  if (activeLike.length === 0) {
    return {
      ok: false,
      error: "SUBSCRIPTION_PENDING",
      retryable: true,
    };
  }

  const sub = activeLike[0];
  const now = Math.floor(Date.now() / 1000);
  let isTrial =
    sub.status === "trialing" ||
    !!(sub.trial_end != null && sub.trial_end > now);

  let value: number | null = null;
  let currency = (sub.currency ?? "usd").toUpperCase();
  if (!isTrial && sub.items?.data?.[0]?.price?.unit_amount != null) {
    value = (sub.items.data[0].price.unit_amount ?? 0) / 100;
  }

  return {
    ok: true,
    customerId,
    customerEmail,
    value,
    currency,
    isTrial,
    mode: "setup",
    sessionMetadata: null,
  };
}
