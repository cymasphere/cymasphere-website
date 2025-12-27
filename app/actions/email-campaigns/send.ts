/**
 * @fileoverview Email campaign sending server actions
 * 
 * This file contains server actions for sending email campaigns to subscribers.
 * Includes safety mechanisms to prevent accidental sends, support for scheduled
 * campaigns, timezone-aware delivery, and batch email processing. Handles
 * personalization, HTML/text generation, and campaign tracking.
 * 
 * @module actions/email-campaigns/send
 */

"use server";

import { sendEmail } from "@/utils/email";
import { createClient } from "@/utils/supabase/server";
import { generateHtmlFromElements, generateTextFromElements, personalizeContent } from "@/utils/email-campaigns/email-generation";

/**
 * Safety configuration flags for preventing accidental email sends
 * @note Set to true only when explicitly testing email functionality
 */
const DEVELOPMENT_MODE = false; // Temporarily disabled for testing
const TEST_MODE = false; // Temporarily disabled for testing

/**
 * Safe email whitelist for development/testing
 * Only these emails will receive messages when safety modes are enabled
 */
const SAFE_TEST_EMAILS = [
  "ryan@cymasphere.com",
  "test@cymasphere.com",
  "demo@cymasphere.com",
];

// 🔒 TEST AUDIENCE IDENTIFIERS - Audiences that are safe to send to
const TEST_AUDIENCE_NAMES = [
  "Test Audience",
  "TEST AUDIENCE",
  "Development Test",
  "Safe Test Audience",
];

export interface SendCampaignParams {
  campaignId?: string;
  name: string;
  subject: string;
  preheader?: string; // Email preheader text shown in inbox preview
  testEmail?: string; // optional test recipient; if present, send only to this address with [TEST] prefix
  brandHeader?: string;
  audienceIds: string[]; // Updated to match new audience system
  excludedAudienceIds?: string[];
  emailElements: any[];
  scheduleType: "immediate" | "scheduled" | "timezone" | "draft";
  scheduleDate?: string;
  scheduleTime?: string;
}

export interface SendCampaignResponse {
  success: boolean;
  status?: string;
  message?: string;
  campaignId?: string;
  scheduleType?: string;
  stats?: {
    total?: number;
    sent?: number;
    failed?: number;
    successRate?: string;
    mode?: string;
    safetyEnabled?: boolean;
    audienceCount?: number;
    excludedAudienceCount?: number;
    scheduleType?: string;
    scheduledDateTime?: string;
    sendTime?: string;
    deliveryWindow?: string;
    estimatedStartTime?: string;
    estimatedCompletionTime?: string;
  };
  results?: Array<{
    subscriberId?: string;
    email?: string;
    messageId?: string;
    sendId?: string;
    status?: string;
  }>;
  errors?: Array<{
    subscriberId?: string;
    email?: string;
    error?: string;
    sendId?: string;
    status?: string;
  }>;
  scheduledFor?: string;
  error?: string;
}

