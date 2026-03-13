/**
 * @fileoverview Scheduled email campaign processor API endpoint
 * 
 * This endpoint processes scheduled email campaigns. Called by cron jobs
 * (Vercel Cron or AWS EventBridge) to send campaigns that are due. Handles
 * audience targeting, content personalization, email tracking injection,
 * and supports both sequential and parallel batch sending modes. Updates
 * campaign status and statistics after sending.
 * 
 * @module api/email-campaigns/process-scheduled
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendEmail, sendBatchEmail, SUPPORT_EMAIL } from "@/utils/email";
import { personalizeContent } from "@/utils/email-campaigns/email-generation";
import { getSubscribersForAudiences } from "@/utils/email-campaigns/get-subscribers";

/**
 * Feature flag: Enable parallel batch sending (sends multiple personalized emails concurrently)
 * Set ENABLE_BATCH_EMAIL_SENDING=true to enable (much faster for large campaigns)
 * Uses parallel sending: sends multiple personalized emails at once instead of one-by-one
 */
const ENABLE_BATCH_SENDING = process.env.ENABLE_BATCH_EMAIL_SENDING === 'true';
/** Number of emails to send concurrently in parallel batch mode */
const PARALLEL_BATCH_SIZE = parseInt(process.env.EMAIL_PARALLEL_BATCH_SIZE || '50');
/** Delay between batches in milliseconds to avoid rate limits */
const DELAY_BETWEEN_BATCHES_MS = parseInt(process.env.EMAIL_BATCH_DELAY_MS || '200');

/**
 * @brief Checks if email content contains personalization variables
 * 
 * Detects if content includes variables like {{firstName}}, {{email}}, etc.
 * that need to be personalized per subscriber.
 * 
 * @param content Email content (HTML, text, or subject) to check
 * @returns True if personalization variables are present, false otherwise
 */
function hasPersonalizationVariables(content: string): boolean {
  const personalizationPatterns = [
    /\{\{firstName\}\}/,
    /\{\{lastName\}\}/,
    /\{\{fullName\}\}/,
    /\{\{email\}\}/,
    /\{\{subscription\}\}/,
    /\{\{lifetimePurchase\}\}/,
    /\{\{companyName\}\}/,
    /\{\{unsubscribeUrl\}\}/,
    /\{\{currentDate\}\}/,
  ];
  
  return personalizationPatterns.some(pattern => pattern.test(content));
}

// Store the last execution time in memory
let lastCronExecution: string | null = null;

/**
 * @brief POST endpoint to process scheduled email campaigns
 * 
 * Finds and processes all campaigns scheduled for the current time or earlier.
 * Handles audience targeting (static and dynamic), content personalization,
 * email tracking, and sending via AWS SES. Supports both sequential and
 * parallel batch sending modes. Updates campaign status and statistics.
 * 
 * Request headers:
 * - authorization: Bearer token with CRON_SECRET (for manual/API calls)
 * - x-vercel-cron-signature: Vercel cron signature (for Vercel cron jobs)
 * 
 * Responses:
 * 
 * 200 OK - Success:
 * ```json
 * {
 *   "message": "Successfully processed 2 scheduled campaigns",
 *   "processed": 2,
 *   "results": [
 *     {
 *       "campaignId": "uuid",
 *       "name": "Campaign Name",
 *       "status": "sent",
 *       "totalRecipients": 100,
 *       "sent": 98,
 *       "failed": 2,
 *       "successRate": 98
 *     }
 *   ]
 * }
 * ```
 * 
 * 200 OK - No campaigns to process:
 * ```json
 * {
 *   "message": "No scheduled campaigns to process",
 *   "processed": 0,
 *   "recentlyProcessed": [...]
 * }
 * ```
 * 
 * 401 Unauthorized:
 * ```json
 * {
 *   "error": "Unauthorized"
 * }
 * ```
 * 
 * @param request Next.js request object with authorization headers
 * @returns NextResponse with processing results
 * @note Requires authorization (Vercel cron signature or CRON_SECRET)
 * @note Uses service role client to bypass RLS
 * @note Supports both static and dynamic audiences
 * @note Personalizes content if variables are present
 * @note Parallel batch mode sends multiple emails concurrently (faster)
 * @note Sequential mode sends one email at a time (safer for rate limits)
 * 
 * @example
 * ```typescript
 * // POST /api/email-campaigns/process-scheduled
 * // Headers: { "authorization": "Bearer cron-secret" }
 * // Returns: { message: "...", processed: 2, results: [...] }
 * ```
 */
