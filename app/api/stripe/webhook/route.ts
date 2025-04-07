"use server";

import { NextResponse, NextRequest } from "next/server";
// import Stripe from "stripe";
// import { createClient } from "@/utils/supabase/server";

export async function POST(request: NextRequest) {
  return NextResponse.json({ message: request.body });
}

// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// export async function POST(request: NextRequest) {
//   const payload = await request.text();
//   const response = await JSON.parse(payload);
//   const sig = request.headers.get("Stripe-Signature")!;
//   const supabase = await createClient();

//   const dateTime = new Date(response?.created * 1000).toLocaleDateString();

//   try {
//     const event = stripe.webhooks.constructEvent(
//       payload,
//       sig!,
//       process.env.STRIPE_WEBHOOK_SECRET!
//     );

//     switch (event.type) {
//       case "customer.created": {
//         const customer = event.data.object as Stripe.Customer;

//         if (!customer.email) {
//           console.error("Customer created without email");
//           break;
//         }

//         // Store customer information in the customers table
//         const { error: customerError } = await supabase
//           .from("customers")
//           .upsert({
//             stripe_customer_id: customer.id,
//             email: customer.email,
//           });

//         if (customerError) {
//           console.error("Error storing customer:", customerError);
//           break;
//         }

//         // Send invite to create account
//         await supabase.auth.admin.inviteUserByEmail(customer.email, {
//           redirectTo: process.env.NEXT_PUBLIC_SITE_URL + "/reset-password",
//           data: { customer_id: customer.id },
//         });
//         break;
//       }

//       case "charge.succeeded": {
//         const charge = event.data.object as Stripe.Charge;

//         // Fetch the payment intent to get product information
//         if (charge.payment_intent) {
//           const paymentIntent = await stripe.paymentIntents.retrieve(
//             charge.payment_intent as string
//           );

//           // Get the line items to find product information
//           if (paymentIntent.metadata.productId) {
//             const { error: upsertError } = await supabase
//               .from("customer_purchases")
//               .upsert(
//                 {
//                   customer_id: charge.customer,
//                   product_id: paymentIntent.metadata.productId,
//                   status: charge.status,
//                   amount: charge.amount,
//                   currency: charge.currency,
//                   last_updated: new Date().toISOString(),
//                   charge_id: charge.id,
//                   purchase_type:
//                     paymentIntent.metadata.purchaseType || "one-time", // one-time, lifetime, or subscription
//                   expires_at:
//                     paymentIntent.metadata.purchaseType === "lifetime"
//                       ? null
//                       : paymentIntent.metadata.expiresAt ||
//                         new Date(
//                           Date.now() + 30 * 24 * 60 * 60 * 1000
//                         ).toISOString(), // 30 days default for one-time
//                 },
//                 {
//                   onConflict: "customer_id,product_id",
//                 }
//               );

//             if (upsertError) {
//               console.error("Error upserting purchase:", upsertError);
//             }
//           }
//         }
//         break;
//       }

//       case "charge.refunded": {
//         const charge = event.data.object as Stripe.Charge;

//         // Fetch the payment intent to get product information
//         if (charge.payment_intent) {
//           const paymentIntent = await stripe.paymentIntents.retrieve(
//             charge.payment_intent as string
//           );

//           // Get the line items to find product information
//           if (paymentIntent.metadata.productId) {
//             const { error: upsertError } = await supabase
//               .from("customer_purchases")
//               .upsert(
//                 {
//                   customer_id: charge.customer,
//                   product_id: paymentIntent.metadata.productId,
//                   status: charge.status,
//                   amount: charge.amount,
//                   currency: charge.currency,
//                   last_updated: new Date().toISOString(),
//                   charge_id: charge.id,
//                   purchase_type:
//                     paymentIntent.metadata.purchaseType || "one-time",
//                   expires_at: new Date().toISOString(), // Set expiration to now for refunds
//                 },
//                 {
//                   onConflict: "customer_id,product_id",
//                 }
//               );

//             if (upsertError) {
//               console.error("Error upserting purchase:", upsertError);
//             }
//           }
//         }
//         break;
//       }

//       case "customer.subscription.created":
//       case "customer.subscription.updated": {
//         const subscription = event.data.object as Stripe.Subscription;

//         // Get the product ID from the subscription items
//         const subscriptionItem = subscription.items.data[0];
//         if (subscriptionItem) {
//           const { error: upsertError } = await supabase
//             .from("customer_purchases")
//             .upsert(
//               {
//                 customer_id: subscription.customer as string,
//                 product_id: subscriptionItem.price.product as string,
//                 status: subscription.status,
//                 amount: subscriptionItem.price.unit_amount || 0,
//                 currency: subscription.currency,
//                 last_updated: new Date().toISOString(),
//                 charge_id: subscription.latest_invoice as string,
//                 purchase_type: "subscription",
//                 expires_at: new Date(
//                   subscription.current_period_end * 1000
//                 ).toISOString(),
//               },
//               {
//                 onConflict: "customer_id,product_id",
//               }
//             );

//           if (upsertError) {
//             console.error("Error upserting subscription:", upsertError);
//           }
//         }
//         break;
//       }

//       case "customer.subscription.deleted": {
//         const subscription = event.data.object as Stripe.Subscription;

//         // Get the product ID from the subscription items
//         const subscriptionItem = subscription.items.data[0];
//         if (subscriptionItem) {
//           const { error: upsertError } = await supabase
//             .from("customer_purchases")
//             .upsert(
//               {
//                 customer_id: subscription.customer as string,
//                 product_id: subscriptionItem.price.product as string,
//                 status: "canceled",
//                 amount: subscriptionItem.price.unit_amount || 0,
//                 currency: subscription.currency,
//                 last_updated: new Date().toISOString(),
//                 charge_id: subscription.latest_invoice as string,
//                 purchase_type: "subscription",
//                 expires_at: new Date().toISOString(), // Set expiration to now for canceled subscriptions
//               },
//               {
//                 onConflict: "customer_id,product_id",
//               }
//             );

//           if (upsertError) {
//             console.error("Error upserting subscription:", upsertError);
//           }
//         }
//         break;
//       }

//       default:
//         console.log("unhandled stripe event", dateTime, event.type);
//         break;
//     }

//     return NextResponse.json({ status: "success", event: event.type });
//   } catch (error) {
//     console.error("Webhook error:", error);
//     return NextResponse.json({ status: "error", error });
//   }
// }