// Get real subscribers from database based on audience selection
async function getSubscribersForAudiences(
  supabase: any,
  audienceIds: string[],
  excludedAudienceIds: string[] = []
) {
  try {
    console.log("🔍 Getting subscribers for audiences:", {
      audienceIds,
      excludedAudienceIds,
    });

    if (!audienceIds || audienceIds.length === 0) {
      return [];
    }

    // Get audience details to check if they're test audiences
    // Use authenticated client (admin check already passed, RLS will allow access)
    const { data: audiences, error: audienceError } = await supabase
      .from("email_audiences")
      .select("id, name, description")
      .in("id", audienceIds);

    if (audienceError) {
      console.error("❌ Error fetching audience details:", audienceError);
      return [];
    }

    console.log("📊 Audience details:", audiences);

    // 🔒 SAFETY CHECK: Verify we're only sending to test audiences in development
    if (DEVELOPMENT_MODE || TEST_MODE) {
      const nonTestAudiences = audiences?.filter(
        (aud: any) =>
          !TEST_AUDIENCE_NAMES.some((testName) =>
            aud.name.toLowerCase().includes(testName.toLowerCase())
          )
      );

      if (nonTestAudiences && nonTestAudiences.length > 0) {
        console.error(
          "🚨 SAFETY BLOCK: Attempting to send to non-test audience in development mode"
        );
        console.error(
          "Non-test audiences:",
          nonTestAudiences.map((a: any) => a.name)
        );
        throw new Error(
          `SAFETY BLOCK: Cannot send to non-test audiences in development mode. Detected: ${nonTestAudiences
            .map((a: any) => a.name)
            .join(", ")}`
        );
      }

      console.log(
        "🔒 SAFETY: All selected audiences are test audiences, proceeding with whitelist filter"
      );
    }

    // Get subscribers directly from database (avoid API authentication issues)
    const allSubscribers = new Set();
    const subscriberDetails = new Map();

    for (const audienceId of audienceIds) {
      try {
        console.log(`🔍 Getting subscribers for audience: ${audienceId}`);

        // Get audience to check if it's static
        const { data: audience } = await supabase
          .from("email_audiences")
          .select("id, name, filters")
          .eq("id", audienceId)
          .single();

        if (!audience) {
          console.error(`❌ Audience ${audienceId} not found`);
          continue;
        }

        const filters = (audience.filters as any) || {};
        console.log(
          `📋 Audience "${audience.name}" type:`,
          filters.audience_type || "dynamic"
        );

        let subscribers = [];

        // For static audiences, get subscribers from the junction table
        if (filters.audience_type === "static") {
          console.log(
            "📋 Static audience - getting subscribers from junction table"
          );

          // Get subscribers via junction table
          const { data: relations, error: relationsError } = await supabase
            .from("email_audience_subscribers")
            .select(
              `
              subscriber_id,
              subscribers (
                id,
                email,
                status,
                created_at,
                metadata
              )
            `
            )
            .eq("audience_id", audienceId);

          if (relationsError) {
            console.error(
              `❌ Error getting relations for audience ${audienceId}:`,
              relationsError
            );
            continue;
          }

          console.log(
            `📊 Found ${relations?.length || 0} subscriber relations`
          );
          console.log(
            "📊 Raw relations data:",
            JSON.stringify(relations, null, 2)
          );

          subscribers = (relations || [])
            .map((rel: any) => rel.subscribers)
            .filter(Boolean);
          console.log(
            "📊 Extracted subscribers:",
            JSON.stringify(subscribers, null, 2)
          );
        } else {
          // For dynamic audiences, query subscribers based on filters
          console.log(
            `📋 Dynamic audience - querying subscribers based on filters`
          );

          try {
            // Extract filter rules
            const rules = filters.rules || [];
            let statusValue: string | null = null;
            let subscriptionValue: string | null = null;
            let additionalRules: any[] = [];

            for (const rule of rules) {
              if (rule.field === 'status') {
                statusValue = rule.value;
              } else if (rule.field === 'subscription') {
                subscriptionValue = rule.value;
              } else {
                additionalRules.push(rule);
              }
            }

            // Default to active status if not specified
            const effectiveStatus = statusValue || 'active';

            // Build query for subscribers
            let subscribersQuery = supabase
              .from('subscribers')
              .select('id, email, status, created_at, metadata, user_id')
              .eq('status', effectiveStatus);

            // If subscription filter is needed, join with profiles
            if (subscriptionValue) {
              const { data: profilesData } = await supabase
                .from('profiles')
                .select('id')
                .eq('subscription', subscriptionValue);

              const profileIds = (profilesData || []).map((p: any) => p.id);
              if (profileIds.length === 0) {
                console.log(`⚠️ No profiles found with subscription: ${subscriptionValue}`);
                subscribers = [];
              } else {
                subscribersQuery = subscribersQuery.in('user_id', profileIds);
              }
            }

            // Execute query
            const { data: dynamicSubscribers, error: dynamicError } = await subscribersQuery;

            if (dynamicError) {
              console.error(`❌ Error querying dynamic subscribers:`, dynamicError);
              continue;
            }

            subscribers = dynamicSubscribers || [];
            console.log(
              `📊 Dynamic audience query returned ${subscribers.length} subscribers`
            );
          } catch (error) {
            console.error(`❌ Error processing dynamic audience:`, error);
            continue;
          }
        }

        console.log(
          `📧 Audience ${audienceId}: ${subscribers.length} subscribers found`
        );
        console.log(
          `📧 Subscribers:`,
          subscribers.map((s: any) => ({
            id: s.id,
            email: s.email,
            status: s.status,
          }))
        );
        console.log(
          `📧 Full subscriber details:`,
          JSON.stringify(subscribers, null, 2)
        );

        subscribers.forEach((sub: any) => {
          // 🚫 UNSUBSCRIBE FILTER: Skip INACTIVE (unsubscribed) subscribers
          if (sub.status === 'INACTIVE' || sub.status === 'unsubscribed') {
            console.log(
              `🚫 UNSUBSCRIBE: Skipping unsubscribed email: ${sub.email} (status: ${sub.status})`
            );
            return;
          }

          // 🔒 SAFETY FILTER: In development, only allow whitelisted emails
          if (DEVELOPMENT_MODE || TEST_MODE) {
            if (!SAFE_TEST_EMAILS.includes(sub.email)) {
              console.log(
                `🔒 SAFETY: Skipping non-whitelisted email: ${sub.email}`
              );
              return;
            }
          }

          console.log(`✅ Adding subscriber: ${sub.email} (${sub.status})`);
          allSubscribers.add(sub.id);

          const metadata = (sub.metadata as any) || {};
          subscriberDetails.set(sub.id, {
            id: sub.id,
            email: sub.email,
            name:
              [metadata.first_name, metadata.last_name]
                .filter(Boolean)
                .join(" ") || sub.email.split("@")[0],
            first_name: metadata.first_name,
            last_name: metadata.last_name,
            status: sub.status || "active",
          });
        });
      } catch (error) {
        console.error(
          `❌ Error fetching subscribers for audience ${audienceId}:`,
          error
        );
      }
    }

    // Remove excluded audience subscribers
    // Matching API route logic exactly - implements the same logic directly
    if (excludedAudienceIds && excludedAudienceIds.length > 0) {
      for (const excludedAudienceId of excludedAudienceIds) {
        try {
          console.log(`🔍 Getting excluded subscribers for audience: ${excludedAudienceId}`);

          // Get audience to check if it's static
          const { data: excludedAudience } = await supabase
            .from("email_audiences")
            .select("id, name, filters")
            .eq("id", excludedAudienceId)
            .single();

          if (!excludedAudience) {
            console.error(`❌ Excluded audience ${excludedAudienceId} not found`);
            continue;
          }

          const excludedFilters = (excludedAudience.filters as any) || {};
          console.log(
            `📋 Excluded audience "${excludedAudience.name}" type:`,
            excludedFilters.audience_type || "dynamic"
          );

          let excludedSubscribers = [];

          // For static audiences, get subscribers from the junction table
          if (excludedFilters.audience_type === "static") {
            console.log(
              "📋 Static excluded audience - getting subscribers from junction table"
            );

            // Get subscribers via junction table
            const { data: relations, error: relationsError } = await supabase
              .from("email_audience_subscribers")
              .select(
                `
                subscriber_id,
                subscribers (
                  id,
                  email,
                  status,
                  created_at,
                  metadata
                )
              `
              )
              .eq("audience_id", excludedAudienceId);

            if (relationsError) {
              console.error(
                `❌ Error getting relations for excluded audience ${excludedAudienceId}:`,
                relationsError
              );
              continue;
            }

            excludedSubscribers = (relations || [])
              .map((rel: any) => rel.subscribers)
              .filter(Boolean);
          } else {
            // For dynamic excluded audiences, query subscribers based on filters
            console.log(
              `📋 Dynamic excluded audience - querying subscribers based on filters`
            );

            try {
              // Extract filter rules
              const rules = excludedFilters.rules || [];
              let statusValue: string | null = null;
              let subscriptionValue: string | null = null;
              let additionalRules: any[] = [];

              for (const rule of rules) {
                if (rule.field === 'status') {
                  statusValue = rule.value;
                } else if (rule.field === 'subscription') {
                  subscriptionValue = rule.value;
                } else {
                  additionalRules.push(rule);
                }
              }

              // Default to active status if not specified
              const effectiveStatus = statusValue || 'active';

              // Build query for subscribers
              let subscribersQuery = supabase
                .from('subscribers')
                .select('id, email, status, created_at, metadata, user_id')
                .eq('status', effectiveStatus);

              // If subscription filter is needed, join with profiles
              if (subscriptionValue) {
                const { data: profilesData } = await supabase
                  .from('profiles')
                  .select('id')
                  .eq('subscription', subscriptionValue);

                const profileIds = (profilesData || []).map((p: any) => p.id);
                if (profileIds.length === 0) {
                  console.log(`⚠️ No profiles found with subscription: ${subscriptionValue}`);
                  excludedSubscribers = [];
                } else {
                  subscribersQuery = subscribersQuery.in('user_id', profileIds);
                }
              }

              // Execute query
              const { data: dynamicSubscribers, error: dynamicError } = await subscribersQuery;

              if (dynamicError) {
                console.error(`❌ Error querying dynamic excluded subscribers:`, dynamicError);
                continue;
              }

              excludedSubscribers = dynamicSubscribers || [];
              console.log(
                `📊 Dynamic excluded audience query returned ${excludedSubscribers.length} subscribers`
              );
            } catch (error) {
              console.error(`❌ Error processing dynamic excluded audience:`, error);
              continue;
            }
          }

          console.log(
            `📧 Excluded audience ${excludedAudienceId}: ${excludedSubscribers.length} subscribers found`
          );

          // Remove excluded subscribers from the main list
          excludedSubscribers.forEach((sub: any) => {
            allSubscribers.delete(sub.id);
            subscriberDetails.delete(sub.id);
            console.log(`🚫 Removed excluded subscriber: ${sub.email} (${sub.id})`);
          });
        } catch (error) {
          console.error(
            `❌ Error fetching excluded subscribers for audience ${excludedAudienceId}:`,
            error
          );
        }
      }
    }

    const finalSubscribers = Array.from(allSubscribers).map((id) =>
      subscriberDetails.get(id)
    );

    console.log(`🎯 Final subscriber count: ${finalSubscribers.length}`);
    console.log(
      `🎯 Final subscribers:`,
      finalSubscribers.map((s: any) => ({
        id: s?.id,
        email: s?.email,
        status: s?.status,
      }))
    );
    
    // Log unsubscribe filtering summary
    const activeSubscribers = finalSubscribers.filter(s => s?.status === 'active');
    const inactiveSubscribers = finalSubscribers.filter(s => s?.status === 'INACTIVE' || s?.status === 'unsubscribed');
    console.log(`🚫 Unsubscribe filtering summary:`, {
      total: finalSubscribers.length,
      active: activeSubscribers.length,
      inactive: inactiveSubscribers.length,
      inactiveEmails: inactiveSubscribers.map(s => s?.email)
    });
    console.log(`🎯 All subscriber IDs:`, Array.from(allSubscribers));
    console.log(
      `🎯 Subscriber details map:`,
      Object.fromEntries(subscriberDetails)
    );
    console.log(
      `🔒 Safety mode: ${DEVELOPMENT_MODE ? "DEVELOPMENT" : "PRODUCTION"}`
    );
    console.log(`🔒 Whitelisted emails: ${SAFE_TEST_EMAILS.join(", ")}`);

    return finalSubscribers;
  } catch (error) {
    console.error("❌ Error getting subscribers:", error);
    throw error;
  }
}

