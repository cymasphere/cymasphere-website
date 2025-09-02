import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/utils/email";
import { createClient } from "@/utils/supabase/server";

// 🔒 SAFETY CONFIGURATION - CRITICAL FOR PREVENTING ACCIDENTAL SENDS
const DEVELOPMENT_MODE = false; // Temporarily disabled for testing
const TEST_MODE = false; // Temporarily disabled for testing

// 🔒 SAFE EMAIL WHITELIST - Only these emails will receive messages in development
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

interface SendCampaignRequest {
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

// Get real subscribers from database based on audience selection
async function getSubscribersForAudiences(
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
    // Use admin client to ensure we can access junction table data
    const { createClient } = require("@supabase/supabase-js");
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
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
          // For dynamic audiences, we'd need to implement filter logic here
          // For now, skip dynamic audiences in development mode for safety
          console.log(
            `⚠️ Dynamic audience skipped in development mode for safety`
          );
          continue;
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
    if (excludedAudienceIds && excludedAudienceIds.length > 0) {
      for (const excludedAudienceId of excludedAudienceIds) {
        try {
          const response = await fetch(
            `${
              process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
            }/api/email-campaigns/audiences/${excludedAudienceId}/subscribers`
          );
          if (response.ok) {
            const data = await response.json();
            const excludedSubscribers = data.subscribers || [];
            excludedSubscribers.forEach((sub: any) => {
              allSubscribers.delete(sub.id);
              subscriberDetails.delete(sub.id);
            });
          }
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

export async function POST(request: NextRequest) {
  try {
    const body: SendCampaignRequest = await request.json();
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
    } = body;

    console.log("📧 Send campaign request:", {
      name,
      subject,
      audienceIds,
      excludedAudienceIds,
      scheduleType,
      emailElementsCount: emailElements?.length || 0,
      emailElementsPreview: emailElements?.slice(0, 2) || "undefined",
      developmentMode: DEVELOPMENT_MODE,
      testMode: TEST_MODE,
    });

    // 🎯 TEST EMAIL MODE: If testEmail is provided, send a single email to that address (process FIRST)
    if (testEmail && typeof testEmail === 'string') {
      const emailTrimmed = testEmail.trim();
      const isValid = /.+@.+\..+/.test(emailTrimmed);
      if (!isValid) {
        return NextResponse.json({ success: false, error: 'Invalid test email address' }, { status: 400 });
      }

      const subjectWithTest = subject.startsWith('[TEST]') ? subject : `[TEST] ${subject}`;
      // Ensure we have a real campaign id for proper view-in-browser links
      let realCampaignIdForTest = campaignId && /^[0-9a-f-]{36}$/i.test(campaignId) ? campaignId : undefined;

      if (!realCampaignIdForTest) {
        try {
          // Create a placeholder campaign to obtain a UUID (status draft)
          const { createClient } = require("@supabase/supabase-js");
          const serviceSupabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
          );

          const { data: newCampaign, error: newCampErr } = await serviceSupabase
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

      const result = await sendEmail({
        to: emailTrimmed,
        subject: subjectWithTest,
        html: baseHtmlContentForTest,
        text: textContentForTest,
        from: "support@cymasphere.com",
      });

      if (result.success) {
        // If we created a placeholder campaign, store the generated HTML for previewing
        if (realCampaignIdForTest) {
          try {
            const { createClient } = require("@supabase/supabase-js");
            const serviceSupabase = createClient(
              process.env.NEXT_PUBLIC_SUPABASE_URL!,
              process.env.SUPABASE_SERVICE_ROLE_KEY!
            );
            await serviceSupabase
              .from("email_campaigns")
              .update({ html_content: baseHtmlContentForTest })
              .eq("id", realCampaignIdForTest);
          } catch (e) {
            console.warn("⚠️ Failed to update test campaign HTML:", e);
          }
        }
        return NextResponse.json({
          success: true,
          status: 'test-sent',
          message: `Test email sent to ${emailTrimmed}`,
          results: [{ email: emailTrimmed, status: 'sent', messageId: result.messageId }],
          campaignId: realCampaignIdForTest
        });
      }

      return NextResponse.json({ success: false, error: result.error || 'Failed to send test email' }, { status: 500 });
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
      return NextResponse.json(
        {
          success: false,
          error:
            "Missing required campaign fields (name, subject, audiences, content)",
        },
        { status: 400 }
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
      return NextResponse.json({
        success: true,
        message: "Campaign saved as draft",
        campaignId: campaignId || `campaign_${Date.now()}`,
        status: "draft",
      });
    }

    // If scheduled for later, save schedule and return
    if (scheduleType === "scheduled" && scheduleDate && scheduleTime) {
      // If we have a campaignId, get the scheduled_at time from the already-saved campaign
      let scheduledDateTime;

      if (campaignId) {
        try {
          // Get the campaign's scheduled_at value (which includes proper timezone)
          const supabase = await createClient();
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
        return NextResponse.json(
          {
            success: false,
            error: "Scheduled time must be at least 1 minute in the future",
          },
          { status: 400 }
        );
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

      return NextResponse.json({
        success: true,
        message: `Campaign scheduled for ${scheduledDateTime.toLocaleString()}`,
        campaignId: campaignId || `campaign_${Date.now()}`,
        status: "scheduled",
        scheduledFor: scheduledDateTime.toISOString(),
        stats: {
          audienceCount: audienceIds.length,
          excludedAudienceCount: excludedAudienceIds?.length || 0,
          scheduleType: "scheduled",
          scheduledDateTime: scheduledDateTime.toLocaleString(),
        },
      });
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

      return NextResponse.json({
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
      });
    }

    // Get real subscribers from database
    console.log("🔍 Fetching subscribers from database...");
    const targetSubscribers = await getSubscribersForAudiences(
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

      return NextResponse.json(
        { success: false, error: errorMessage },
        { status: 400 }
      );
    }

    // Create a real campaign record for immediate sends (if not already provided)
    let realCampaignId = campaignId;

    // For immediate sends, create a campaign record to get a proper UUID
    if (
      scheduleType === "immediate" &&
      (!campaignId || !campaignId.match(/^[0-9a-f-]{36}$/i))
    ) {
      console.log("📝 Creating campaign record for immediate send...");

      // Use service role client for campaign creation to bypass RLS
      const { createClient } = require("@supabase/supabase-js");
      const serviceSupabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      const { data: newCampaign, error: campaignError } = await serviceSupabase
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
        return NextResponse.json(
          { success: false, error: "Failed to create campaign record" },
          { status: 500 }
        );
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
    const results = [];
    const errors = [];
    const supabase = await createClient();

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
        // Use service role client for send record creation to bypass RLS
        const { createClient } = require("@supabase/supabase-js");
        const serviceSupabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const { data: sendRecord, error: sendError } = await serviceSupabase
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
          from: "support@cymasphere.com",
        });

        console.log(`📬 sendEmail result:`, JSON.stringify(result, null, 2));

        if (result.success) {
          // Update send record to sent status with message_id
          await serviceSupabase
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
          await serviceSupabase
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
          // Use service role client for campaign stats update
          const { createClient } = require("@supabase/supabase-js");
          const serviceSupabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
          );

          await serviceSupabase
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
          // Use service role client for campaign stats update
          const { createClient } = require("@supabase/supabase-js");
          const serviceSupabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
          );

          await serviceSupabase
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

    return NextResponse.json({
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
    });
  } catch (error) {
    console.error("❌ Error in send campaign API:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error sending campaign";

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

// Helper function to generate HTML from email elements with tracking
function generateHtmlFromElements(
  elements: any[],
  subject: string,
  campaignId?: string,
  subscriberId?: string,
  sendId?: string,
  preheader?: string
): string {
  // Helper function to rewrite links for click tracking
  const rewriteLinksForTracking = (html: string): string => {
    if (!campaignId || !subscriberId || !sendId) {
      return html; // No tracking if missing parameters
    }

    // Find and replace all href attributes
    return html.replace(/href=["']([^"']+)["']/g, (match, url) => {
      // Skip already tracked URLs
      if (url.includes("/api/email-campaigns/track/click")) {
        return match;
      }

      // Skip internal tracking URLs
      if (url.includes("unsubscribe") || url.includes("mailto:")) {
        return match;
      }

      // Always use production URL for tracking (even in development)
      // because localhost URLs won't work in external email clients
      const baseUrl =
        process.env.NODE_ENV === "production"
          ? process.env.NEXT_PUBLIC_SITE_URL || "https://cymasphere.com"
          : "https://cymasphere.com";
      const trackingUrl = `${baseUrl}/api/email-campaigns/track/click?c=${campaignId}&u=${subscriberId}&s=${sendId}&url=${encodeURIComponent(
        url
      )}`;
      return `href="${trackingUrl}"`;
    });
  };

  // Resolve base URL for view-in-browser and other absolute links
  // In production, force cymasphere.com if env mistakenly points to localhost
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "";
  const resolvedBaseUrl = process.env.NODE_ENV === "production"
    ? (siteUrl && !siteUrl.includes("localhost") ? siteUrl : "https://cymasphere.com")
    : (siteUrl || "http://localhost:3000");

  const elementHtml = elements
    .map((element) => {
      // Debug logging to see element properties
      console.log('🎨 Generating HTML for element:', {
        id: element.id,
        type: element.type,
        fontFamily: element.fontFamily,
        fontSize: element.fontSize,
        textColor: element.textColor,
        backgroundColor: element.backgroundColor
      });
      
      const wrapperClass = element.fullWidth
        ? "full-width"
        : "constrained-width";

      switch (element.type) {
        case "header":
          return `<div class="${wrapperClass}" style="padding: ${element.fullWidth ? '0' : '0 30px'}; padding-top: ${element.paddingTop || 0}px; padding-bottom: ${element.paddingBottom || 0}px;"><h1 style="font-size: ${element.fontSize || '2.5rem'}; color: ${element.textColor || '#333'}; margin-bottom: 1rem; text-align: ${element.textAlign || 'center'}; font-weight: ${element.fontWeight || '800'}; font-family: ${element.fontFamily || 'Arial, sans-serif'}; line-height: ${element.lineHeight || '1.2'}; margin: 0 0 1rem 0;">${element.content}</h1></div>`;

        case "text":
          return `<div class="${wrapperClass}" style="padding: ${element.fullWidth ? '0' : '0 30px'}; padding-top: ${element.paddingTop || 0}px; padding-bottom: ${element.paddingBottom || 0}px;"><p style="font-size: ${element.fontSize || '1rem'}; color: ${element.textColor || '#555'}; line-height: ${element.lineHeight || '1.6'}; margin: 0 0 1rem 0; text-align: ${element.textAlign || 'left'}; font-weight: ${element.fontWeight || 'normal'}; font-family: ${element.fontFamily || 'Arial, sans-serif'};">${element.content}</p></div>`;

        case "button":
          return `<div class="${wrapperClass}" style="text-align: ${element.fullWidth ? 'left' : (element.textAlign || 'center')}; margin: 2rem 0; padding: ${element.fullWidth ? '0' : '0 30px'}; padding-top: ${element.paddingTop || 0}px; padding-bottom: ${element.paddingBottom || 0}px;"><a href="${
            element.url || "#"
          }" style="display: ${element.fullWidth ? 'block' : 'inline-block'}; padding: ${element.fullWidth ? '1.25rem 2.5rem' : '1.25rem 2.5rem'}; background: ${element.gradient || element.backgroundColor || 'linear-gradient(135deg, #6c63ff 0%, #4ecdc4 100%)'}; color: ${element.textColor || 'white'}; text-decoration: none; border-radius: ${element.fullWidth ? '0' : '50px'}; font-weight: ${element.fontWeight || '700'}; font-size: ${element.fontSize || '1rem'}; font-family: ${element.fontFamily || 'Arial, sans-serif'}; line-height: ${element.lineHeight || '1.2'}; transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1); text-transform: uppercase; letter-spacing: 1px; box-shadow: ${element.fullWidth ? 'none' : '0 8px 25px rgba(108, 99, 255, 0.3)'}; min-height: 1em; width: ${element.fullWidth ? '100%' : 'auto'}; text-align: ${element.textAlign || 'center'};">${
            element.content
          }</a></div>`;

        case "image":
          return `<div class="${wrapperClass}" style="text-align: ${element.textAlign || 'center'}; margin: 1.5rem 0; padding: ${element.fullWidth ? '0' : '0 30px'}; padding-top: ${element.paddingTop || 0}px; padding-bottom: ${element.paddingBottom || 0}px;"><img src="${
            element.src
          }" alt="Campaign Image" style="max-width: 100%; height: auto; border-radius: ${
            element.fullWidth ? "0" : "8px"
          };" /></div>`;

        case "divider":
          return `<div class="${wrapperClass}" style="text-align: ${element.textAlign || 'center'}; padding: ${element.fullWidth ? '0' : '0 30px'}; padding-top: ${element.paddingTop || 0}px; padding-bottom: ${element.paddingBottom || 0}px;"><hr style="border: none; height: 2px; background: linear-gradient(90deg, #6c63ff, #4ecdc4); margin: 2rem 0;" /></div>`;

        case "spacer":
          return `<div class="${wrapperClass}" style="height: ${
            element.height || "20px"
          }; padding: ${element.fullWidth ? '0' : '0 30px'}; padding-top: ${element.paddingTop || 0}px; padding-bottom: ${element.paddingBottom || 0}px;"></div>`;

        case "footer":
          // Generate social links using inline, non-image badges to reduce image-block prompts
          const socialLinksHtml = element.socialLinks && element.socialLinks.length > 0
            ? element.socialLinks
                .map((social: any) => {
                  const badges: Record<string, string> = {
                    facebook: `<span style="display:inline-flex;align-items:center;justify-content:center;width:20px;height:20px;border-radius:50%;background:#1877F2;color:#fff;font-size:12px;line-height:20px;font-weight:700;vertical-align:middle;margin-right:6px;">f</span>`,
                    twitter: `<span style="display:inline-flex;align-items:center;justify-content:center;width:20px;height:20px;border-radius:50%;background:#000;color:#fff;font-size:12px;line-height:20px;font-weight:700;vertical-align:middle;margin-right:6px;">X</span>`,
                    instagram: `<span style="display:inline-flex;align-items:center;justify-content:center;width:20px;height:20px;border-radius:4px;background:#E1306C;color:#fff;font-size:10px;line-height:20px;font-weight:700;vertical-align:middle;margin-right:6px;">IG</span>`,
                    youtube: `<span style="display:inline-flex;align-items:center;justify-content:center;width:22px;height:16px;border-radius:3px;background:#FF0000;color:#fff;font-size:10px;line-height:16px;font-weight:700;vertical-align:middle;margin-right:6px;">▶</span>`,
                    discord: `<span style="display:inline-flex;align-items:center;justify-content:center;width:22px;height:16px;border-radius:3px;background:#5865F2;color:#fff;font-size:10px;line-height:16px;font-weight:700;vertical-align:middle;margin-right:6px;">DC</span>`
                  };
                  const badge = badges[(social.platform || '').toLowerCase()] || `<span style="display:inline-flex;align-items:center;justify-content:center;width:20px;height:20px;border-radius:50%;background:#6c63ff;color:#fff;font-size:12px;line-height:20px;font-weight:700;vertical-align:middle;margin-right:6px;">🔗</span>`;
                  return `<a href="${social.url}" style="text-decoration:none; margin:0 0.5rem; padding:0.5rem; display:inline-flex; align-items:center; color:#ffffff;">${badge}</a>`;
                })
                .join("")
            : "";

          return `
          <div style="text-align: center; font-size: ${element.fontSize || '0.8rem'}; color: ${element.textColor || '#ffffff'}; background: ${element.backgroundColor || 'linear-gradient(135deg, #6c757d 0%, #495057 100%)'}; font-weight: ${element.fontWeight || 'normal'}; font-family: ${element.fontFamily || 'Arial, sans-serif'}; line-height: ${element.lineHeight || '1.4'}; border-top: 1px solid #dee2e6; margin-top: 2rem; padding: ${element.paddingTop || 32}px 30px ${element.paddingBottom || 32}px 30px;">
            ${socialLinksHtml ? `<div style="margin-bottom: 0.5rem; text-align: center;">${socialLinksHtml}</div>` : ""}
            <div style="margin-bottom: 0.5rem; text-align: center;">${element.footerText || `© ${new Date().getFullYear()} Cymasphere Inc. All rights reserved.`}</div>
            <div style="text-align: center;">
              <a href="${element.unsubscribeUrl || `${process.env.NEXT_PUBLIC_SITE_URL || 'https://cymasphere.com'}/unsubscribe?email={{email}}`}" style="color: #ffffff; text-decoration: none;">${element.unsubscribeText || "Unsubscribe"}</a>
              | 
              <a href="${element.privacyUrl || "https://cymasphere.com/privacy-policy"}" style="color: #ffffff; text-decoration: none;">${element.privacyText || "Privacy Policy"}</a>
              | 
              <a href="${element.termsUrl || "https://cymasphere.com/terms-of-service"}" style="color: #ffffff; text-decoration: none;">${element.termsText || "Terms of Service"}</a>
            </div>
          </div>`;

        case "brand-header":
          // Use Supabase storage URL for the logo (accessible from anywhere)
          const logoUrl = "https://jibirpbauzqhdiwjlrmf.supabase.co/storage/v1/object/public/email-assets/cm-logo.png";
          // Force brand header to align with content width
          const headerWrapperClass = "constrained-width";

          return `<div class="${headerWrapperClass} brand-header" style="background: ${
            element.backgroundColor ||
            "linear-gradient(135deg, #1a1a1a 0%, #121212 100%)"
          }; padding: 0 30px; padding-top: ${element.paddingTop || 0}px; padding-bottom: ${element.paddingBottom || 0}px; text-align: center; display: flex; align-items: center; justify-content: center; min-height: 80px; border-radius: 0; box-shadow: none; margin: 0;">
            <img src="${logoUrl}" alt="Cymasphere Logo" style="max-width: 300px; width: 100%; height: auto; object-fit: contain; display: block; margin: 0 auto; padding: 0;" />
          </div>`;

        default:
          return `<div class="${wrapperClass}" style="color: #555; margin: 1rem 0; text-align: ${element.textAlign || 'left'}; font-size: ${element.fontSize || '16px'}; font-weight: ${element.fontWeight || 'normal'}; font-family: ${element.fontFamily || 'Arial, sans-serif'}; line-height: ${element.lineHeight || '1.6'}; padding: ${element.fullWidth ? '0' : '0 30px'}; padding-top: ${element.paddingTop || 0}px; padding-bottom: ${element.paddingBottom || 0}px;">${
            element.content || ""
          }</div>`;
      }
    })
    .join("");

  // Base HTML template with Gmail-compatible structure
  let html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${subject}</title>
    
    <!-- Google Fonts for custom typography -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Open+Sans:wght@300;400;500;600;700;800&family=Roboto:wght@100;300;400;500;700;900&family=Lato:wght@100;300;400;700;900&family=Poppins:wght@100;200;300;400;500;600;700;800;900&family=Source+Sans+Pro:wght@200;300;400;600;700;900&family=Nunito:wght@200;300;400;500;600;700;800;900&family=Work+Sans:wght@100;200;300;400;500;600;700;800;900&family=Montserrat:wght@100;200;300;400;500;600;700;800;900&family=Merriweather:wght@300;400;700;900&family=Playfair+Display:wght@400;500;600;700;800;900&family=Oswald:wght@200;300;400;500;600;700&family=PT+Sans:wght@400;700&family=Ubuntu:wght@300;400;500;700&family=Noto+Sans:wght@100;200;300;400;500;600;700;800;900&family=Source+Code+Pro:wght@200;300;400;500;600;700;800;900&display=swap" rel="stylesheet">

    <style>
        /* Body styles moved to inline for email client compatibility */
        
        /* Ensure emojis render in color */
        * {
            -webkit-text-fill-color: initial;
            color: inherit;
        }
        
        /* Force emoji color rendering - multiple approaches */
        emoji, span[role="img"], .emoji {
            -webkit-text-fill-color: initial !important;
            color: initial !important;
        }
        
        /* Remove any filters that might be making emojis grey */
        * {
            filter: none !important;
        }
        
        /* Ensure text rendering is optimal for emojis */
        body {
            text-rendering: optimizeLegibility;
            -webkit-font-feature-settings: "liga" 1, "kern" 1;
            font-feature-settings: "liga" 1, "kern" 1;
        }
        
        /* Force emoji color rendering with higher specificity */
        p, div, span, h1, h2, h3, h4, h5, h6 {
            -webkit-text-fill-color: initial;
            color: inherit;
        }
        
        /* Brand header specific styling - ensure it's not affected by resets */
        .brand-header {
            color: inherit !important;
            -webkit-text-fill-color: inherit !important;
        }
        
        .brand-header span {
            color: inherit !important;
            -webkit-text-fill-color: inherit !important;
        }
        
        /* Ensure emojis are not affected by any color overrides */
        ::-webkit-text-fill-color {
            -webkit-text-fill-color: initial !important;
        }
        
        /* Reset any inherited CSS variables that might affect colors */
        :root {
            --text: initial !important;
            --text-secondary: initial !important;
            --primary: initial !important;
            --accent: initial !important;
        }
        
        /* Force emoji rendering with system emoji font */
        @font-face {
            font-family: 'Apple Color Emoji';
            src: local('Apple Color Emoji');
        }
        
        @font-face {
            font-family: 'Segoe UI Emoji';
            src: local('Segoe UI Emoji');
        }
        
        /* Apply emoji fonts to all text except brand header */
        *:not(.brand-header):not(.brand-header *) {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Apple Color Emoji', 'Segoe UI Emoji', sans-serif !important;
        }
        
        /* Brand header specific styles - override the reset */
        .brand-header {
            font-family: 'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif !important;
        }
        
        .brand-header .cyma-text {
            background: linear-gradient(90deg, #6c63ff, #4ecdc4) !important;
            -webkit-background-clip: text !important;
            -webkit-text-fill-color: transparent !important;
            background-clip: text !important;
            color: transparent !important;
        }
        
        .brand-header .sphere-text {
            color: #ffffff !important;
            -webkit-text-fill-color: #ffffff !important;
        }
        
        /* Container styles moved to inline for email client compatibility */
        
        .footer {
            padding: 20px;
            text-align: center;
            font-size: 12px;
            background-color: #f8f9fa;
            color: #666666;
            border-top: 1px solid #e9ecef;
        }
        
        .footer a {
            color: #6c63ff;
            text-decoration: none;
        }
        
        .full-width {
            width: 100%;
            margin: 0;
            padding: 0;
            border-radius: 0;
        }
        
        /* Override parent padding for full-width elements */
        .full-width {
            margin-left: -30px;
            margin-right: -30px;
            padding-left: 30px;
            padding-right: 30px;
            width: calc(100% + 60px);
        }
        
        /* Footer specific styling to span full width of white container */
        .footer-full-width {
            width: 100%;
            margin: 0;
            padding: 2rem;
            box-sizing: border-box;
        }
        
        .constrained-width {
            max-width: 600px;
            margin-left: auto;
            margin-right: auto;
            padding: 0 20px;
            box-sizing: border-box;
        }
    </style>
</head>
<body style="margin: 0; padding: 20px; background-color: #f7f7f7; font-family: Arial, sans-serif; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;">
    <div style="background-color: #ffffff; max-width: 600px; margin: 0 auto; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);">
        <!-- Preheader Section -->
        <div style="padding: 15px 20px; background-color: #f8f9fa; border-bottom: 1px solid #e9ecef;">
            <div style="display: flex; justify-content: space-between; align-items: center; font-size: 12px; color: #666;">
                <div style="color: #333; font-weight: 500;">
                    ${preheader || 'Cymasphere - Your Music Production Journey'}
                </div>
                <div style="text-align: right; margin-left: auto;">
                    <a href="${resolvedBaseUrl}/email-preview?c=${campaignId || 'preview'}" style="color: #6c63ff; text-decoration: underline; font-weight: 500;">View in browser</a>
                </div>
            </div>
        </div>
        
        ${elementHtml}
    </div>
</body>
</html>`;

  // Add tracking pixel if we have tracking parameters
  if (campaignId && subscriberId && sendId) {
    // Always use production URL for tracking pixels (even in development)
    // because localhost URLs won't work in external email clients
    const baseUrl =
      process.env.NODE_ENV === "production"
        ? process.env.NEXT_PUBLIC_SITE_URL || "https://cymasphere.com"
        : "https://cymasphere.com";
    const trackingPixel = `
    <!-- Email Open Tracking -->
    <img src="${baseUrl}/api/email-campaigns/track/open?c=${campaignId}&u=${subscriberId}&s=${sendId}" width="1" height="1" style="display:block;border:0;margin:0;padding:0;" alt="" />`;

    html += trackingPixel;
  }

  html += `
</body>
</html>`;

  // Rewrite links for click tracking
  html = rewriteLinksForTracking(html);

  return html;
}

// Helper function to generate text content from email elements
function generateTextFromElements(elements: any[]): string {
  const textContent = elements
    .map((element) => {
      switch (element.type) {
        case "header":
          return `${element.content}\n${"=".repeat(element.content.length)}\n`;
        case "text":
          return `${element.content}\n`;
        case "button":
          return `${element.content}: ${element.url || "#"}\n`;
        case "image":
          return `[Image: ${element.src}]\n`;
        case "divider":
          return `${"─".repeat(50)}\n`;
        case "spacer":
          return "\n";
        case "footer":
          const socialText = element.socialLinks && element.socialLinks.length > 0
            ? element.socialLinks
                .map((social: any) => `${social.platform}: ${social.url}`)
                .join(" | ")
            : "";
          return `\n${"─".repeat(50)}\n${socialText ? socialText + "\n" : ""}${
            element.footerText || `© ${new Date().getFullYear()} Cymasphere Inc. All rights reserved.`
          }\n${element.unsubscribeText || "Unsubscribe"}: ${
            element.unsubscribeUrl || "#unsubscribe"
          } | ${element.privacyText || "Privacy Policy"}: ${
            element.privacyUrl || "#privacy"
          } | ${element.termsText || "Terms of Service"}: ${
            element.termsUrl || "https://cymasphere.com/terms-of-service"
          }\n`;
        case "brand-header":
          return `[LOGO] Cymasphere\n${"=".repeat(10)}\n`;
        default:
          return `${element.content || ""}\n`;
      }
    })
    .join("\n");

  return textContent.trim();
}

// Helper function to personalize content with subscriber data
function personalizeContent(content: string, subscriber: any): string {
  const metadata = subscriber.metadata || {};
  const firstName =
    metadata.first_name ||
    subscriber.first_name ||
    subscriber.name?.split(" ")[0] ||
    "there";
  const lastName =
    metadata.last_name ||
    subscriber.last_name ||
    subscriber.name?.split(" ").slice(1).join(" ") ||
    "";
  const fullName =
    [firstName, lastName].filter(Boolean).join(" ") ||
    subscriber.name ||
    "there";

  return content
    .replace(/\{\{firstName\}\}/g, firstName)
    .replace(/\{\{lastName\}\}/g, lastName)
    .replace(/\{\{fullName\}\}/g, fullName)
    .replace(/\{\{email\}\}/g, subscriber.email)
    .replace(/\{\{subscription\}\}/g, metadata.subscription || "none")
    .replace(
      /\{\{lifetimePurchase\}\}/g,
      metadata.lifetime_purchase || metadata.lifetimePurchase || "false"
    )
    .replace(
      /\{\{companyName\}\}/g,
      metadata.company_name || metadata.companyName || ""
    )
    .replace(
      /\{\{unsubscribeUrl\}\}/g,
      `${
        process.env.NEXT_PUBLIC_SITE_URL || "https://cymasphere.com"
      }/unsubscribe?email=${encodeURIComponent(subscriber.email)}`
    )
    .replace(
      /\{\{currentDate\}\}/g,
      new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    );
}
