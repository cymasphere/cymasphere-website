"use server";

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createSupabaseServiceRole } from "@/utils/supabase/service";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: NextRequest) {
  const sig = request.headers.get("stripe-signature") as string;
  let event: Stripe.Event;

  try {
    const body = await request.text();
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const supabase = await createSupabaseServiceRole();
  const dateTime = new Date(event.created * 1000).toISOString();

  try {
    console.log("Processing Stripe event:", event.type, "at", dateTime);

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log("Checkout session completed:", session.id);

        // Update user subscription status based on session
        if (session.customer && session.mode === "subscription") {
          const customerId = typeof session.customer === 'string' ? session.customer : session.customer.id;
          
          const subscription = await stripe.subscriptions.retrieve(
            session.subscription as string
          );
          
          // Find user by customer ID
          const { data: profile } = await supabase
            .from("profiles")
            .select("*")
            .eq("customer_id", customerId)
            .single();

          if (profile) {
            // Update subscription status
            const subscriptionType = 
              subscription.items.data[0]?.price.id === process.env.STRIPE_PRICE_ID_MONTHLY 
                ? "monthly" 
                : subscription.items.data[0]?.price.id === process.env.STRIPE_PRICE_ID_ANNUAL
                ? "annual" 
                : "none";

            await supabase
              .from("profiles")
              .update({
                subscription: subscriptionType,
                subscription_expiration: new Date(subscription.current_period_end * 1000).toISOString(),
                trial_expiration: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
              })
              .eq("id", profile.id);
          }
        }
        break;
      }

      case "charge.succeeded": {
        const charge = event.data.object as Stripe.Charge;

        // Find subscriber by customer ID
        let subscriber_id = null;
        if (charge.customer) {
          const customerId = typeof charge.customer === 'string' ? charge.customer : charge.customer.id;
          
          const { data: profile } = await supabase
            .from("profiles")
            .select("id")
            .eq("customer_id", customerId)
            .single();

          if (profile) {
            const { data: subscriber } = await supabase
              .from("subscribers")
              .select("id")
              .eq("user_id", profile.id)
              .single();
            
            if (subscriber) {
              subscriber_id = subscriber.id;
            }
          }
        }

        // Fetch the payment intent to get product information
        if (charge.payment_intent) {
          const paymentIntent = await stripe.paymentIntents.retrieve(
            charge.payment_intent as string
          );

          // Get the line items to find product information
          if (paymentIntent.metadata.productId) {
            // Since customer_purchases table doesn't exist in the database types, 
            // we'll create automation events directly instead
            if (subscriber_id) {
              // Create automation event for purchase
              await supabase.rpc('create_automation_event', {
                p_event_type: 'purchase',
                p_subscriber_id: subscriber_id,
                p_event_data: {
                  customer_id: typeof charge.customer === 'string' ? charge.customer : charge.customer?.id,
                  product_id: paymentIntent.metadata.productId,
                  purchase_type: paymentIntent.metadata.purchaseType || "one-time",
                  amount: charge.amount,
                  currency: charge.currency,
                  charge_id: charge.id,
                  purchase_date: new Date().toISOString()
                },
                p_source: 'stripe_webhook'
              });
            }
          }
        }
        break;
      }

      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;

        // Find subscriber by customer ID
        let subscriber_id = null;
        if (charge.customer) {
          const customerId = typeof charge.customer === 'string' ? charge.customer : charge.customer.id;
          
          const { data: profile } = await supabase
            .from("profiles")
            .select("id")
            .eq("customer_id", customerId)
            .single();

          if (profile) {
            const { data: subscriber } = await supabase
              .from("subscribers")
              .select("id")
              .eq("user_id", profile.id)
              .single();
            
            if (subscriber) {
              subscriber_id = subscriber.id;
            }
          }
        }

        // Create refund event for automation
        if (subscriber_id && charge.payment_intent) {
          const paymentIntent = await stripe.paymentIntents.retrieve(
            charge.payment_intent as string
          );

          if (paymentIntent.metadata.productId) {
            await supabase.rpc('create_automation_event', {
              p_event_type: 'purchase_refunded',
              p_subscriber_id: subscriber_id,
              p_event_data: {
                customer_id: typeof charge.customer === 'string' ? charge.customer : charge.customer?.id,
                  product_id: paymentIntent.metadata.productId,
                purchase_type: paymentIntent.metadata.purchaseType || "one-time",
                  amount: charge.amount,
                  currency: charge.currency,
                  charge_id: charge.id,
                refund_date: new Date().toISOString()
              },
              p_source: 'stripe_webhook'
            });
          }
        }
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;

        // Find subscriber by customer ID
        let subscriber_id = null;
        if (subscription.customer) {
          const customerId = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id;
          
          const { data: profile } = await supabase
            .from("profiles")
            .select("id")
            .eq("customer_id", customerId)
            .single();

          if (profile) {
            const { data: subscriber } = await supabase
              .from("subscribers")
              .select("id")
              .eq("user_id", profile.id)
              .single();
            
            if (subscriber) {
              subscriber_id = subscriber.id;
            }
          }
        }

        // Get the product ID from the subscription items
        const subscriptionItem = subscription.items.data[0];
        if (subscriptionItem && subscriber_id && event.type === "customer.subscription.created") {
          // Create automation event for new subscription
          await supabase.rpc('create_automation_event', {
            p_event_type: 'purchase',
            p_subscriber_id: subscriber_id,
            p_event_data: {
              customer_id: typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id,
              product_id: typeof subscriptionItem.price.product === 'string' ? subscriptionItem.price.product : subscriptionItem.price.product?.id,
              purchase_type: "subscription",
                amount: subscriptionItem.price.unit_amount || 0,
                currency: subscription.currency,
              subscription_id: subscription.id,
              purchase_date: new Date().toISOString()
            },
            p_source: 'stripe_webhook'
          });
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;

        // Find subscriber by customer ID
        let subscriber_id = null;
        if (subscription.customer) {
          const customerId = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id;
          
          const { data: profile } = await supabase
            .from("profiles")
            .select("id")
            .eq("customer_id", customerId)
            .single();

          if (profile) {
            const { data: subscriber } = await supabase
              .from("subscribers")
              .select("id")
              .eq("user_id", profile.id)
              .single();
            
            if (subscriber) {
              subscriber_id = subscriber.id;
            }
          }
        }

        // Create subscription cancellation event
        const subscriptionItem = subscription.items.data[0];
        if (subscriptionItem && subscriber_id) {
          await supabase.rpc('create_automation_event', {
            p_event_type: 'subscription_cancelled',
            p_subscriber_id: subscriber_id,
            p_event_data: {
              customer_id: typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id,
              product_id: typeof subscriptionItem.price.product === 'string' ? subscriptionItem.price.product : subscriptionItem.price.product?.id,
              purchase_type: "subscription",
                amount: subscriptionItem.price.unit_amount || 0,
                currency: subscription.currency,
              subscription_id: subscription.id,
              cancellation_date: new Date().toISOString()
            },
            p_source: 'stripe_webhook'
          });
        }
        break;
      }

      default:
        console.log("unhandled stripe event", dateTime, event.type);
        break;
    }

    return NextResponse.json({ status: "success", event: event.type });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ status: "error", error });
  }
}
