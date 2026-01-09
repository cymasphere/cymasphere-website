/**
 * @fileoverview Trial ending reminder email sender API endpoint
 * 
 * This endpoint finds Stripe subscriptions with trials ending soon and sends
 * reminder emails. Called by scheduled jobs to automatically notify users
 * before their trial ends.
 * 
 * Sends reminders:
 * - 7 days before trial end for 14-day trials
 * - 4 days before trial end for 7-day trials
 * 
 * @module api/trial-ending-reminders/send
 */

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createSupabaseServiceRole } from "@/utils/supabase/service";
import { sendEmail } from "@/utils/email";
import {
  generateTrialEndingReminderHtml,
  generateTrialEndingReminderText,
} from "@/utils/email-campaigns/trial-ending-reminder";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

/**
 * @brief Generate Stripe update payment method URL
 * 
 * Creates a billing portal session URL that directs users to update their
 * payment method. Uses Stripe's billing portal with return URL tracking.
 * 
 * @param customerId Stripe customer ID
 * @param subscriptionId Stripe subscription ID (for tracking)
 * @returns Billing portal session URL
 * @note Uses Stripe billing portal - users can update payment method from there
 * @note The URL pattern matches Stripe's standard billing portal format
 */
async function generateUpdatePaymentMethodUrl(
  customerId: string,
  subscriptionId: string
): Promise<string> {
  try {
    // Create a billing portal session
    // Users will be able to update payment method from the portal
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://cymasphere.com'}/dashboard?referer=free_trial_ending`,
    });

    return session.url;
  } catch (error) {
    console.error('Error creating billing portal session:', error);
    // If billing portal fails, construct a direct URL (fallback)
    // This matches the pattern from Stripe's email: billing.stripe.com/subscription/update_payment_method/{subscription_id}
    const baseUrl = process.env.STRIPE_SECRET_KEY?.includes('test')
      ? 'https://billing.stripe.com/test'
      : 'https://billing.stripe.com';
    return `${baseUrl}/subscription/update_payment_method/${subscriptionId}?referer=free_trial_ending`;
  }
}

/**
 * @brief Get plan name and price from subscription
 * 
 * Extracts plan information from Stripe subscription to display in email.
 * 
 * @param subscription Stripe subscription object
 * @returns Object with plan name and monthly price
 */
function getPlanInfo(subscription: Stripe.Subscription): {
  planName: string;
  monthlyPrice: number;
} {
  const price = subscription.items.data[0]?.price;
  if (!price) {
    return { planName: 'Cymasphere Pro', monthlyPrice: 6.0 };
  }

  const amount = (price.unit_amount || 0) / 100;
  let planName = 'Cymasphere Pro';

  if (price.recurring?.interval === 'month') {
    planName = 'Monthly Subscription';
  } else if (price.recurring?.interval === 'year') {
    planName = 'Annual Subscription';
  }

  // For annual, calculate monthly equivalent for display
  const monthlyPrice = price.recurring?.interval === 'year' ? amount / 12 : amount;

  return { planName, monthlyPrice };
}

