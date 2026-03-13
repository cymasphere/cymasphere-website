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

import { checkAdmin } from "@/app/actions/user-management";
import { sendEmail, SUPPORT_EMAIL, SUPPORT_EMAIL_FROM } from "@/utils/email";
import { createClient } from "@/utils/supabase/server";
import { generateHtmlFromElements, generateTextFromElements, personalizeContent } from "@/utils/email-campaigns/email-generation";
import type { EmailElement, SubscriberRecord } from "@/types/email-campaigns";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSubscribersForAudiences as getSubscribersForAudiencesShared } from "@/utils/email-campaigns/get-subscribers";

/**
 * Safety configuration flags for preventing accidental email sends.
 * Set via env: EMAIL_DEVELOPMENT_MODE=true, EMAIL_TEST_MODE=true
 */
const DEVELOPMENT_MODE = process.env.EMAIL_DEVELOPMENT_MODE === "true";
const TEST_MODE = process.env.EMAIL_TEST_MODE === "true";

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
  emailElements: EmailElement[];
  scheduleType: "immediate" | "scheduled" | "timezone" | "draft";
  scheduleDate?: string;
  scheduleTime?: string;
}

export interface SendCampaignResponse {
  success: boolean;
  status?: string;
  message?: string;
  campaignId?: string;
  scheduleType?: "immediate" | "scheduled" | "timezone" | "draft";
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

// Get real subscribers from database based on audience selection (shared utility + send-specific safety)
async function getSubscribersForAudiences(
  supabase: SupabaseClient,
  audienceIds: string[],
  excludedAudienceIds: string[] = []
): Promise<SubscriberRecord[]> {
  const { data: audiences, error: audienceError } = await supabase
    .from("email_audiences")
    .select("id, name, description")
    .in("id", audienceIds);

  if (audienceError || !audienceIds?.length) {
    if (audienceIds?.length) console.error("❌ Error fetching audience details:", audienceError);
    return [];
  }

  // 🔒 SAFETY: In development, only allow test audiences
  if (DEVELOPMENT_MODE || TEST_MODE) {
    const nonTestAudiences = audiences?.filter(
      (aud) =>
        !TEST_AUDIENCE_NAMES.some((testName) =>
          (aud.name ?? "").toLowerCase().includes(testName.toLowerCase())
        )
    );
    if (nonTestAudiences?.length) {
      throw new Error(
        `SAFETY BLOCK: Cannot send to non-test audiences in development mode. Detected: ${nonTestAudiences.map((a) => a.name).join(", ")}`
      );
    }
  }

  let list = await getSubscribersForAudiencesShared(supabase, audienceIds, excludedAudienceIds);

  // 🔒 SAFETY: In development, only whitelisted emails
  if (DEVELOPMENT_MODE || TEST_MODE) {
    list = list.filter((sub) => SAFE_TEST_EMAILS.includes(sub.email));
  }

  return list;
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
 * @note Requires admin access (checkAdmin at start; RLS enforces on DB access)
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
    const supabase = await createClient();
    if (!(await checkAdmin(supabase))) {
      return { success: false, error: "Unauthorized" };
    }

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

    if (process.env.EMAIL_DEBUG === "true") {
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
              sender_email: SUPPORT_EMAIL,
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
        from: SUPPORT_EMAIL_FROM,
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
          sender_email: SUPPORT_EMAIL,
          html_content: generateHtmlFromElements(
            emailElements,
            subject,
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

    // Generate base HTML and text content (SES handles tracking natively)
    const baseHtmlContent = generateHtmlFromElements(
      emailElements,
      subject,
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

    const emailDebug = process.env.EMAIL_DEBUG === "true";
    console.log(`🚀 Sending campaign to ${targetSubscribers.length} subscribers`);
    if (emailDebug) {
      targetSubscribers.forEach((sub, i) => {
        console.log(`   ${i + 1}. ${sub.email} (ID: ${sub.id}, Status: ${sub.status})`);
      });
    }

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
          })
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
        if (emailDebug) {
          console.log(`📝 Created send record: ${sendId} for subscriber`);
        }

        // Personalize the single base HTML per subscriber (SES handles tracking)
        const personalizedHtml = personalizeContent(
          baseHtmlContent,
          subscriber
        );
        const personalizedText = personalizeContent(textContent, subscriber);
        const personalizedSubject = personalizeContent(subject, subscriber);

        if (emailDebug) {
          console.log(`📧 Processing subscriber (sendId: ${sendId}), subject length: ${personalizedSubject.length}`);
        }
        const result = await sendEmail({
          to: subscriber.email,
          subject: personalizedSubject,
          html: personalizedHtml,
          text: personalizedText,
          from: SUPPORT_EMAIL_FROM,
        });

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
          if (emailDebug) {
            console.log(`✅ Sent (messageId: ${result.messageId}, sendId: ${sendId})`);
          }
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
          console.error(`❌ Send failed: ${result.error}`);
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

    // Update campaign statistics and store the HTML template (same as sent)
    if (realCampaignId) {
      try {
        if (baseHtmlContent) {
          // Use authenticated client (admin check already passed, RLS will allow access)
          await supabase
            .from("email_campaigns")
            .update({
              emails_sent: successCount,
              total_recipients: totalCount,
              sent_at: successCount > 0 ? new Date().toISOString() : null,
              status: successCount > 0 ? "sent" : "draft",
              html_content: baseHtmlContent,
            })
            .eq("id", realCampaignId);

          console.log(
            `📊 Updated campaign stats: ${successCount} sent, ${totalCount} total`
          );
          console.log(
            `📧 Updated campaign with HTML template (${baseHtmlContent.length} chars)`
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