// NOTE: Email generation functions are now imported from utils/email-campaigns/email-generation.ts
// Removed local definitions to prevent duplication - functions are imported at the top

/**
 * Send an email campaign (admin only)
 */
/**
 * @brief Server action to send an email campaign to subscribers
 * 
 * Sends an email campaign to selected audiences with support for:
 * - Test email mode (sends to single test address with [TEST] prefix)
 * - Immediate sending
 * - Scheduled sending (date/time)
 * - Timezone-aware scheduled sending
 * - Draft mode (saves without sending)
 * 
 * Includes safety mechanisms:
 * - Development mode restrictions (whitelist emails only)
 * - Test mode restrictions (test audiences only)
 * - Email validation and subscriber filtering
 * - Batch email processing with AWS SES
 * - Personalization per subscriber
 * - Campaign tracking and analytics
 * 
 * @param params Campaign parameters including content, audiences, and schedule
 * @returns Promise with send results, statistics, and any errors
 * @note Requires admin access (enforced by RLS policies)
 * @note Respects subscriber status (only sends to active subscribers)
 * @note Handles excluded audiences (removes subscribers from excluded audiences)
 * @note Creates campaign record in database if campaignId not provided
 * @note Generates HTML and text versions of email from elements
 * 
 * @example
 * ```typescript
 * const result = await sendCampaign({
 *   name: "Welcome Campaign",
 *   subject: "Welcome to Cymasphere!",
 *   audienceIds: ["audience-1", "audience-2"],
 *   emailElements: [...],
 *   scheduleType: "immediate"
 * });
 * // Returns: { success: true, stats: {...}, results: [...] }
 * ```
 */
