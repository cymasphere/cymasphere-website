import { Router } from "oak";
import { verifyJwt } from "../middleware/authMiddleware.ts";
import {
  createStripeCustomer,
  createCheckoutSession,
  createBillingPortalSession,
  handleWebhookEvent,
  getSubscriptionStatus,
} from "../services/stripeService.ts";
import { User } from "../models/user.ts";

const router = new Router({ prefix: "/api/stripe" });

// Create checkout session
router.post("/create-checkout-session", verifyJwt, async (ctx) => {
  try {
    const userId = ctx.state.user.sub;
    const body = await ctx.request.body({ type: "json" }).value;

    if (!body) {
      ctx.response.status = 400;
      ctx.response.body = { error: "Request body is missing" };
      return;
    }

    if (!body.priceId || !body.successUrl || !body.cancelUrl) {
      ctx.response.status = 400;
      ctx.response.body = {
        error: "Price ID, success URL, and cancel URL are required",
      };
      return;
    }

    // Get user
    const user = await User.findById(userId).exec();

    if (!user) {
      ctx.response.status = 404;
      ctx.response.body = { error: "User not found" };
      return;
    }

    // Create customer if not exists
    let customerId = user.custId;
    if (!customerId) {
      customerId = await createStripeCustomer(userId, user.email, user.name);
    }

    // Create checkout session
    const sessionUrl = await createCheckoutSession(
      customerId,
      body.priceId,
      body.successUrl,
      body.cancelUrl
    );

    ctx.response.status = 200;
    ctx.response.body = { url: sessionUrl };
  } catch (error: any) {
    ctx.response.status = 400;
    ctx.response.body = { error: error.message };
  }
});

// Create billing portal session
router.post("/create-billing-portal-session", verifyJwt, async (ctx) => {
  try {
    const userId = ctx.state.user.sub;
    const body = await ctx.request.body({ type: "json" }).value;

    if (!body) {
      ctx.response.status = 400;
      ctx.response.body = { error: "Request body is missing" };
      return;
    }

    if (!body.returnUrl) {
      ctx.response.status = 400;
      ctx.response.body = { error: "Return URL is required" };
      return;
    }

    // Get user
    const user = await User.findById(userId).exec();

    if (!user) {
      ctx.response.status = 404;
      ctx.response.body = { error: "User not found" };
      return;
    }

    if (!user.custId) {
      ctx.response.status = 400;
      ctx.response.body = { error: "User does not have a Stripe customer ID" };
      return;
    }

    // Create billing portal session
    const sessionUrl = await createBillingPortalSession(
      user.custId,
      body.returnUrl
    );

    ctx.response.status = 200;
    ctx.response.body = { url: sessionUrl };
  } catch (error: any) {
    ctx.response.status = 400;
    ctx.response.body = { error: error.message };
  }
});

// Get subscription status
router.get("/subscription-status", verifyJwt, async (ctx) => {
  try {
    const userId = ctx.state.user.sub;

    // Get user
    const user = await User.findById(userId).exec();

    if (!user) {
      ctx.response.status = 404;
      ctx.response.body = { error: "User not found" };
      return;
    }

    if (!user.custId) {
      ctx.response.status = 200;
      ctx.response.body = { status: "inactive" };
      return;
    }

    // Get subscription status
    const subscriptionStatus = await getSubscriptionStatus(user.custId);

    ctx.response.status = 200;
    ctx.response.body = subscriptionStatus;
  } catch (error: any) {
    ctx.response.status = 400;
    ctx.response.body = { error: error.message };
  }
});

// Webhook endpoint
router.post("/webhook", async (ctx) => {
  try {
    const signature = ctx.request.headers.get("stripe-signature") || "";
    const body = await ctx.request.body({ type: "text" }).value;

    await handleWebhookEvent(signature, body);

    ctx.response.status = 200;
    ctx.response.body = { received: true };
  } catch (error: any) {
    ctx.response.status = 400;
    ctx.response.body = { error: error.message };
  }
});

export default router;
