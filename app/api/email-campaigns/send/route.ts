import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/utils/email";
import { createSupabaseServer } from "@/utils/supabase/server";

// 🔒 SAFETY CONFIGURATION - CRITICAL FOR PREVENTING ACCIDENTAL SENDS
const DEVELOPMENT_MODE = process.env.NODE_ENV === 'development';
const TEST_MODE = process.env.EMAIL_TEST_MODE === 'true'; // Add this to your .env.local

// 🔒 SAFE EMAIL WHITELIST - Only these emails will receive messages in development
const SAFE_TEST_EMAILS = [
  'ryan@cymasphere.com',
  'test@cymasphere.com',
  'demo@cymasphere.com'
];

// 🔒 TEST AUDIENCE IDENTIFIERS - Audiences that are safe to send to
const TEST_AUDIENCE_NAMES = [
  'Test Audience',
  'TEST AUDIENCE', 
  'Development Test',
  'Safe Test Audience'
];

interface SendCampaignRequest {
  campaignId?: string;
  name: string;
  subject: string;
  audienceIds: string[]; // Updated to match new audience system
  excludedAudienceIds?: string[];
  emailElements: any[];
  scheduleType: 'immediate' | 'scheduled' | 'timezone' | 'draft';
  scheduleDate?: string;
  scheduleTime?: string;
}