export async function sendCampaign(
  params: SendCampaignParams
): Promise<SendCampaignResponse> {
  try {
    // Note: RLS will enforce admin access - if user is not admin, queries will fail
    const supabase = await createClient();

    const {
      campaignId,
      name,
      subject,
      preheader,
      testEmail,
      brandHeader,
      audienceIds,
      excludedAudienceIds = [],
      emailElements,
      scheduleType,
      scheduleDate,
      scheduleTime,
    } = params;

    console.log("📧 Send campaign request:", {
      name,
      subject,
      audienceIds,
      excludedAudienceIds,
      scheduleType,
      scheduleDate,
      scheduleTime,
      campaignId,
      emailElementsCount: emailElements?.length || 0,
      emailElementsPreview: emailElements?.slice(0, 2) || "undefined",
      developmentMode: DEVELOPMENT_MODE,
      testMode: TEST_MODE,
    });

    // 🔍 DEBUG: Check padding values in emailElements
    if (emailElements && emailElements.length > 0) {
      console.log("🎯 PADDING DEBUG - First element padding values:", {
        id: emailElements[0].id,
        type: emailElements[0].type,
        paddingTop: emailElements[0].paddingTop,
        paddingBottom: emailElements[0].paddingBottom,
        paddingLeft: emailElements[0].paddingLeft,
        paddingRight: emailElements[0].paddingRight,
        fullWidth: emailElements[0].fullWidth,
        allKeys: Object.keys(emailElements[0])
      });
    }

    // 🎯 TEST EMAIL MODE: If testEmail is provided, send a single email to that address (process FIRST)
    if (testEmail && typeof testEmail === 'string') {
      const emailTrimmed = testEmail.trim();
      const isValid = /.+@.+\..+/.test(emailTrimmed);
      if (!isValid) {
        throw new Error('Invalid test email address');
      }

      const subjectWithTest = subject.startsWith('[TEST]') ? subject : `[TEST] ${subject}`;
      // Ensure we have a real campaign id for proper view-in-browser links
      let realCampaignIdForTest = campaignId && /^[0-9a-f-]{36}$/i.test(campaignId) ? campaignId : undefined;

      if (!realCampaignIdForTest) {
        try {
          // Create a placeholder campaign to obtain a UUID (status draft)
          const { data: newCampaign, error: newCampErr } = await supabase
            .from("email_campaigns")
            .insert({
              name: name || "Test Campaign",
              subject: subjectWithTest,
              sender_name: "Cymasphere",
              sender_email: "support@cymasphere.com",
              status: "draft"
            })
            .select("id")
            .single();

          if (newCampErr) {
            console.warn("⚠️ Could not create placeholder campaign for test:", newCampErr.message);
          } else {
            realCampaignIdForTest = newCampaign.id;
          }
        } catch (e) {
          console.warn("⚠️ Exception creating placeholder campaign for test:", e);
        }
      }

      const textContentForTest = generateTextFromElements(emailElements);
      const baseHtmlContentForTest = generateHtmlFromElements(
        emailElements,
        subjectWithTest,
        realCampaignIdForTest,
        undefined,
        undefined,
        preheader
      );

      console.log(`📧 Sending test email to: ${emailTrimmed}`);
      console.log(`📧 Test email subject: ${subjectWithTest}`);
      console.log(`📧 HTML content length: ${baseHtmlContentForTest.length}`);
      
      const result = await sendEmail({
        to: emailTrimmed,
        subject: subjectWithTest,
        html: baseHtmlContentForTest,
        text: textContentForTest,
        from: "Cymasphere Support <support@cymasphere.com>",
      });

      console.log(`📧 Test email send result:`, JSON.stringify(result, null, 2));

      if (result.success) {
        console.log(`✅ Test email sent successfully to ${emailTrimmed}, MessageId: ${result.messageId}`);
        // Test email sent successfully - don't overwrite the original campaign HTML
        // The original campaign data with embedded elements JSON should be preserved
        return {
          success: true,
          status: 'test-sent',
          message: `Test email sent to ${emailTrimmed}`,
          results: [{ email: emailTrimmed, status: 'sent', messageId: result.messageId }],
          campaignId: realCampaignIdForTest
        };
      }

      console.error(`❌ Test email failed to send:`, result.error);
      throw new Error(result.error || 'Failed to send test email');
    }

    // Validate required fields (skip when testEmail is used)
    if (
      !name ||
      !subject ||
      !audienceIds ||
      audienceIds.length === 0 ||
      !emailElements
    ) {
      console.error("❌ Missing required fields:", {
        name: !!name,
        subject: !!subject,
        audienceIds: !!audienceIds && audienceIds.length > 0,
        emailElements: !!emailElements,
      });
      throw new Error(
        "Missing required campaign fields (name, subject, audiences, content)"
      );
    }

    // 🔒 SAFETY WARNING for development mode
    if (DEVELOPMENT_MODE || TEST_MODE) {
      console.log(
        "🔒 SAFETY MODE ACTIVE - Emails restricted to whitelist:",
        SAFE_TEST_EMAILS
      );
    }

    // If it's a draft, just save and return
    if (scheduleType === "draft") {
      return {
        success: true,
        message: "Campaign saved as draft",
        campaignId: campaignId || `campaign_${Date.now()}`,
        status: "draft",
      };
    }

    // If scheduled for later, save schedule and return
    if (scheduleType === "scheduled") {
      // Validate required fields for scheduled campaigns
      if (!scheduleDate || !scheduleTime) {
        console.error("❌ Scheduled campaign missing date or time:", { scheduleDate, scheduleTime });
        throw new Error("Scheduled campaigns require both a date and time");
      }
      // If we have a campaignId, get the scheduled_at time from the already-saved campaign
      let scheduledDateTime;

      if (campaignId) {
        try {
          // Get the campaign's scheduled_at value (which includes proper timezone)
          const { data: campaign, error } = await supabase
            .from("email_campaigns")
            .select("scheduled_at")
            .eq("id", campaignId)
            .single();

          if (error) {
            console.error("Error fetching campaign scheduled_at:", error);
            // Fallback to reconstructing from date/time
            scheduledDateTime = new Date(`${scheduleDate}T${scheduleTime}:00`);
          } else if (campaign.scheduled_at) {
            scheduledDateTime = new Date(campaign.scheduled_at);
            console.log("📅 Using saved scheduled_at from campaign:", {
              campaignId,
              savedScheduledAt: campaign.scheduled_at,
              parsedDateTime: scheduledDateTime.toString(),
            });
          } else {
            // No scheduled_at in campaign, fallback to reconstructing
            scheduledDateTime = new Date(`${scheduleDate}T${scheduleTime}:00`);
          }
        } catch (error) {
          console.error("Error fetching campaign:", error);
          // Fallback to reconstructing from date/time
          scheduledDateTime = new Date(`${scheduleDate}T${scheduleTime}:00`);
        }
      } else {
        // No campaignId, reconstruct from date/time
        scheduledDateTime = new Date(`${scheduleDate}T${scheduleTime}:00`);
      }

      const currentTime = new Date();

      console.log("📅 Validating scheduled time:", {
        scheduleDate,
        scheduleTime,
        scheduledDateTime: scheduledDateTime.toString(),
        scheduledUTC: scheduledDateTime.toISOString(),
        currentTime: currentTime.toString(),
        currentUTC: currentTime.toISOString(),
        timeDifference: scheduledDateTime.getTime() - currentTime.getTime(),
        isInFuture: scheduledDateTime > currentTime,
      });

      // Add a 1-minute buffer to account for processing time and minor clock differences
      const bufferTime = new Date(currentTime.getTime() + 60000); // 1 minute buffer

      if (scheduledDateTime <= bufferTime) {
        throw new Error("Scheduled time must be at least 1 minute in the future");
      }

      // ✅ Campaign is now stored and will be processed by the cron job at /api/email-campaigns/process-scheduled
      console.log(
        `📅 Campaign "${name}" scheduled for: ${scheduledDateTime.toLocaleString()}`
      );
      console.log(
        `📊 Target audiences: ${audienceIds.length} selected, ${
          excludedAudienceIds?.length || 0
        } excluded`
      );

      // Format time in a way that will be consistent on the client
      // Store ISO string and let client format it with their timezone
      const scheduledISO = scheduledDateTime.toISOString();
      
      // CRITICAL: Update the campaign record with scheduled_at if we have a campaignId
      if (campaignId && /^[0-9a-f-]{36}$/i.test(campaignId)) {
        const { error: updateError, data: updateData } = await supabase
          .from("email_campaigns")
          .update({
            scheduled_at: scheduledISO,
            status: "scheduled",
          })
          .eq("id", campaignId)
          .select("id, scheduled_at, status");
        
        if (updateError) {
          console.error("❌ Failed to update campaign scheduled_at:", updateError);
          throw new Error(`Failed to schedule campaign: ${updateError.message}`);
        } else {
          console.log(`✅ Updated campaign ${campaignId} with scheduled_at: ${scheduledISO}`, {
            updatedRecord: updateData?.[0]
          });
        }
      } else {
        console.warn("⚠️ No valid campaignId provided, cannot update scheduled_at:", campaignId);
        throw new Error("Campaign ID is required to schedule a campaign");
      }
      
      return {
        success: true,
        message: `Campaign scheduled for ${scheduledISO}`, // Client will format this
        campaignId: campaignId || `campaign_${Date.now()}`,
        status: "scheduled",
        scheduledFor: scheduledISO,
        stats: {
          audienceCount: audienceIds.length,
          excludedAudienceCount: excludedAudienceIds?.length || 0,
          scheduleType: "scheduled",
          scheduledDateTime: scheduledISO, // Store ISO, client will format
        },
      };
    }

    // If scheduled by timezone, handle timezone-based delivery
    if (scheduleType === "timezone" && scheduleTime) {
      const deliveryWindow = scheduleDate || "24hours"; // scheduleDate stores delivery window for timezone
      const sendTime = scheduleTime; // e.g., "09:00"

      console.log(
        `🌍 Campaign "${name}" scheduled for timezone-based delivery:`
      );
      console.log(
        `   ⏰ Send time: ${sendTime} (in each subscriber's timezone)`
      );
      console.log(`   📅 Delivery window: ${deliveryWindow}`);
      console.log(
        `   📊 Target audiences: ${audienceIds.length} selected, ${
          excludedAudienceIds?.length || 0
        } excluded`
      );

      return {
        success: true,
        message: `Campaign scheduled for timezone-based delivery at ${sendTime} in each subscriber's timezone`,
        campaignId: campaignId || `campaign_${Date.now()}`,
        status: "scheduled",
        scheduleType: "timezone",
        stats: {
          audienceCount: audienceIds.length,
          excludedAudienceCount: excludedAudienceIds?.length || 0,
          scheduleType: "timezone",
          sendTime: sendTime,
          deliveryWindow: deliveryWindow,
          estimatedStartTime: new Date().toLocaleString(),
          estimatedCompletionTime: new Date(
            Date.now() +
              (deliveryWindow === "6hours"
                ? 6
                : deliveryWindow === "12hours"
                ? 12
                : 24) *
                60 *
                60 *
                1000
          ).toLocaleString(),
        },
      };
    }

    // Get real subscribers from database
    console.log("🔍 Fetching subscribers from database...");
    const targetSubscribers = await getSubscribersForAudiences(
      supabase,
      audienceIds,
      excludedAudienceIds
    );

    if (targetSubscribers.length === 0) {
      const errorMessage =
        DEVELOPMENT_MODE || TEST_MODE
          ? `No subscribers found for the selected audiences. In ${
              DEVELOPMENT_MODE ? "development" : "test"
            } mode, only whitelisted emails (${SAFE_TEST_EMAILS.join(
              ", "
            )}) are allowed.`
          : "No active subscribers found for the selected audience";

      throw new Error(errorMessage);
    }

    // Create a real campaign record for immediate sends (if not already provided)
    let realCampaignId = campaignId;

    // For immediate sends, create a campaign record to get a proper UUID
    if (
      scheduleType === "immediate" &&
      (!campaignId || !campaignId.match(/^[0-9a-f-]{36}$/i))
    ) {
      console.log("📝 Creating campaign record for immediate send...");

      // Use authenticated client (admin check already passed, RLS will allow access)
      const { data: newCampaign, error: campaignError } = await supabase
        .from("email_campaigns")
        .insert({
          name,
          subject,
          sender_name: "Cymasphere",
          sender_email: "support@cymasphere.com",
          html_content: generateHtmlFromElements(
            emailElements,
            subject,
            undefined,
            undefined,
            undefined,
            preheader
          ),
          text_content: generateTextFromElements(emailElements),
          status: "sending",
          // created_by omitted - will use default or null
        })
        .select("id")
        .single();

      if (campaignError) {
        console.error(
          "❌ Failed to create campaign record:",
          campaignError.message
        );
        throw new Error("Failed to create campaign record");
      }

      realCampaignId = newCampaign.id;
      console.log("✅ Created campaign record with UUID:", realCampaignId);
    }

    // Generate base HTML and text content (without tracking yet)
    const baseHtmlContent = generateHtmlFromElements(
      emailElements,
      subject,
      undefined,
      undefined,
      undefined,
      preheader
    );
    const textContent = generateTextFromElements(emailElements);

    console.log(
      `🚀 Starting to send campaign "${name}" to ${targetSubscribers.length} subscribers...`
    );

    // 🔒 FINAL SAFETY CHECK before sending
    if (DEVELOPMENT_MODE || TEST_MODE) {
      const unsafeEmails = targetSubscribers.filter(
        (sub) => !SAFE_TEST_EMAILS.includes(sub.email)
      );
      if (unsafeEmails.length > 0) {
        throw new Error(
          `SAFETY BLOCK: Found non-whitelisted emails: ${unsafeEmails
            .map((s) => s.email)
            .join(", ")}`
        );
      }
    }

    // Send emails to all subscribers
    const results: Array<{
      subscriberId?: string;
      email?: string;
      messageId?: string;
      sendId?: string;
      status?: string;
    }> = [];
    const errors: Array<{
      subscriberId?: string;
      email?: string;
      error?: string;
      sendId?: string;
      status?: string;
    }> = [];

    console.log(`\n🚀 Starting email send process...`);
    console.log(`📧 Target subscribers: ${targetSubscribers.length}`);
    targetSubscribers.forEach((sub, i) => {
      console.log(
        `   ${i + 1}. ${sub.email} (ID: ${sub.id}, Status: ${sub.status})`
      );
    });

    for (const subscriber of targetSubscribers) {
      try {
        // Create email_sends record first to get tracking ID
        // Use authenticated client (admin check already passed, RLS will allow access)
        const { data: sendRecord, error: sendError } = await supabase
          .from("email_sends")
          .insert({
            campaign_id: realCampaignId,
            subscriber_id: subscriber.id,
            email: subscriber.email,
            status: "pending",
          } as any)
          .select("id")
          .single();

        if (sendError || !sendRecord) {
          console.error(
            `❌ Error creating send record for ${subscriber.email}:`,
            sendError
          );
          errors.push({
            subscriberId: subscriber.id,
            email: subscriber.email,
            error: "Failed to create send record",
            status: "failed",
          });
          continue;
        }

        const sendId = sendRecord.id;
        console.log(
          `📝 Created send record: ${sendId} for ${subscriber.email}`
        );

        // Generate tracking-enabled HTML content
        console.log(`🔧 Generating tracked HTML for ${subscriber.email}:`, {
          emailElementsCount: emailElements.length,
          campaignId: realCampaignId,
          subscriberId: subscriber.id,
          sendId,
          elementsPreview: emailElements.slice(0, 2),
        });

        const trackedHtmlContent = generateHtmlFromElements(
          emailElements,
          subject,
          realCampaignId,
          subscriber.id,
          sendId,
          preheader
        );

        console.log(`📧 Generated tracked HTML for ${subscriber.email}:`, {
          length: trackedHtmlContent.length,
          hasTrackingPixel: trackedHtmlContent.includes(
            "/api/email-campaigns/track/open"
          ),
          hasTrackingParams: trackedHtmlContent.includes(`c=${realCampaignId}`),
          lastChars: trackedHtmlContent.slice(-200),
        });

        // Personalize content
        const personalizedHtml = personalizeContent(
          trackedHtmlContent,
          subscriber
        );
        const personalizedText = personalizeContent(textContent, subscriber);
        const personalizedSubject = personalizeContent(subject, subscriber);

        console.log(`\n📧 Processing subscriber: ${subscriber.email}`);
        console.log(`   - Send ID: ${sendId}`);
        console.log(`   - Personalized subject: "${personalizedSubject}"`);
        console.log(
          `   - HTML content length: ${personalizedHtml.length} chars`
        );
        console.log(
          `   - Text content length: ${personalizedText.length} chars`
        );
        console.log(
          `   - Mode: ${DEVELOPMENT_MODE ? "DEVELOPMENT" : "PRODUCTION"}`
        );

        console.log(`📤 Calling sendEmail function...`);
        const result = await sendEmail({
          to: subscriber.email,
          subject: personalizedSubject,
          html: personalizedHtml,
          text: personalizedText,
          from: "Cymasphere Support <support@cymasphere.com>",
        });

        console.log(`📬 sendEmail result:`, JSON.stringify(result, null, 2));

        if (result.success) {
          // Update send record to sent status with message_id
          await supabase
            .from("email_sends")
            .update({
              status: "sent",
              sent_at: new Date().toISOString(),
              message_id: result.messageId,
            })
            .eq("id", sendId);

          results.push({
            subscriberId: subscriber.id,
            email: subscriber.email,
            messageId: result.messageId,
            sendId: sendId,
            status: "sent",
          });
          console.log(`✅ SUCCESS: Email sent to ${subscriber.email}`);
          console.log(`   - Message ID: ${result.messageId}`);
          console.log(`   - Send ID: ${sendId}`);
        } else {
          // Update send record to failed status
          await supabase
            .from("email_sends")
            .update({
              status: "failed",
              error_message: result.error,
            })
            .eq("id", sendId);

          errors.push({
            subscriberId: subscriber.id,
            email: subscriber.email,
            error: result.error,
            sendId: sendId,
            status: "failed",
          });
          console.error(`❌ FAILED: Could not send to ${subscriber.email}`);
          console.error(`   - Error: ${result.error}`);
          console.error(`   - Full result:`, result);
        }

        // Small delay to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        errors.push({
          subscriberId: subscriber.id,
          email: subscriber.email,
          error: errorMessage,
          status: "failed",
        });
        console.error(`❌ Exception sending to ${subscriber.email}:`, error);
      }
    }

    const successCount = results.length;
    const errorCount = errors.length;
    const totalCount = targetSubscribers.length;

    // Update campaign statistics AND store the tracked HTML template
    if (realCampaignId) {
      try {
        // Generate a sample tracked HTML template
        const sampleSubscriber = targetSubscribers[0];
        let trackedHtmlTemplate = null;
        let sampleSendId = null;

        if (sampleSubscriber) {
          // Use existing send ID if available, otherwise generate a placeholder ID for template
          sampleSendId =
            results.find((r) => r.subscriberId === sampleSubscriber.id)
              ?.sendId || "template-placeholder-id";
          trackedHtmlTemplate = generateHtmlFromElements(
            emailElements,
            subject,
            realCampaignId,
            sampleSubscriber.id,
            sampleSendId,
            preheader
          );
        }

        if (trackedHtmlTemplate) {
          // Use authenticated client (admin check already passed, RLS will allow access)
          await supabase
            .from("email_campaigns")
            .update({
              emails_sent: successCount,
              total_recipients: totalCount,
              sent_at: successCount > 0 ? new Date().toISOString() : null,
              status: successCount > 0 ? "sent" : "draft",
              html_content: trackedHtmlTemplate, // Store the tracked HTML template
            })
            .eq("id", realCampaignId);

          console.log(
            `📊 Updated campaign stats: ${successCount} sent, ${totalCount} total`
          );
          console.log(
            `📧 Updated campaign with tracked HTML template (${trackedHtmlTemplate.length} chars)`
          );
        } else {
          // Fallback: update without HTML if we can't generate template
          // Use authenticated client (admin check already passed, RLS will allow access)
          await supabase
            .from("email_campaigns")
            .update({
              emails_sent: successCount,
              total_recipients: totalCount,
              sent_at: successCount > 0 ? new Date().toISOString() : null,
              status: successCount > 0 ? "sent" : "draft",
            })
            .eq("id", realCampaignId);

          console.log(
            `📊 Updated campaign stats: ${successCount} sent, ${totalCount} total (no HTML update)`
          );
        }
      } catch (error) {
        console.error("❌ Error updating campaign stats:", error);
      }
    }

    console.log(`📊 Campaign "${name}" completed:`);
    console.log(`   ✅ Successful: ${successCount}/${totalCount}`);
    console.log(`   ❌ Failed: ${errorCount}/${totalCount}`);
    console.log(
      `   🔒 Mode: ${DEVELOPMENT_MODE ? "DEVELOPMENT" : "PRODUCTION"}`
    );

    return {
      success: true,
      message: `Campaign sent successfully to ${successCount} out of ${totalCount} subscribers`,
      campaignId: realCampaignId,
      stats: {
        total: totalCount,
        sent: successCount,
        failed: errorCount,
        successRate: ((successCount / totalCount) * 100).toFixed(1),
        mode: DEVELOPMENT_MODE ? "DEVELOPMENT" : "PRODUCTION",
        safetyEnabled: DEVELOPMENT_MODE || TEST_MODE,
      },
      results,
      errors: errors.length > 0 ? errors : undefined,
    };
  } catch (error) {
    console.error("❌ Error in send campaign:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error sending campaign";

    return {
      success: false,
      error: errorMessage,
    };
  }
}