/**
 * @brief POST endpoint to send trial ending reminder emails
 * 
 * Finds all active Stripe subscriptions with trials ending soon and sends
 * reminder emails. Checks both 7-day and 14-day trial windows.
 * 
 * Query parameters:
 * - dryRun: If true, only logs what would be sent without actually sending (optional)
 * 
 * Responses:
 * 
 * 200 OK - Success:
 * ```json
 * {
 *   "success": true,
 *   "processed": 5,
 *   "sent": 5,
 *   "errors": 0,
 *   "details": [...]
 * }
 * ```
 * 
 * 500 Internal Server Error:
 * ```json
 * {
 *   "error": "Failed to process trial reminders"
 * }
 * ```
 * 
 * @param request Next.js request object
 * @returns NextResponse with processing results
 * @note Requires authentication via Authorization header or CRON_SECRET
 * @note Sends 7 days before for 14-day trials, 4 days before for 7-day trials
 * 
 * @example
 * ```typescript
 * // POST /api/trial-ending-reminders/send
 * // Returns: { success: true, processed: 5, sent: 5, errors: 0 }
 * ```
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication (cron job or manual trigger)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      // Allow if no CRON_SECRET is set (for development)
      if (cronSecret) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    const { searchParams } = new URL(request.url);
    const dryRun = searchParams.get('dryRun') === 'true';
    const testEmail = searchParams.get('testEmail'); // Optional: send to specific email for testing

    const supabase = await createSupabaseServiceRole();
    const now = Math.floor(Date.now() / 1000); // Current time in Unix timestamp
    const oneDayInSeconds = 86400;

    // Calculate target dates for reminders
    // 7 days before for 14-day trials
    const sevenDaysFromNow = now + (7 * oneDayInSeconds);
    // 4 days before for 7-day trials
    const fourDaysFromNow = now + (4 * oneDayInSeconds);

    console.log(`🔍 Looking for subscriptions with trials ending soon...`);
    console.log(`   Target dates: 7 days (${new Date(sevenDaysFromNow * 1000).toISOString()}), 4 days (${new Date(fourDaysFromNow * 1000).toISOString()})`);
    if (testEmail) {
      console.log(`   🧪 TEST MODE: Will send to ${testEmail} regardless of timing`);
    }

    // Find all active subscriptions with trials
    let subscriptions;
    if (testEmail) {
      // For testing: find subscription by customer email
      const customers = await stripe.customers.list({
        email: testEmail,
        limit: 10,
      });
      
      if (customers.data.length === 0) {
        return NextResponse.json({
          success: false,
          error: `No Stripe customer found with email: ${testEmail}`,
        }, { status: 404 });
      }

      // Get subscriptions for this customer
      const customerSubscriptions = await stripe.subscriptions.list({
        customer: customers.data[0].id,
        status: 'all',
        limit: 10,
      });
      
      subscriptions = { data: customerSubscriptions.data };
      console.log(`   Found ${subscriptions.data.length} subscription(s) for ${testEmail}`);
    } else {
      subscriptions = await stripe.subscriptions.list({
        status: 'trialing',
        limit: 100,
      });
    }

    console.log(`📊 Found ${subscriptions.data.length} trialing subscriptions`);

    const results = [];
    let sentCount = 0;
    let errorCount = 0;

    for (const subscription of subscriptions.data) {
      try {
        // Skip if no trial_end
        if (!subscription.trial_end) {
          continue;
        }

        const trialEnd = subscription.trial_end;
        const daysUntilTrialEnd = Math.floor((trialEnd - now) / oneDayInSeconds);

        // Calculate trial duration (approximate)
        const trialStart = subscription.trial_start || subscription.created;
        const trialDurationDays = Math.floor((trialEnd - trialStart) / oneDayInSeconds);

        // Determine if we should send reminder
        // Check if trial ends in exactly the target number of days (with small tolerance for timing)
        // OR if testEmail is provided, always send (for testing)
        let shouldSend = false;
        let reminderType = '';

        if (testEmail && customerEmail === testEmail) {
          // TEST MODE: Always send to the test email
          shouldSend = true;
          if (trialDurationDays >= 13) {
            reminderType = '14-day trial (TEST MODE - 7 days before)';
          } else {
            reminderType = '7-day trial (TEST MODE - 4 days before)';
          }
        } else {
          // Normal mode: check timing
          if (trialDurationDays >= 13) {
            // 14-day trial, send 7 days before
            // Check if trial ends in 6.5 to 7.5 days (to account for cron timing)
            const hoursUntilTrialEnd = (trialEnd - now) / 3600;
            if (hoursUntilTrialEnd >= 6.5 * 24 && hoursUntilTrialEnd <= 7.5 * 24) {
              shouldSend = true;
              reminderType = '14-day trial (7 days before)';
            }
          } else if (trialDurationDays <= 7) {
            // 7-day trial, send 4 days before
            // Check if trial ends in 3.5 to 4.5 days (to account for cron timing)
            const hoursUntilTrialEnd = (trialEnd - now) / 3600;
            if (hoursUntilTrialEnd >= 3.5 * 24 && hoursUntilTrialEnd <= 4.5 * 24) {
              shouldSend = true;
              reminderType = '7-day trial (4 days before)';
            }
          }
        }

        if (!shouldSend) {
          continue;
        }

        // Get customer and user info
        const customerId = subscription.customer as string;
        const customer = await stripe.customers.retrieve(customerId);
        
        if (typeof customer === 'string' || customer.deleted || !customer.email) {
          console.warn(`⚠️ Skipping subscription ${subscription.id}: invalid customer`);
          continue;
        }

        // Find user in database
        let profile = null;
        const { data: profileByCustomerId } = await supabase
          .from('profiles')
          .select('id, email, first_name, last_name')
          .eq('customer_id', customerId)
          .limit(1)
          .maybeSingle();

        if (profileByCustomerId) {
          profile = profileByCustomerId;
        } else if (customer.email) {
          // Fallback to email lookup
          const { data: profileByEmail } = await supabase
            .from('profiles')
            .select('id, email, first_name, last_name')
            .eq('email', customer.email)
            .limit(1)
            .maybeSingle();
          
          if (profileByEmail) {
            profile = profileByEmail;
          }
        }

        const customerName = profile?.first_name && profile?.last_name
          ? `${profile.first_name} ${profile.last_name}`
          : customer.name || customer.email?.split('@')[0] || undefined;

        const customerEmail = customer.email;
        if (!customerEmail) {
          console.warn(`⚠️ Skipping subscription ${subscription.id}: no email`);
          continue;
        }

        // Check if we've already sent a reminder for this subscription
        // (You might want to add a tracking table for this)
        // For now, we'll send once per day by checking if trial_end matches our target dates

        // Get plan info
        const { planName, monthlyPrice } = getPlanInfo(subscription);

        // Generate update payment method URL
        const updatePaymentMethodUrl = await generateUpdatePaymentMethodUrl(
          customerId,
          subscription.id
        );

        // Generate email content
        const emailData = {
          customerName,
          customerEmail,
          trialEndDate: new Date(trialEnd * 1000).toISOString(),
          trialDays: trialDurationDays,
          planName,
          monthlyPrice,
          updatePaymentMethodUrl,
        };

        const htmlContent = generateTrialEndingReminderHtml(emailData);
        const textContent = generateTrialEndingReminderText(emailData);

        if (dryRun) {
          console.log(`[DRY RUN] Would send trial ending reminder to ${customerEmail}`);
          results.push({
            subscriptionId: subscription.id,
            customerEmail,
            trialEndDate: new Date(trialEnd * 1000).toISOString(),
            reminderType,
            status: 'would_send',
          });
        } else {
          // Send email
          await sendEmail({
            to: customerEmail,
            subject: `Your free trial ends on ${new Date(trialEnd * 1000).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`,
            html: htmlContent,
            text: textContent,
          });

          sentCount++;
          results.push({
            subscriptionId: subscription.id,
            customerEmail,
            trialEndDate: new Date(trialEnd * 1000).toISOString(),
            reminderType,
            status: 'sent',
          });

          console.log(`✅ Sent trial ending reminder to ${customerEmail} (${reminderType})`);
        }
      } catch (error) {
        errorCount++;
        console.error(`❌ Error processing subscription ${subscription.id}:`, error);
        results.push({
          subscriptionId: subscription.id,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return NextResponse.json({
      success: true,
      processed: subscriptions.data.length,
      sent: sentCount,
      errors: errorCount,
      details: results,
      dryRun,
    });
  } catch (error) {
    console.error('Error in trial ending reminders:', error);
    return NextResponse.json(
      {
        error: 'Failed to process trial reminders',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
