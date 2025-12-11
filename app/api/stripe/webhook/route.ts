"use server";

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createSupabaseServiceRole } from "@/utils/supabase/service";
import { checkUserSubscription } from "@/utils/subscriptions/check-subscription";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

/**
 * Extracts customer ID from any Stripe event
 */
function extractCustomerId(event: Stripe.Event): string | null {
  const obj = event.data.object;

  // Check if the object has a customer field
  if ("customer" in obj && obj.customer) {
    return typeof obj.customer === "string" ? obj.customer : obj.customer.id;
  }

  return null;
}

/**
 * Finds user ID by customer ID
 */
async function findUserIdByCustomerId(
  customerId: string
): Promise<string | null> {
  const supabase = await createSupabaseServiceRole();

  // First try to find by customer_id
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, email")
    .eq("customer_id", customerId)
    .single();

  if (profile) {
    return profile.id;
  }

  // If not found, try to get customer email from Stripe and find by email
  try {
    const customer = await stripe.customers.retrieve(customerId);
    if (typeof customer === "object" && !customer.deleted && customer.email) {
      const { data: profileByEmail } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", customer.email)
        .single();

      if (profileByEmail) {
        // Update customer_id for future lookups
        await supabase
          .from("profiles")
          .update({ customer_id: customerId })
          .eq("id", profileByEmail.id);

        return profileByEmail.id;
      }
    }
  } catch (error) {
    console.error("Error retrieving customer from Stripe:", error);
  }

  return null;
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
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.error("Webhook signature verification failed:", errorMessage);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const dateTime = new Date(event.created * 1000).toISOString();

  try {
    console.log("Processing Stripe event:", event.type, "at", dateTime);

    // Extract customer ID from event
    const customerId = extractCustomerId(event);

    if (!customerId) {
      console.log("No customer ID found in event, skipping");
      return NextResponse.json({ status: "success", event: event.type });
    }

    // Get customer email from Stripe for invite/email purposes
    let customerEmail: string | null = null;
    try {
      const customer = await stripe.customers.retrieve(customerId);
      if (typeof customer === "object" && !customer.deleted) {
        customerEmail = customer.email || null;
      }
    } catch (error) {
      console.error("Error retrieving customer from Stripe:", error);
    }

    // Find user by customer ID
    const userId = await findUserIdByCustomerId(customerId);

    // Handle checkout.session.completed - send invite if no account exists
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const supabase = await createSupabaseServiceRole();

      // Get email from session first (most reliable for checkout), fallback to customer email
      const sessionEmail = session.customer_details?.email || session.customer_email || customerEmail;
      
      if (!sessionEmail) {
        console.log(`[Webhook] No email found in checkout session for customer ${customerId}, skipping invite`);
      } else {
        // Use session email (more reliable than customer email for checkout)
        customerEmail = sessionEmail;

        // Check if user account exists by email
        const { data: existingUser } = await supabase
          .from("profiles")
          .select("id")
          .eq("email", customerEmail.toLowerCase().trim())
          .maybeSingle();

        // If no account exists, send Supabase invite email
        if (!existingUser) {
          try {
            console.log(
              `[Webhook] No account found for ${customerEmail}, sending invite...`
            );

            // Get customer name from Stripe if available
            const customer = await stripe.customers.retrieve(customerId);
            let firstName: string | undefined;
            let lastName: string | undefined;

            if (
              typeof customer === "object" &&
              !customer.deleted &&
              customer.metadata
            ) {
              firstName = customer.metadata.first_name;
              lastName = customer.metadata.last_name;
            }

            // Build user metadata with customer_id for linking
            const userMetadata: {
              invited_by: string;
              customer_id: string;
              first_name?: string;
              last_name?: string;
            } = {
              invited_by: "stripe_checkout",
              customer_id: customerId,
            };

            if (firstName) {
              userMetadata.first_name = firstName;
            }
            if (lastName) {
              userMetadata.last_name = lastName;
            }

            // Send Supabase invite email
            const baseUrl =
              process.env.NEXT_PUBLIC_SITE_URL ||
              process.env.NEXT_PUBLIC_BASE_URL ||
              "https://cymasphere.com";
            const redirectTo = `${baseUrl}/reset-password`;

            const { data: inviteData, error: inviteError } =
              await supabase.auth.admin.inviteUserByEmail(
                customerEmail,
                {
                  data: userMetadata,
                  redirectTo: redirectTo,
                }
              );

            if (inviteError) {
              // If user already exists, Supabase won't send email (this is expected)
              if (
                inviteError.message?.toLowerCase().includes("already") ||
                inviteError.message?.toLowerCase().includes("exists")
              ) {
                console.log(
                  `[Webhook] User ${customerEmail} already has account, skipping invite`
                );
              } else {
                console.error(
                  `[Webhook] Error sending invite to ${customerEmail}:`,
                  inviteError.message
                );
              }
            } else {
              console.log(
                `[Webhook] ✅ Sent invite email to ${customerEmail} for customer ${customerId}`
              );
              // Note: When user sets password via invite link, account is created with customer_id in metadata
              // The profile will be linked via findUserIdByCustomerId on next webhook event or login
            }
          } catch (inviteError) {
            console.error(
              `[Webhook] Unexpected error sending invite:`,
              inviteError
            );
            // Don't fail the webhook if invite fails
          }
        } else {
          console.log(
            `[Webhook] User ${customerEmail} already has account (ID: ${existingUser.id}), skipping invite`
          );
        }
      } // Close the else block for sessionEmail check
    }

    // If user exists, refresh subscription status
    if (userId) {
      console.log(
        `Refreshing subscription for user ${userId} (customer: ${customerId})`
      );
      const result = await checkUserSubscription(userId);
      console.log(
        `Subscription updated: ${result.subscription} (${result.source})`
      );
    }

    return NextResponse.json({ status: "success", event: event.type });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ status: "error", error });
  }
}