export async function POST(request: NextRequest) {
  const executionTime = new Date().toISOString();
  console.log(`🔄 Processing scheduled campaigns at ${executionTime}...`);

  // Store the execution time
  lastCronExecution = executionTime;

  try {
    // Verify the request is authorized (Vercel cron, AWS cron, or manual with secret)
    const authHeader = request.headers.get("authorization");
    const vercelSecret = request.headers.get("x-vercel-cron-signature");
    const cronSecret = process.env.CRON_SECRET;

    // CRON_SECRET must be set for API key auth (no fallback)
    const isVercelCron = !!vercelSecret;
    const isApiKeyCron = !!cronSecret && authHeader === `Bearer ${cronSecret}`;
    const isAuthorized = isVercelCron || isApiKeyCron;

    if (!isAuthorized) {
      if (!cronSecret && !vercelSecret) {
        console.error("❌ CRON_SECRET is not set - cannot authorize API key cron requests");
        return NextResponse.json(
          { error: "Server configuration error: CRON_SECRET not set" },
          { status: 500 }
        );
      }
      console.log(
        "❌ Unauthorized cron job request - missing vercel cron signature or valid API key"
      );
      console.log("❌ Received Authorization header:", authHeader ? "present" : "none");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log(
      "✅ Authorized request:",
      isVercelCron ? "Vercel Cron" : "API Key Cron"
    );

    // Use admin client for cron jobs (bypasses RLS and doesn't need user authentication)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("❌ Missing Supabase configuration");
      return NextResponse.json(
        {
          error: "Server configuration error - missing Supabase credentials",
        },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    console.log("🔧 Using Supabase admin client for cron job");

    // Find campaigns that are scheduled and due to be sent
    const now = new Date().toISOString();
    console.log(`🔍 Looking for campaigns scheduled before: ${now}`);
    const { data: scheduledCampaigns, error: fetchError } = await supabase
      .from("email_campaigns")
      .select(
        `
        *,
        email_campaign_audiences(
          audience_id,
          is_excluded
        )
      `
      )
      .eq("status", "scheduled")
      .lte("scheduled_at", now)
      .order("scheduled_at", { ascending: true });

    if (fetchError) {
      console.error("❌ Error fetching scheduled campaigns:", fetchError);
      return NextResponse.json(
        {
          error: "Failed to fetch scheduled campaigns",
          details: fetchError.message,
        },
        { status: 500 }
      );
    }

    if (!scheduledCampaigns || scheduledCampaigns.length === 0) {
      console.log("✅ No scheduled campaigns due for sending");

      // Show recently processed campaigns for debugging
      const { data: recentCampaigns } = await supabase
        .from("email_campaigns")
        .select(
          "id, name, status, sent_at, total_recipients, emails_sent, updated_at"
        )
        .in("status", ["sent", "failed", "sending"])
        .order("updated_at", { ascending: false })
        .limit(5);

      return NextResponse.json({
        message: "No scheduled campaigns to process",
        processed: 0,
        recentlyProcessed:
          recentCampaigns?.map((c) => ({
            id: c.id,
            name: c.name,
            status: c.status,
            sent_at: c.sent_at,
            total_recipients: c.total_recipients,
            emails_sent: c.emails_sent,
            last_updated: c.updated_at,
          })) || [],
      });
    }

    console.log(
      `📧 Found ${scheduledCampaigns.length} scheduled campaigns to process`
    );

    const results = [];

    // Process each scheduled campaign
    for (const campaign of scheduledCampaigns) {
      console.log(`🚀 Processing campaign: ${campaign.name} (${campaign.id})`);

      try {
        // Update status to 'sending' to prevent duplicate processing
        const { error: updateError } = await supabase
          .from("email_campaigns")
          .update({
            status: "sending",
            updated_at: new Date().toISOString(),
          })
          .eq("id", campaign.id);

        if (updateError) {
          console.error(
            `❌ Failed to update campaign ${campaign.id} status:`,
            updateError
          );
          results.push({
            campaignId: campaign.id,
            name: campaign.name,
            status: "failed",
            error: "Failed to update status",
          });
          continue;
        }

        // Extract audience data
        const audienceIds =
          campaign.email_campaign_audiences
            ?.filter((rel: any) => !rel.is_excluded)
            .map((rel: any) => rel.audience_id) || [];

        const excludedAudienceIds =
          campaign.email_campaign_audiences
            ?.filter((rel: any) => rel.is_excluded)
            .map((rel: any) => rel.audience_id) || [];

        console.log(
          `📊 Campaign audiences - Included: ${audienceIds.length}, Excluded: ${excludedAudienceIds.length}`
        );

        if (audienceIds.length === 0) {
          console.log(
            `⚠️ Campaign ${campaign.name} has no target audiences, skipping`
          );

          // Update to failed status
          await supabase
            .from("email_campaigns")
            .update({
              status: "failed",
              updated_at: new Date().toISOString(),
            })
            .eq("id", campaign.id);

          results.push({
            campaignId: campaign.id,
            name: campaign.name,
            status: "failed",
            error: "No target audiences",
          });
          continue;
        }

        // Get subscribers for the audiences (shared utility)
        const subscribersResult = await getSubscribersForAudiences(
          supabase,
          audienceIds,
          excludedAudienceIds
        );

        if (subscribersResult.length === 0) {
          console.log(
            `⚠️ Campaign ${campaign.name} has no target subscribers, skipping`
          );

          // Update to completed status (no one to send to)
          await supabase
            .from("email_campaigns")
            .update({
              status: "sent",
              sent_at: new Date().toISOString(),
              total_recipients: 0,
              emails_sent: 0,
              updated_at: new Date().toISOString(),
            })
            .eq("id", campaign.id);

          results.push({
            campaignId: campaign.id,
            name: campaign.name,
            status: "sent",
            totalRecipients: 0,
            sent: 0,
            failed: 0,
          });
          continue;
        }

        console.log(`📬 Sending to ${subscribersResult.length} subscribers`);

        // Send emails - Use parallel batch sending if enabled (sends multiple personalized emails concurrently)
        let sentCount = 0;
        let failedCount = 0;
        const sendResults = [];

        // Check if email content has personalization variables
        const htmlContent = campaign.html_content || '';
        const subjectContent = campaign.subject || '';
        const textContent = campaign.text_content || '';
        const hasPersonalization = hasPersonalizationVariables(htmlContent) || 
                                   hasPersonalizationVariables(subjectContent) || 
                                   hasPersonalizationVariables(textContent);

        if (ENABLE_BATCH_SENDING) {
          // PARALLEL BATCH SENDING: Send multiple personalized emails concurrently
          console.log(`🚀 Using PARALLEL batch sending mode (${PARALLEL_BATCH_SIZE} emails sent concurrently)`);
          console.log(`   Personalization: ${hasPersonalization ? 'ENABLED (each email personalized)' : 'DISABLED (same content for all)'}`);
          
          // Split subscribers into parallel batches
          const batches: (typeof subscribersResult)[] = [];
          for (let i = 0; i < subscribersResult.length; i += PARALLEL_BATCH_SIZE) {
            batches.push(subscribersResult.slice(i, i + PARALLEL_BATCH_SIZE));
          }

          console.log(`📦 Split ${subscribersResult.length} subscribers into ${batches.length} parallel batches`);

          // Process each batch (sending all emails in batch concurrently)
          for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
            const batch = batches[batchIndex];
            console.log(`📤 Processing parallel batch ${batchIndex + 1}/${batches.length} (${batch.length} emails to send concurrently)...`);

            // Send all emails in this batch in parallel
            const batchPromises = batch.map(async (subscriber) => {
              try {
                // Create email_sends record for SES webhook correlation (messageId lookup)
                const { data: sendRecord, error: sendError } = await supabase
                  .from("email_sends")
                  .insert({
                    campaign_id: campaign.id,
                    subscriber_id: subscriber.id,
                    email: subscriber.email,
                    status: "pending",
                  })
                  .select("id")
                  .single();

                const sendId = sendError || !sendRecord ? null : sendRecord.id;

                // Use stored html_content (SES handles tracking natively)
                const baseHtml = campaign.html_content ||
                  `<h1>${campaign.subject || "Newsletter"}</h1><p>Content coming soon...</p>`;

                // Personalize content if variables are present
                let personalizedHtml = baseHtml;
                let personalizedText = campaign.text_content || campaign.subject || "Newsletter";
                let personalizedSubject = campaign.subject || "Newsletter";
                
                if (hasPersonalization) {
                  personalizedHtml = personalizeContent(baseHtml, subscriber);
                  personalizedText = personalizeContent(personalizedText, subscriber);
                  personalizedSubject = personalizeContent(personalizedSubject, subscriber);
                }

                // Send email
                const emailResult = await sendEmail({
                  to: subscriber.email,
                  subject: personalizedSubject,
                  html: personalizedHtml,
                  text: personalizedText,
                  from: `${campaign.sender_name || "Cymasphere"} <${
                    campaign.sender_email || SUPPORT_EMAIL
                  }>`,
                  replyTo: campaign.reply_to_email || undefined,
                });

                if (emailResult.success) {
                  // Update send record with message_id
                  if (sendId && emailResult.messageId) {
                    await supabase
                      .from("email_sends")
                      .update({
                        status: "sent",
                        message_id: emailResult.messageId,
                      })
                      .eq("id", sendId);
                  }
                  return { success: true, email: subscriber.email, sendId, error: null };
                } else {
                  return { success: false, email: subscriber.email, sendId, error: emailResult.error };
                }
              } catch (emailError) {
                return { 
                  success: false, 
                  email: subscriber.email, 
                  sendId: null, 
                  error: emailError instanceof Error ? emailError.message : String(emailError) 
                };
              }
            });

            // Wait for all emails in this batch to complete (parallel execution)
            const batchResults = await Promise.all(batchPromises);

            // Process results
            for (const result of batchResults) {
              if (result.success) {
                sentCount++;
                sendResults.push({
                  email: result.email,
                  success: true,
                  sendId: result.sendId,
                });
              } else {
                failedCount++;
                sendResults.push({
                  email: result.email,
                  success: false,
                  error: result.error,
                  sendId: result.sendId,
                });
              }
            }

            console.log(`✅ Parallel batch ${batchIndex + 1} completed: ${batchResults.filter(r => r.success).length}/${batch.length} sent successfully`);

            // Small delay between batches to avoid overwhelming AWS SES
            if (batchIndex < batches.length - 1) {
              await new Promise((resolve) => setTimeout(resolve, DELAY_BETWEEN_BATCHES_MS));
            }
          }
        } else {
          // Individual sending mode (original behavior - sequential, one at a time)
          console.log(`📧 Using SEQUENTIAL sending mode (one email per recipient, one at a time)`);
          
          for (const subscriber of subscribersResult) {
          try {
            // Create email_sends record for SES webhook correlation (messageId lookup)
            const { data: sendRecord, error: sendError } = await supabase
              .from("email_sends")
              .insert({
                campaign_id: campaign.id,
                subscriber_id: subscriber.id,
                email: subscriber.email,
                status: "pending",
              })
              .select("id")
              .single();

            const sendId = sendError || !sendRecord ? null : sendRecord.id;

            // Use stored html_content (SES handles tracking natively)
            const baseHtml = campaign.html_content ||
              `<h1>${campaign.subject || "Newsletter"}</h1><p>Content coming soon...</p>`;

            // Personalize content if variables are present
            let personalizedHtml = baseHtml;
            let personalizedText = campaign.text_content || campaign.subject || "Newsletter";
            let personalizedSubject = campaign.subject || "Newsletter";
            
            if (hasPersonalization) {
              personalizedHtml = personalizeContent(baseHtml, subscriber);
              personalizedText = personalizeContent(personalizedText, subscriber);
              personalizedSubject = personalizeContent(personalizedSubject, subscriber);
            }

            const emailResult = await sendEmail({
              to: subscriber.email,
              subject: personalizedSubject,
              html: personalizedHtml,
              text: personalizedText,
              from: `${campaign.sender_name || "Cymasphere"} <${
                campaign.sender_email || SUPPORT_EMAIL
              }>`,
              replyTo: campaign.reply_to_email || undefined,
            });

            if (emailResult.success) {
              sentCount++;
              console.log(`✅ Sent to ${subscriber.email}`);

              // Update send record with message_id if we have one
              if (sendId && emailResult.messageId) {
                await supabase
                  .from("email_sends")
                  .update({
                    status: "sent",
                    message_id: emailResult.messageId,
                  })
                  .eq("id", sendId);
              }
            } else {
              failedCount++;
              console.log(
                `❌ Failed to send to ${subscriber.email}:`,
                emailResult.error
              );
            }

            sendResults.push({
              email: subscriber.email,
              success: emailResult.success,
              error: emailResult.error,
              sendId: sendId,
            });

            // Small delay to avoid overwhelming the email service
            await new Promise((resolve) => setTimeout(resolve, 100));
          } catch (emailError) {
            failedCount++;
            console.error(
              `❌ Exception sending to ${subscriber.email}:`,
              emailError
            );
            sendResults.push({
              email: subscriber.email,
              success: false,
              error:
                emailError instanceof Error
                  ? emailError.message
                  : "Unknown error",
              sendId: null,
            });
          }
        }
        } // Close the else block

        // Update campaign with final status
        const finalStatus =
          failedCount === subscribersResult.length ? "failed" : "sent";
        const successRate =
          subscribersResult.length > 0
            ? Math.round((sentCount / subscribersResult.length) * 100)
            : 0;

        const { error: finalUpdateError } = await supabase
          .from("email_campaigns")
          .update({
            status: finalStatus,
            sent_at: new Date().toISOString(),
            total_recipients: subscribersResult.length,
            emails_sent: sentCount,
            emails_delivered: sentCount, // Assume delivered = sent for now
            emails_bounced: failedCount,
            updated_at: new Date().toISOString(),
          })
          .eq("id", campaign.id);

        if (finalUpdateError) {
          console.error(
            `❌ Failed to update final campaign status:`,
            finalUpdateError
          );
        }

        console.log(
          `✅ Campaign ${campaign.name} completed - ${sentCount}/${subscribersResult.length} sent (${successRate}% success rate)`
        );

        results.push({
          campaignId: campaign.id,
          name: campaign.name,
          status: finalStatus,
          totalRecipients: subscribersResult.length,
          sent: sentCount,
          failed: failedCount,
          successRate: successRate,
        });
      } catch (campaignError) {
        console.error(
          `❌ Error processing campaign ${campaign.id}:`,
          campaignError
        );

        // Update campaign to failed status
        await supabase
          .from("email_campaigns")
          .update({
            status: "failed",
            updated_at: new Date().toISOString(),
          })
          .eq("id", campaign.id);

        results.push({
          campaignId: campaign.id,
          name: campaign.name,
          status: "failed",
          error:
            campaignError instanceof Error
              ? campaignError.message
              : "Unknown error",
        });
      }
    }

    console.log(
      `🎉 Processed ${scheduledCampaigns.length} scheduled campaigns`
    );

    return NextResponse.json({
      message: `Successfully processed ${scheduledCampaigns.length} scheduled campaigns`,
      processed: scheduledCampaigns.length,
      results: results,
    });
  } catch (error) {
    console.error("❌ Fatal error in scheduled campaign processing:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * @brief GET endpoint to check scheduled campaign processor status
 * 
 * Returns status information about the scheduled campaign processor including
 * last execution time and next expected execution. Useful for monitoring and
 * debugging cron job execution.
 * 
 * Responses:
 * 
 * 200 OK:
 * ```json
 * {
 *   "message": "Scheduled campaign processor status",
 *   "currentTime": "2024-01-01T12:00:00.000Z",
 *   "lastExecutionTime": "2024-01-01T11:59:00.000Z",
 *   "timeSinceLastExecution": "1 minutes ago",
 *   "cronSchedule": "Every minute",
 *   "nextExpectedExecution": "2024-01-01T12:00:00.000Z"
 * }
 * ```
 * 
 * @returns NextResponse with processor status information
 * @note Does not require authentication (read-only status check)
 * 
 * @example
 * ```typescript
 * // GET /api/email-campaigns/process-scheduled
 * // Returns: { message: "...", lastExecutionTime: "...", ... }
 * ```
 */
/**
 * @brief GET endpoint for scheduled processor status (requires CRON_SECRET)
 *
 * Returns operational metadata. Callers must send Authorization: Bearer <CRON_SECRET>.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!secret || token !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date().toISOString();
  let timeSinceLastExecution: number | null = null;
  if (lastCronExecution) {
    const lastTime = new Date(lastCronExecution);
    const diffMs = new Date().getTime() - lastTime.getTime();
    timeSinceLastExecution = Math.floor(diffMs / (1000 * 60));
  }

  return NextResponse.json({
    message: "Scheduled campaign processor status",
    currentTime: now,
    lastExecutionTime: lastCronExecution,
    timeSinceLastExecution: timeSinceLastExecution
      ? `${timeSinceLastExecution} minutes ago`
      : "Never executed",
    cronSchedule: "Every minute",
    nextExpectedExecution: lastCronExecution
      ? new Date(
          new Date(lastCronExecution).getTime() + 1 * 60 * 1000
        ).toISOString()
      : "Unknown",
  });
}
