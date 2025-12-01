"use server";

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createSupabaseServiceRole } from "@/utils/supabase/service";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

/**
 * Track Meta conversion event from server-side (webhook)
 * This is a server-side helper that calls the Meta API endpoint directly
 */
async function trackMetaConversionFromWebhook(
  eventName: string,
  userData: {
    email?: string;
    userId?: string;
  },
  customData?: Record<string, any>,
  eventId?: string
): Promise<void> {
  try {
    // Only track if Meta is configured
    if (!process.env.NEXT_PUBLIC_META_PIXEL_ID || !process.env.META_CONVERSIONS_API_TOKEN) {
      console.log('⚠️ Meta not configured, skipping conversion tracking');
      return;
    }

    // Call the Meta API endpoint
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_BASE_URL || 'https://www.cymasphere.com';
    const response = await fetch(`${baseUrl}/api/meta/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        eventName,
        userData: {
          email: userData.email,
          userId: userData.userId,
          clientIp: '0.0.0.0', // Webhook doesn't have real IP
          clientUserAgent: 'Stripe-Webhook/1.0',
        },
        customData,
        eventId,
        url: baseUrl,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error(`❌ Failed to track ${eventName} to Meta:`, error);
    } else {
      console.log(`✅ Tracked ${eventName} to Meta successfully`);
    }
  } catch (error) {
    console.error(`❌ Error tracking ${eventName} to Meta:`, error);
    // Don't throw - tracking failure shouldn't break webhook processing
  }
}

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

        // Get metadata from session
        const metadata = session.metadata || {};
        const userId = metadata.user_id;
        const userEmail = metadata.email;
        const planName = metadata.plan_name || metadata.plan_type;
        const eventId = metadata.event_id || `checkout_${session.id}`;

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

            // Check if this is a free trial
            const hasTrial = subscription.trial_end && subscription.trial_end > Math.floor(Date.now() / 1000);
            
            if (hasTrial) {
              // Track free trial to Meta CAPI
              await trackMetaConversionFromWebhook(
                'Subscribe', // Meta event for subscription start (trial)
                {
                  email: userEmail || profile.email,
                  userId: userId || profile.id,
                },
                {
                  content_name: planName || subscriptionType,
                  subscription_type: subscriptionType,
                  trial_days: subscription.trial_end 
                    ? Math.ceil((subscription.trial_end - Math.floor(Date.now() / 1000)) / 86400)
                    : undefined,
                  subscription_id: subscription.id,
                  price_id: subscription.items.data[0]?.price.id,
                  currency: subscription.currency,
                  value: subscription.items.data[0]?.price.unit_amount ? (subscription.items.data[0].price.unit_amount / 100) : undefined,
                },
                eventId
              );
            }
          }
        } else if (session.mode === "payment") {
          // Handle one-time payment (lifetime)
          const customerId = typeof session.customer === 'string' ? session.customer : session.customer.id;
          
          // Find user by customer ID
          const { data: profile } = await supabase
            .from("profiles")
            .select("*")
            .eq("customer_id", customerId)
            .single();

          if (profile) {
            // CRITICAL: Check if user already has lifetime to prevent duplicate processing
            if (profile.subscription === "lifetime") {
              console.warn(`⚠️ Duplicate lifetime purchase attempt for customer ${customerId}. Already has lifetime. Skipping webhook processing.`);
              // Still track to Meta but don't update database
              const paymentIntent = await stripe.paymentIntents.retrieve(
                session.payment_intent as string
              );
              
              await trackMetaConversionFromWebhook(
                'Purchase',
                {
                  email: userEmail || profile.email,
                  userId: userId || profile.id,
                },
                {
                  content_name: planName || 'lifetime_duplicate',
                  value: paymentIntent.amount / 100,
                  currency: paymentIntent.currency.toUpperCase(),
                  payment_method: paymentIntent.payment_method_types?.[0],
                  duplicate_purchase: true,
                },
                `duplicate_${eventId}`
              );
              
              // Don't process this as a new purchase since they already have lifetime
              break;
            }

            // Get payment intent to get amount
            const paymentIntent = await stripe.paymentIntents.retrieve(
              session.payment_intent as string
            );

            // CRITICAL FIX: Ensure payment intent has purchase_type metadata for lifetime purchases
            // Sometimes Stripe doesn't copy payment_intent_data.metadata to the actual payment intent
            // Check if this is a lifetime purchase and ensure metadata is set
            if (metadata.plan_type === "lifetime" && !paymentIntent.metadata?.purchase_type) {
              console.log(`🔧 Fixing missing metadata on payment intent ${paymentIntent.id} for lifetime purchase`);
              try {
                await stripe.paymentIntents.update(paymentIntent.id, {
                  metadata: {
                    ...paymentIntent.metadata,
                    purchase_type: "lifetime",
                  },
                });
                console.log(`✅ Updated payment intent metadata for lifetime purchase`);
              } catch (updateError) {
                console.error(`❌ Failed to update payment intent metadata:`, updateError);
                // Continue processing even if metadata update fails
              }
            }

            // Track purchase to Meta CAPI
            await trackMetaConversionFromWebhook(
              'Purchase', // Meta event for one-time purchase
              {
                email: userEmail || profile.email,
                userId: userId || profile.id,
              },
              {
                content_name: planName || 'lifetime',
                value: paymentIntent.amount / 100, // Convert cents to dollars
                currency: paymentIntent.currency.toUpperCase(),
                payment_method: paymentIntent.payment_method_types?.[0],
              },
              eventId
            );
          }
        }
        break;
      }

      case "charge.succeeded": {
        const charge = event.data.object as Stripe.Charge;

        // Find subscriber by customer ID
        let subscriber_id = null;
        let profile = null;
        let customerEmail: string | undefined;
        
        if (charge.customer) {
          const customerId = typeof charge.customer === 'string' ? charge.customer : charge.customer.id;
          
          // Get customer email from Stripe
          const customer = await stripe.customers.retrieve(customerId);
          customerEmail = typeof customer === 'object' && !customer.deleted ? customer.email || undefined : undefined;
          
          const { data: profileData } = await supabase
            .from("profiles")
            .select("id, email")
            .eq("customer_id", customerId)
            .single();

          profile = profileData;

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

        // Check if this charge is for a subscription by looking at the invoice
        let subscriptionId: string | undefined;
        let subscriptionType: string | undefined;
        
        if (charge.invoice) {
          const invoice = await stripe.invoices.retrieve(charge.invoice as string);
          if (invoice.subscription) {
            subscriptionId = typeof invoice.subscription === 'string' ? invoice.subscription : invoice.subscription.id;
            
            // Get subscription details to determine type
            const subscription = await stripe.subscriptions.retrieve(subscriptionId);
            const subscriptionItem = subscription.items.data[0];
            
            if (subscriptionItem) {
              const priceId = subscriptionItem.price.id;
              subscriptionType = 
                priceId === process.env.STRIPE_PRICE_ID_MONTHLY 
                  ? "monthly" 
                  : priceId === process.env.STRIPE_PRICE_ID_ANNUAL
                  ? "annual" 
                  : "unknown";
              
              // Get plan name (monthly_6, annual_59, etc.)
              const amount = charge.amount / 100;
              const planName = subscriptionType === "monthly" 
                ? `monthly_${amount}` 
                : subscriptionType === "annual"
                ? `annual_${amount}`
                : `${subscriptionType}_${amount}`;
              
              // Track paid subscription to Meta (differentiate monthly vs annual)
              await trackMetaConversionFromWebhook(
                'Subscribe', // Meta event for paid subscription (monthly/annual)
                {
                  email: customerEmail || profile?.email,
                  userId: profile?.id,
                },
                {
                  content_name: planName,
                  subscription_type: subscriptionType,
                  subscription_id: subscriptionId,
                  price_id: priceId,
                  currency: charge.currency.toUpperCase(),
                  value: amount,
                  payment_method: charge.payment_method_details?.type,
                },
                `subscription_paid_${charge.id}`
              );
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
        let profile = null;
        let customerEmail: string | undefined;
        
        if (subscription.customer) {
          const customerId = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id;
          
          // Get customer email from Stripe
          const customer = await stripe.customers.retrieve(customerId);
          customerEmail = typeof customer === 'object' && !customer.deleted ? customer.email || undefined : undefined;
          
          const { data: profileData } = await supabase
            .from("profiles")
            .select("id, email")
            .eq("customer_id", customerId)
            .single();

          profile = profileData;

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
        
        // Update profile with new subscription details (for both created and updated)
        if (profile && subscriptionItem) {
          const priceId = subscriptionItem.price.id;
          const subscriptionType = 
            priceId === process.env.STRIPE_PRICE_ID_MONTHLY 
              ? "monthly" 
              : priceId === process.env.STRIPE_PRICE_ID_ANNUAL
              ? "annual" 
              : "none";

          // Update the profile in the database
          await supabase
            .from("profiles")
            .update({
              subscription: subscriptionType,
              subscription_expiration: new Date(subscription.current_period_end * 1000).toISOString(),
              trial_expiration: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
            })
            .eq("id", profile.id);

          console.log(`Updated profile ${profile.id} subscription to ${subscriptionType}`);
        }

        // Only run tracking/automation for new subscriptions
        if (subscriptionItem && subscriber_id && event.type === "customer.subscription.created") {
          // Determine subscription type (monthly vs annual)
          const priceId = subscriptionItem.price.id;
          const subscriptionType = 
            priceId === process.env.STRIPE_PRICE_ID_MONTHLY 
              ? "monthly" 
              : priceId === process.env.STRIPE_PRICE_ID_ANNUAL
              ? "annual" 
              : "unknown";

          // Get plan name (monthly_6, annual_59, etc.)
          const amount = subscriptionItem.price.unit_amount ? (subscriptionItem.price.unit_amount / 100) : 0;
          const planName = subscriptionType === "monthly" 
            ? `monthly_${amount}` 
            : subscriptionType === "annual"
            ? `annual_${amount}`
            : `${subscriptionType}_${amount}`;

          // Check if this is a trial initiation
          const hasTrial = subscription.trial_end && subscription.trial_end > Math.floor(Date.now() / 1000);
          
          if (hasTrial) {
            // Track trial initiation - all trials as one event (as per marketing requirements)
            await trackMetaConversionFromWebhook(
              'Subscribe', // Meta event for subscription start
              {
                email: customerEmail || profile?.email,
                userId: profile?.id,
              },
              {
                content_name: planName,
                subscription_type: subscriptionType,
                trial_days: subscription.trial_end 
                  ? Math.ceil((subscription.trial_end - Math.floor(Date.now() / 1000)) / 86400)
                  : undefined,
                subscription_id: subscription.id,
                price_id: priceId,
                currency: subscription.currency,
                value: amount,
              },
              `trial_${subscription.id}`
            );
          }

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
