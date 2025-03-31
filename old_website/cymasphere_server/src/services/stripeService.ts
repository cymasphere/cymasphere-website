import Stripe from "stripe";
import { User } from "../models/user.ts";

// Initialize Stripe
const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY") || "";
const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: "2023-08-16",
});

// Create a Stripe customer
export async function createStripeCustomer(
  userId: string,
  email: string,
  name: string
): Promise<string> {
  try {
    const customer = await stripe.customers.create({
      email,
      name,
      metadata: {
        userId,
      },
    });

    // Update user with customer ID
    await User.findByIdAndUpdate(userId, { custId: customer.id }).exec();

    return customer.id;
  } catch (error: any) {
    throw new Error(`Error creating Stripe customer: ${error.message}`);
  }
}

// Delete a Stripe customer
export async function deleteStripeCustomer(customerId: string): Promise<void> {
  try {
    await stripe.customers.del(customerId);
  } catch (error: any) {
    throw new Error(`Error deleting Stripe customer: ${error.message}`);
  }
}

// Get subscription status
export async function getSubscriptionStatus(customerId: string): Promise<any> {
  try {
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      expand: ["data.plan.product"],
    });

    if (subscriptions.data.length === 0) {
      return { status: "inactive" };
    }

    const subscription = subscriptions.data[0];

    return {
      status: subscription.status,
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      plan: {
        id: subscription.items.data[0].plan.id,
        name: (subscription.items.data[0].plan.product as Stripe.Product).name,
      },
    };
  } catch (error: any) {
    throw new Error(`Error getting subscription status: ${error.message}`);
  }
}

// Create a checkout session
export async function createCheckoutSession(
  customerId: string,
  priceId: string,
  successUrl: string,
  cancelUrl: string
): Promise<string> {
  try {
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: successUrl,
      cancel_url: cancelUrl,
    });

    return session.url || "";
  } catch (error: any) {
    throw new Error(`Error creating checkout session: ${error.message}`);
  }
}

// Create a billing portal session
export async function createBillingPortalSession(
  customerId: string,
  returnUrl: string
): Promise<string> {
  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });

    return session.url;
  } catch (error: any) {
    throw new Error(`Error creating billing portal session: ${error.message}`);
  }
}

// Handle webhook events
export async function handleWebhookEvent(
  signature: string,
  payload: string
): Promise<void> {
  try {
    const STRIPE_WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET") || "";

    const event = stripe.webhooks.constructEvent(
      payload,
      signature,
      STRIPE_WEBHOOK_SECRET
    );

    // Handle different event types
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated":
        // Handle subscription updates
        const subscription = event.data.object as Stripe.Subscription;
        // Update user subscription status
        break;
      case "customer.subscription.deleted":
        // Handle subscription cancellation
        break;
      case "invoice.payment_succeeded":
        // Handle successful payment
        break;
      case "invoice.payment_failed":
        // Handle failed payment
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
  } catch (error: any) {
    throw new Error(`Error handling webhook event: ${error.message}`);
  }
}