// Get real subscribers from database based on audience selection
async function getSubscribersForAudiences(audienceIds: string[], excludedAudienceIds: string[] = []) {
  try {
    console.log('🔍 Getting subscribers for audiences:', { audienceIds, excludedAudienceIds });
    
    if (!audienceIds || audienceIds.length === 0) {
      return [];
    }

    // Get audience details to check if they're test audiences
    // Use admin client to ensure we can access junction table data
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const { data: audiences, error: audienceError } = await supabase
      .from('email_audiences')
      .select('id, name, description')
      .in('id', audienceIds);

    if (audienceError) {
      console.error('❌ Error fetching audience details:', audienceError);
      return [];
    }

    console.log('📊 Audience details:', audiences);

    // 🔒 SAFETY CHECK: Verify we're only sending to test audiences in development
    if (DEVELOPMENT_MODE || TEST_MODE) {
      const nonTestAudiences = audiences?.filter((aud: any) => 
        !TEST_AUDIENCE_NAMES.some(testName => 
          aud.name.toLowerCase().includes(testName.toLowerCase())
        )
      );

      if (nonTestAudiences && nonTestAudiences.length > 0) {
        console.error('🚨 SAFETY BLOCK: Attempting to send to non-test audience in development mode');
        console.error('Non-test audiences:', nonTestAudiences.map((a: any) => a.name));
        throw new Error(`SAFETY BLOCK: Cannot send to non-test audiences in development mode. Detected: ${nonTestAudiences.map((a: any) => a.name).join(', ')}`);
      }
      
      console.log('🔒 SAFETY: All selected audiences are test audiences, proceeding with whitelist filter');
    }

    // Get subscribers directly from database (avoid API authentication issues)
    const allSubscribers = new Set();
    const subscriberDetails = new Map();

    for (const audienceId of audienceIds) {
      try {
        console.log(`🔍 Getting subscribers for audience: ${audienceId}`);
        
        // Get audience to check if it's static
        const { data: audience } = await supabase
          .from('email_audiences')
          .select('id, name, filters')
          .eq('id', audienceId)
          .single();

        if (!audience) {
          console.error(`❌ Audience ${audienceId} not found`);
          continue;
        }

        const filters = audience.filters as any || {};
        console.log(`📋 Audience "${audience.name}" type:`, filters.audience_type || 'dynamic');

        let subscribers = [];

        // For static audiences, get subscribers from the junction table
        if (filters.audience_type === 'static') {
          console.log('📋 Static audience - getting subscribers from junction table');
          
          // Get subscribers via junction table
          const { data: relations, error: relationsError } = await supabase
            .from('email_audience_subscribers')
            .select(`
              subscriber_id,
              subscribers (
                id,
                email,
                status,
                created_at,
                metadata
              )
            `)
            .eq('audience_id', audienceId);

          if (relationsError) {
            console.error(`❌ Error getting relations for audience ${audienceId}:`, relationsError);
            continue;
          }

          console.log(`📊 Found ${relations?.length || 0} subscriber relations`);
          console.log('📊 Raw relations data:', JSON.stringify(relations, null, 2));
          
          subscribers = (relations || []).map((rel: any) => rel.subscribers).filter(Boolean);
          console.log('📊 Extracted subscribers:', JSON.stringify(subscribers, null, 2));
          
        } else {
          // For dynamic audiences, we'd need to implement filter logic here
          // For now, skip dynamic audiences in development mode for safety
          console.log(`⚠️ Dynamic audience skipped in development mode for safety`);
          continue;
        }

        console.log(`📧 Audience ${audienceId}: ${subscribers.length} subscribers found`);
        console.log(`📧 Subscribers:`, subscribers.map((s: any) => ({ id: s.id, email: s.email, status: s.status })));
        console.log(`📧 Full subscriber details:`, JSON.stringify(subscribers, null, 2));
        
        subscribers.forEach((sub: any) => {
          // 🔒 SAFETY FILTER: In development, only allow whitelisted emails
          if (DEVELOPMENT_MODE || TEST_MODE) {
            if (!SAFE_TEST_EMAILS.includes(sub.email)) {
              console.log(`🔒 SAFETY: Skipping non-whitelisted email: ${sub.email}`);
              return;
            }
          }

          console.log(`✅ Adding subscriber: ${sub.email} (${sub.status})`);
          allSubscribers.add(sub.id);
          
          const metadata = (sub.metadata as any) || {};
          subscriberDetails.set(sub.id, {
            id: sub.id,
            email: sub.email,
            name: [metadata.first_name, metadata.last_name].filter(Boolean).join(' ') || sub.email.split('@')[0],
            first_name: metadata.first_name,
            last_name: metadata.last_name,
            status: sub.status || 'active'
          });
        });
        
      } catch (error) {
        console.error(`❌ Error fetching subscribers for audience ${audienceId}:`, error);
      }
    }

    // Remove excluded audience subscribers
    if (excludedAudienceIds && excludedAudienceIds.length > 0) {
      for (const excludedAudienceId of excludedAudienceIds) {
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/email-campaigns/audiences/${excludedAudienceId}/subscribers`);
          if (response.ok) {
            const data = await response.json();
            const excludedSubscribers = data.subscribers || [];
            excludedSubscribers.forEach((sub: any) => {
              allSubscribers.delete(sub.id);
              subscriberDetails.delete(sub.id);
            });
          }
        } catch (error) {
          console.error(`❌ Error fetching excluded subscribers for audience ${excludedAudienceId}:`, error);
        }
      }
    }

    const finalSubscribers = Array.from(allSubscribers).map(id => subscriberDetails.get(id));
    
    console.log(`🎯 Final subscriber count: ${finalSubscribers.length}`);
    console.log(`🎯 Final subscribers:`, finalSubscribers.map((s: any) => ({ id: s?.id, email: s?.email, status: s?.status })));
    console.log(`🎯 All subscriber IDs:`, Array.from(allSubscribers));
    console.log(`🎯 Subscriber details map:`, Object.fromEntries(subscriberDetails));
    console.log(`🔒 Safety mode: ${DEVELOPMENT_MODE ? 'DEVELOPMENT' : 'PRODUCTION'}`);
    console.log(`🔒 Whitelisted emails: ${SAFE_TEST_EMAILS.join(', ')}`);
    
    return finalSubscribers;

  } catch (error) {
    console.error('❌ Error getting subscribers:', error);
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
      audienceIds,
      excludedAudienceIds = [],
      emailElements, 
      scheduleType,
      scheduleDate,
      scheduleTime 
    } = body;

    console.log('📧 Send campaign request:', {
      name,
      subject,
      audienceIds,
      excludedAudienceIds,
      scheduleType,
      emailElementsCount: emailElements?.length || 0,
      emailElementsPreview: emailElements?.slice(0, 2) || 'undefined',
      developmentMode: DEVELOPMENT_MODE,
      testMode: TEST_MODE
    });

    // Validate required fields
    if (!name || !subject || !audienceIds || audienceIds.length === 0 || !emailElements) {
      console.error('❌ Missing required fields:', {
        name: !!name,
        subject: !!subject,
        audienceIds: !!audienceIds && audienceIds.length > 0,
        emailElements: !!emailElements
      });
      return NextResponse.json(
        { success: false, error: "Missing required campaign fields (name, subject, audiences, content)" },
        { status: 400 }
      );
    }

    // 🔒 SAFETY WARNING for development mode
    if (DEVELOPMENT_MODE || TEST_MODE) {
      console.log('🔒 SAFETY MODE ACTIVE - Emails restricted to whitelist:', SAFE_TEST_EMAILS);
    }

    // If it's a draft, just save and return
    if (scheduleType === 'draft') {
      return NextResponse.json({
        success: true,
        message: "Campaign saved as draft",
        campaignId: campaignId || `campaign_${Date.now()}`,
        status: 'draft'
      });
    }

    // If scheduled for later, save schedule and return
    if (scheduleType === 'scheduled' && scheduleDate && scheduleTime) {
      // If we have a campaignId, get the scheduled_at time from the already-saved campaign
      let scheduledDateTime;
      
      if (campaignId) {
        try {
          // Get the campaign's scheduled_at value (which includes proper timezone)
          const supabase = await createSupabaseServer();
          const { data: campaign, error } = await supabase
            .from('email_campaigns')
            .select('scheduled_at')
            .eq('id', campaignId)
            .single();
          
          if (error) {
            console.error('Error fetching campaign scheduled_at:', error);
            // Fallback to reconstructing from date/time
            scheduledDateTime = new Date(`${scheduleDate}T${scheduleTime}:00`);
          } else if (campaign.scheduled_at) {
            scheduledDateTime = new Date(campaign.scheduled_at);
            console.log('📅 Using saved scheduled_at from campaign:', {
              campaignId,
              savedScheduledAt: campaign.scheduled_at,
              parsedDateTime: scheduledDateTime.toString()
            });
          } else {
            // No scheduled_at in campaign, fallback to reconstructing
            scheduledDateTime = new Date(`${scheduleDate}T${scheduleTime}:00`);
          }
        } catch (error) {
          console.error('Error fetching campaign:', error);
          // Fallback to reconstructing from date/time
          scheduledDateTime = new Date(`${scheduleDate}T${scheduleTime}:00`);
        }
      } else {
        // No campaignId, reconstruct from date/time
        scheduledDateTime = new Date(`${scheduleDate}T${scheduleTime}:00`);
      }
      
      const currentTime = new Date();
      
      console.log('📅 Validating scheduled time:', {
        scheduleDate,
        scheduleTime,
        scheduledDateTime: scheduledDateTime.toString(),
        scheduledUTC: scheduledDateTime.toISOString(),
        currentTime: currentTime.toString(),
        currentUTC: currentTime.toISOString(),
        timeDifference: scheduledDateTime.getTime() - currentTime.getTime(),
        isInFuture: scheduledDateTime > currentTime
      });
      
      // Add a 1-minute buffer to account for processing time and minor clock differences
      const bufferTime = new Date(currentTime.getTime() + 60000); // 1 minute buffer
      
      if (scheduledDateTime <= bufferTime) {
        return NextResponse.json(
          { success: false, error: "Scheduled time must be at least 1 minute in the future" },
          { status: 400 }
        );
      }

      // ✅ Campaign is now stored and will be processed by the cron job at /api/email-campaigns/process-scheduled
      console.log(`📅 Campaign "${name}" scheduled for: ${scheduledDateTime.toLocaleString()}`);
      console.log(`📊 Target audiences: ${audienceIds.length} selected, ${excludedAudienceIds?.length || 0} excluded`);

      return NextResponse.json({
        success: true,
        message: `Campaign scheduled for ${scheduledDateTime.toLocaleString()}`,
        campaignId: campaignId || `campaign_${Date.now()}`,
        status: 'scheduled',
        scheduledFor: scheduledDateTime.toISOString(),
        stats: {
          audienceCount: audienceIds.length,
          excludedAudienceCount: excludedAudienceIds?.length || 0,
          scheduleType: 'scheduled',
          scheduledDateTime: scheduledDateTime.toLocaleString()
        }
      });
    }

    // If scheduled by timezone, handle timezone-based delivery
    if (scheduleType === 'timezone' && scheduleTime) {
      const deliveryWindow = scheduleDate || '24hours'; // scheduleDate stores delivery window for timezone
      const sendTime = scheduleTime; // e.g., "09:00"
      
      console.log(`🌍 Campaign "${name}" scheduled for timezone-based delivery:`);
      console.log(`   ⏰ Send time: ${sendTime} (in each subscriber's timezone)`);
      console.log(`   📅 Delivery window: ${deliveryWindow}`);
      console.log(`   📊 Target audiences: ${audienceIds.length} selected, ${excludedAudienceIds?.length || 0} excluded`);
      
      return NextResponse.json({
        success: true,
        message: `Campaign scheduled for timezone-based delivery at ${sendTime} in each subscriber's timezone`,
        campaignId: campaignId || `campaign_${Date.now()}`,
        status: 'scheduled',
        scheduleType: 'timezone',
        stats: {
          audienceCount: audienceIds.length,
          excludedAudienceCount: excludedAudienceIds?.length || 0,
          scheduleType: 'timezone',
          sendTime: sendTime,
          deliveryWindow: deliveryWindow,
          estimatedStartTime: new Date().toLocaleString(),
          estimatedCompletionTime: new Date(Date.now() + (deliveryWindow === '6hours' ? 6 : deliveryWindow === '12hours' ? 12 : 24) * 60 * 60 * 1000).toLocaleString()
        }
      });
    }

    // Get real subscribers from database
    console.log('🔍 Fetching subscribers from database...');
    const targetSubscribers = await getSubscribersForAudiences(audienceIds, excludedAudienceIds);
    
    if (targetSubscribers.length === 0) {
      const errorMessage = (DEVELOPMENT_MODE || TEST_MODE) 
        ? `No subscribers found for the selected audiences. In ${DEVELOPMENT_MODE ? 'development' : 'test'} mode, only whitelisted emails (${SAFE_TEST_EMAILS.join(', ')}) are allowed.`
        : "No active subscribers found for the selected audience";
        
      return NextResponse.json(
        { success: false, error: errorMessage },
        { status: 400 }
      );
    }

    // Generate base HTML and text content (without tracking yet)
    const baseHtmlContent = generateHtmlFromElements(emailElements, subject);
    const textContent = generateTextFromElements(emailElements);

    console.log(`🚀 Starting to send campaign "${name}" to ${targetSubscribers.length} subscribers...`);
    
    // 🔒 FINAL SAFETY CHECK before sending
    if (DEVELOPMENT_MODE || TEST_MODE) {
      const unsafeEmails = targetSubscribers.filter(sub => !SAFE_TEST_EMAILS.includes(sub.email));
      if (unsafeEmails.length > 0) {
        throw new Error(`SAFETY BLOCK: Found non-whitelisted emails: ${unsafeEmails.map(s => s.email).join(', ')}`);
      }
    }

    // Send emails to all subscribers
    const results = [];
    const errors = [];
    const supabase = await createSupabaseServer();

    console.log(`\n🚀 Starting email send process...`);
    console.log(`📧 Target subscribers: ${targetSubscribers.length}`);
    targetSubscribers.forEach((sub, i) => {
      console.log(`   ${i + 1}. ${sub.email} (ID: ${sub.id}, Status: ${sub.status})`);
    });

    for (const subscriber of targetSubscribers) {
      try {
        // Create email_sends record first to get tracking ID
        const { data: sendRecord, error: sendError } = await supabase
          .from('email_sends')
          .insert({
            campaign_id: campaignId,
            subscriber_id: subscriber.id,
            email: subscriber.email,
            status: 'pending'
          } as any)
          .select('id')
          .single();

        if (sendError || !sendRecord) {
          console.error(`❌ Error creating send record for ${subscriber.email}:`, sendError);
          errors.push({
            subscriberId: subscriber.id,
            email: subscriber.email,
            error: 'Failed to create send record',
            status: 'failed'
          });
          continue;
        }

        const sendId = sendRecord.id;
        console.log(`📝 Created send record: ${sendId} for ${subscriber.email}`);

        // Generate tracking-enabled HTML content
        console.log(`🔧 Generating tracked HTML for ${subscriber.email}:`, {
          emailElementsCount: emailElements.length,
          campaignId,
          subscriberId: subscriber.id,
          sendId,
          elementsPreview: emailElements.slice(0, 2)
        });
        
        const trackedHtmlContent = generateHtmlFromElements(emailElements, subject, campaignId, subscriber.id, sendId);
        
        console.log(`📧 Generated tracked HTML for ${subscriber.email}:`, {
          length: trackedHtmlContent.length,
          hasTrackingPixel: trackedHtmlContent.includes('/api/email-campaigns/track/open'),
          hasTrackingParams: trackedHtmlContent.includes(`c=${campaignId}`),
          lastChars: trackedHtmlContent.slice(-200)
        });
        
        // Personalize content
        const personalizedHtml = personalizeContent(trackedHtmlContent, subscriber);
        const personalizedText = personalizeContent(textContent, subscriber);
        const personalizedSubject = personalizeContent(subject, subscriber);

        console.log(`\n📧 Processing subscriber: ${subscriber.email}`);
        console.log(`   - Send ID: ${sendId}`);
        console.log(`   - Personalized subject: "${personalizedSubject}"`);
        console.log(`   - HTML content length: ${personalizedHtml.length} chars`);
        console.log(`   - Text content length: ${personalizedText.length} chars`);
        console.log(`   - Mode: ${DEVELOPMENT_MODE ? 'DEVELOPMENT' : 'PRODUCTION'}`);

        console.log(`📤 Calling sendEmail function...`);
        const result = await sendEmail({
          to: subscriber.email,
          subject: personalizedSubject,
          html: personalizedHtml,
          text: personalizedText,
          from: "support@cymasphere.com"
        });

        console.log(`📬 sendEmail result:`, JSON.stringify(result, null, 2));

        if (result.success) {
          // Update send record to sent status
          await supabase
            .from('email_sends')
            .update({
              status: 'sent',
              sent_at: new Date().toISOString()
            })
            .eq('id', sendId);

          results.push({
            subscriberId: subscriber.id,
            email: subscriber.email,
            messageId: result.messageId,
            sendId: sendId,
            status: 'sent'
          });
          console.log(`✅ SUCCESS: Email sent to ${subscriber.email}`);
          console.log(`   - Message ID: ${result.messageId}`);
          console.log(`   - Send ID: ${sendId}`);
        } else {
          // Update send record to failed status
          await supabase
            .from('email_sends')
            .update({
              status: 'failed',
              error_message: result.error
            })
            .eq('id', sendId);

          errors.push({
            subscriberId: subscriber.id,
            email: subscriber.email,
            error: result.error,
            sendId: sendId,
            status: 'failed'
          });
          console.error(`❌ FAILED: Could not send to ${subscriber.email}`);
          console.error(`   - Error: ${result.error}`);
          console.error(`   - Full result:`, result);
        }

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        errors.push({
          subscriberId: subscriber.id,
          email: subscriber.email,
          error: errorMessage,
          status: 'failed'
        });
        console.error(`❌ Exception sending to ${subscriber.email}:`, error);
      }
    }

    const successCount = results.length;
    const errorCount = errors.length;
    const totalCount = targetSubscribers.length;

    // Update campaign statistics
    if (campaignId && successCount > 0) {
      try {
        await supabase
          .from('email_campaigns')
          .update({
            emails_sent: successCount,
            total_recipients: totalCount,
            sent_at: new Date().toISOString(),
            status: 'sent'
          })
          .eq('id', campaignId);
        
        console.log(`📊 Updated campaign stats: ${successCount} sent, ${totalCount} total`);
      } catch (error) {
        console.error('❌ Error updating campaign stats:', error);
      }
    }

    console.log(`📊 Campaign "${name}" completed:`);
    console.log(`   ✅ Successful: ${successCount}/${totalCount}`);
    console.log(`   ❌ Failed: ${errorCount}/${totalCount}`);
    console.log(`   🔒 Mode: ${DEVELOPMENT_MODE ? 'DEVELOPMENT' : 'PRODUCTION'}`);

    return NextResponse.json({
      success: true,
      message: `Campaign sent successfully to ${successCount} out of ${totalCount} subscribers`,
      campaignId: campaignId || `campaign_${Date.now()}`,
      stats: {
        total: totalCount,
        sent: successCount,
        failed: errorCount,
        successRate: ((successCount / totalCount) * 100).toFixed(1),
        mode: DEVELOPMENT_MODE ? 'DEVELOPMENT' : 'PRODUCTION',
        safetyEnabled: DEVELOPMENT_MODE || TEST_MODE
      },
      results,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error("❌ Error in send campaign API:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error sending campaign";
    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

// Helper function to generate HTML from email elements with tracking
function generateHtmlFromElements(elements: any[], subject: string, campaignId?: string, subscriberId?: string, sendId?: string): string {
  
  // Helper function to rewrite links for click tracking
  const rewriteLinksForTracking = (html: string): string => {
    if (!campaignId || !subscriberId || !sendId) {
      return html; // No tracking if missing parameters
    }
    
    // Find and replace all href attributes
    return html.replace(/href=["']([^"']+)["']/g, (match, url) => {
      // Skip already tracked URLs
      if (url.includes('/api/email-campaigns/track/click')) {
        return match;
      }
      
      // Skip internal tracking URLs
      if (url.includes('unsubscribe') || url.includes('mailto:')) {
        return match;
      }
      
      // Always use production URL for tracking (even in development)
      // because localhost URLs won't work in external email clients
      const baseUrl = process.env.NODE_ENV === 'production' 
        ? (process.env.NEXT_PUBLIC_SITE_URL || 'https://cymasphere.com')
        : 'https://cymasphere.com';
      const trackingUrl = `${baseUrl}/api/email-campaigns/track/click?c=${campaignId}&u=${subscriberId}&s=${sendId}&url=${encodeURIComponent(url)}`;
      return `href="${trackingUrl}"`;
    });
  };
  
  const elementHtml = elements.map(element => {
    switch (element.type) {
      case 'header':
        return `<h1 style="font-size: 2.5rem; color: #333; margin-bottom: 1rem; text-align: center; background: linear-gradient(135deg, #333, #666); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-weight: 800;">${element.content}</h1>`;
      
      case 'text':
        return `<p style="font-size: 1rem; color: #555; line-height: 1.6; margin-bottom: 1rem;">${element.content}</p>`;
      
      case 'button':
        return `<div style="text-align: center; margin: 2rem 0;"><a href="${element.url || '#'}" style="display: inline-block; padding: 12px 24px; background: linear-gradient(90deg, #6c63ff, #4ecdc4); color: white; text-decoration: none; border-radius: 25px; font-weight: 600; transition: all 0.3s ease;">${element.content}</a></div>`;
      
      case 'image':
        return `<div style="text-align: center; margin: 1.5rem 0;"><img src="${element.src}" alt="Campaign Image" style="max-width: 100%; height: auto; border-radius: 8px;" /></div>`;
      
      case 'divider':
        return `<hr style="border: none; height: 2px; background: linear-gradient(90deg, #6c63ff, #4ecdc4); margin: 2rem 0;" />`;
      
      case 'spacer':
        return `<div style="height: ${element.height || '20px'};"></div>`;
      
      default:
        return `<div style="color: #555; margin: 1rem 0;">${element.content || ''}</div>`;
    }
  }).join('');

  // Base HTML template
  let html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${subject}</title>
    <style>
        body {
            font-family: 'Arial', sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f7f7f7;
        }
        .container {
            background-color: white;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 8px 30px rgba(0, 0, 0, 0.1);
        }
        .header {
            background: linear-gradient(135deg, #1a1a1a 0%, #121212 100%);
            padding: 20px;
            text-align: center;
        }
        .logo {
            color: #ffffff;
            font-size: 1.5rem;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 2px;
        }
        .logo .cyma {
            background: linear-gradient(90deg, #6c63ff, #4ecdc4);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        .content {
            padding: 30px;
        }
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
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">
                <span class="cyma">CYMA</span><span>SPHERE</span>
            </div>
        </div>
        
        <div class="content">
            ${elementHtml}
        </div>
        
        <div class="footer">
            <p>You're receiving this email because you're subscribed to Cymasphere updates.</p>
            <p><a href="https://cymasphere.com/unsubscribe">Unsubscribe</a> | <a href="https://cymasphere.com">Visit our website</a></p>
            <p>© 2024 Cymasphere. All rights reserved.</p>
        </div>
    </div>`;

  // Add tracking pixel if we have tracking parameters
  if (campaignId && subscriberId && sendId) {
    // Always use production URL for tracking pixels (even in development)
    // because localhost URLs won't work in external email clients
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? (process.env.NEXT_PUBLIC_SITE_URL || 'https://cymasphere.com')
      : 'https://cymasphere.com';
    const trackingPixel = `
    <!-- Email Open Tracking -->
    <img src="${baseUrl}/api/email-campaigns/track/open?c=${campaignId}&u=${subscriberId}&s=${sendId}" width="1" height="1" style="display:none;border:0;outline:0;" alt="" />`;
    
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
  const textContent = elements.map(element => {
    switch (element.type) {
      case 'header':
        return `${element.content}\n${'='.repeat(element.content.length)}\n`;
      case 'text':
        return `${element.content}\n`;
      case 'button':
        return `${element.content}: ${element.url || '#'}\n`;
      case 'image':
        return `[Image: ${element.src}]\n`;
      case 'divider':
        return `${'─'.repeat(50)}\n`;
      case 'spacer':
        return '\n';
      default:
        return `${element.content || ''}\n`;
    }
  }).join('\n');

  return `
CYMASPHERE

${textContent}

──────────────────────────────────────────────────

You're receiving this email because you're subscribed to Cymasphere updates.

Unsubscribe: https://cymasphere.com/unsubscribe
Website: https://cymasphere.com

© 2024 Cymasphere. All rights reserved.
  `.trim();
}

// Helper function to personalize content with subscriber data
function personalizeContent(content: string, subscriber: any): string {
  return content
    .replace(/\{\{firstName\}\}/g, subscriber.name.split(' ')[0])
    .replace(/\{\{fullName\}\}/g, subscriber.name)
    .replace(/\{\{email\}\}/g, subscriber.email);
} 