import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/utils/supabase/server";
import { createClient } from "@supabase/supabase-js";
import { sendEmail } from "@/utils/email";

// Store the last execution time in memory
let lastCronExecution: string | null = null;

// This endpoint will be called by a cron job every minute
export async function POST(request: NextRequest) {
  const executionTime = new Date().toISOString();
  console.log(`🔄 Processing scheduled campaigns at ${executionTime}...`);
  
  // Store the execution time
  lastCronExecution = executionTime;
  
  try {
    // Verify the request is authorized (Vercel cron, AWS cron, or manual with secret)
    const authHeader = request.headers.get('authorization');
    const vercelSecret = request.headers.get('x-vercel-cron-signature');
    const cronSecret = process.env.CRON_SECRET || 'your-secret-key';
    
    // Allow Vercel cron jobs, AWS cron jobs with API key, or manual calls with API key
    const isVercelCron = !!vercelSecret;
    const isApiKeyCron = authHeader === `Bearer ${cronSecret}`;
    const isAuthorized = isVercelCron || isApiKeyCron;
    
    if (!isAuthorized) {
      console.log('❌ Unauthorized cron job request - missing vercel cron signature or API key');
      console.log('❌ Expected Authorization header:', `Bearer ${cronSecret.slice(0, 8)}...`);
      console.log('❌ Received Authorization header:', authHeader || 'none');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    console.log('✅ Authorized request:', isVercelCron ? 'Vercel Cron' : 'API Key Cron');

    // Use admin client for cron jobs (bypasses RLS and doesn't need user authentication)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ Missing Supabase configuration');
      return NextResponse.json({ 
        error: 'Server configuration error - missing Supabase credentials' 
      }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    
    console.log('🔧 Using Supabase admin client for cron job');

    // Find campaigns that are scheduled and due to be sent
    const now = new Date().toISOString();
    console.log(`🔍 Looking for campaigns scheduled before: ${now}`);
    const { data: scheduledCampaigns, error: fetchError } = await supabase
      .from('email_campaigns')
      .select(`
        *,
        email_campaign_audiences(
          audience_id,
          is_excluded
        )
      `)
      .eq('status', 'scheduled')
      .lte('scheduled_at', now)
      .order('scheduled_at', { ascending: true });
    
    if (fetchError) {
      console.error('❌ Error fetching scheduled campaigns:', fetchError);
      return NextResponse.json({ 
        error: 'Failed to fetch scheduled campaigns',
        details: fetchError.message 
      }, { status: 500 });
    }

    if (!scheduledCampaigns || scheduledCampaigns.length === 0) {
      console.log('✅ No scheduled campaigns due for sending');
      
      // Show recently processed campaigns for debugging
      const { data: recentCampaigns } = await supabase
        .from('email_campaigns')
        .select('id, name, status, sent_at, total_recipients, emails_sent, updated_at')
        .in('status', ['sent', 'failed', 'sending'])
        .order('updated_at', { ascending: false })
        .limit(5);
      
      return NextResponse.json({ 
        message: 'No scheduled campaigns to process',
        processed: 0,
        recentlyProcessed: recentCampaigns?.map(c => ({
          id: c.id,
          name: c.name,
          status: c.status,
          sent_at: c.sent_at,
          total_recipients: c.total_recipients,
          emails_sent: c.emails_sent,
          last_updated: c.updated_at
        })) || []
      });
    }

    console.log(`📧 Found ${scheduledCampaigns.length} scheduled campaigns to process`);
    
    const results = [];
    
    // Process each scheduled campaign
    for (const campaign of scheduledCampaigns) {
      console.log(`🚀 Processing campaign: ${campaign.name} (${campaign.id})`);
      
      try {
        // Update status to 'sending' to prevent duplicate processing
        const { error: updateError } = await supabase
          .from('email_campaigns')
          .update({ 
            status: 'sending',
            updated_at: new Date().toISOString()
          })
          .eq('id', campaign.id);

        if (updateError) {
          console.error(`❌ Failed to update campaign ${campaign.id} status:`, updateError);
          results.push({
            campaignId: campaign.id,
            name: campaign.name,
            status: 'failed',
            error: 'Failed to update status'
          });
          continue;
        }

        // Extract audience data
        const audienceIds = campaign.email_campaign_audiences
          ?.filter((rel: any) => !rel.is_excluded)
          .map((rel: any) => rel.audience_id) || [];
        
        const excludedAudienceIds = campaign.email_campaign_audiences
          ?.filter((rel: any) => rel.is_excluded)
          .map((rel: any) => rel.audience_id) || [];

        console.log(`📊 Campaign audiences - Included: ${audienceIds.length}, Excluded: ${excludedAudienceIds.length}`);

        if (audienceIds.length === 0) {
          console.log(`⚠️ Campaign ${campaign.name} has no target audiences, skipping`);
          
          // Update to failed status
          await supabase
            .from('email_campaigns')
            .update({ 
              status: 'failed',
              updated_at: new Date().toISOString()
            })
            .eq('id', campaign.id);

          results.push({
            campaignId: campaign.id,
            name: campaign.name,
            status: 'failed',
            error: 'No target audiences'
          });
          continue;
        }

        // Get subscribers for the audiences
        const subscribersResult = await getSubscribersForAudiences(audienceIds, excludedAudienceIds);
        
        if (subscribersResult.length === 0) {
          console.log(`⚠️ Campaign ${campaign.name} has no target subscribers, skipping`);
          
          // Update to completed status (no one to send to)
          await supabase
            .from('email_campaigns')
            .update({ 
              status: 'sent',
              sent_at: new Date().toISOString(),
              total_recipients: 0,
              emails_sent: 0,
              updated_at: new Date().toISOString()
            })
            .eq('id', campaign.id);

          results.push({
            campaignId: campaign.id,
            name: campaign.name,
            status: 'sent',
            totalRecipients: 0,
            sent: 0,
            failed: 0
          });
          continue;
        }

        console.log(`📬 Sending to ${subscribersResult.length} subscribers`);

        // Debug AWS environment variables
        console.log('🔧 AWS Environment Check:');
        console.log('  AWS_ACCESS_KEY_ID:', process.env.AWS_ACCESS_KEY_ID ? `${process.env.AWS_ACCESS_KEY_ID.slice(0, 8)}...` : 'NOT_SET');
        console.log('  AWS_SECRET_ACCESS_KEY:', process.env.AWS_SECRET_ACCESS_KEY ? `${process.env.AWS_SECRET_ACCESS_KEY.slice(0, 8)}...` : 'NOT_SET');
        console.log('  AWS_REGION:', process.env.AWS_REGION || 'NOT_SET');

        // Send emails
        let sentCount = 0;
        let failedCount = 0;
        const sendResults = [];

        for (const subscriber of subscribersResult) {
          try {
                         const emailResult = await sendEmail({
               to: subscriber.email,
               subject: campaign.subject || 'Newsletter',
               html: campaign.html_content || `<h1>${campaign.subject || 'Newsletter'}</h1><p>Content coming soon...</p>`,
               text: campaign.text_content || campaign.subject || 'Newsletter',
               from: `${campaign.sender_name || 'Cymasphere'} <${campaign.sender_email || 'support@cymasphere.com'}>`,
               replyTo: campaign.reply_to_email || undefined
             });

            if (emailResult.success) {
              sentCount++;
              console.log(`✅ Sent to ${subscriber.email}`);
            } else {
              failedCount++;
              console.log(`❌ Failed to send to ${subscriber.email}:`, emailResult.error);
            }

            sendResults.push({
              email: subscriber.email,
              success: emailResult.success,
              error: emailResult.error
            });

            // Small delay to avoid overwhelming the email service
            await new Promise(resolve => setTimeout(resolve, 100));

          } catch (emailError) {
            failedCount++;
            console.error(`❌ Exception sending to ${subscriber.email}:`, emailError);
            sendResults.push({
              email: subscriber.email,
              success: false,
              error: emailError instanceof Error ? emailError.message : 'Unknown error'
            });
          }
        }

        // Update campaign with final status
        const finalStatus = failedCount === subscribersResult.length ? 'failed' : 'sent';
        const successRate = subscribersResult.length > 0 ? Math.round((sentCount / subscribersResult.length) * 100) : 0;

        const { error: finalUpdateError } = await supabase
          .from('email_campaigns')
          .update({
            status: finalStatus,
            sent_at: new Date().toISOString(),
            total_recipients: subscribersResult.length,
            emails_sent: sentCount,
            emails_delivered: sentCount, // Assume delivered = sent for now
            emails_bounced: failedCount,
            updated_at: new Date().toISOString()
          })
          .eq('id', campaign.id);

        if (finalUpdateError) {
          console.error(`❌ Failed to update final campaign status:`, finalUpdateError);
        }

        console.log(`✅ Campaign ${campaign.name} completed - ${sentCount}/${subscribersResult.length} sent (${successRate}% success rate)`);

        results.push({
          campaignId: campaign.id,
          name: campaign.name,
          status: finalStatus,
          totalRecipients: subscribersResult.length,
          sent: sentCount,
          failed: failedCount,
          successRate: successRate
        });

      } catch (campaignError) {
        console.error(`❌ Error processing campaign ${campaign.id}:`, campaignError);
        
        // Update campaign to failed status
        await supabase
          .from('email_campaigns')
          .update({ 
            status: 'failed',
            updated_at: new Date().toISOString()
          })
          .eq('id', campaign.id);

        results.push({
          campaignId: campaign.id,
          name: campaign.name,
          status: 'failed',
          error: campaignError instanceof Error ? campaignError.message : 'Unknown error'
        });
      }
    }

    console.log(`🎉 Processed ${scheduledCampaigns.length} scheduled campaigns`);
    
    return NextResponse.json({
      message: `Successfully processed ${scheduledCampaigns.length} scheduled campaigns`,
      processed: scheduledCampaigns.length,
      results: results
    });

  } catch (error) {
    console.error('❌ Fatal error in scheduled campaign processing:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Helper function to get subscribers for audiences (reused from send route)
async function getSubscribersForAudiences(audienceIds: string[], excludedAudienceIds: string[] = []) {
  // Use admin client (same as main function)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
  
  console.log('🔍 Fetching subscribers for audiences:', { audienceIds, excludedAudienceIds });

  try {
    // Get all unique subscribers from included audiences
    let includedSubscribers: any[] = [];
    
    if (audienceIds.length > 0) {
      const { data: audienceSubscribers, error: audienceError } = await supabase
        .from('email_audience_subscribers')
        .select(`
          subscriber_id,
          subscribers (
            id,
            email,
            status,
            user_id
          )
        `)
        .in('audience_id', audienceIds);

      if (audienceError) {
        console.error('❌ Error fetching audience subscribers:', audienceError);
        throw audienceError;
      }

      // Flatten and deduplicate subscribers
      const subscriberMap = new Map();
      audienceSubscribers?.forEach((rel: any) => {
        if (rel.subscribers && rel.subscribers.status === 'active') {
          subscriberMap.set(rel.subscribers.id, rel.subscribers);
        }
      });
      
      includedSubscribers = Array.from(subscriberMap.values());
    }

    // Get excluded subscribers if any
    let excludedSubscriberIds: string[] = [];
    
    if (excludedAudienceIds.length > 0) {
      const { data: excludedAudienceSubscribers, error: excludedError } = await supabase
        .from('email_audience_subscribers')
        .select('subscriber_id')
        .in('audience_id', excludedAudienceIds);

      if (excludedError) {
        console.error('❌ Error fetching excluded audience subscribers:', excludedError);
        throw excludedError;
      }

      excludedSubscriberIds = excludedAudienceSubscribers?.map((rel: any) => rel.subscriber_id) || [];
    }

    // Filter out excluded subscribers
    const finalSubscribers = includedSubscribers.filter(
      (subscriber: any) => !excludedSubscriberIds.includes(subscriber.id)
    );

    console.log(`📊 Subscriber calculation:`, {
      includedCount: includedSubscribers.length,
      excludedCount: excludedSubscriberIds.length,
      finalCount: finalSubscribers.length
    });

    return finalSubscribers;

  } catch (error) {
    console.error('❌ Error in getSubscribersForAudiences:', error);
    throw error;
  }
}

// Allow GET requests for testing purposes and showing status
export async function GET() {
  const now = new Date().toISOString();
  
  // Calculate time since last execution
  let timeSinceLastExecution = null;
  if (lastCronExecution) {
    const lastTime = new Date(lastCronExecution);
    const currentTime = new Date();
    const diffMs = currentTime.getTime() - lastTime.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    timeSinceLastExecution = diffMinutes;
  }
  
  return NextResponse.json({ 
    message: 'Scheduled campaign processor status',
    currentTime: now,
    lastExecutionTime: lastCronExecution,
    timeSinceLastExecution: timeSinceLastExecution ? `${timeSinceLastExecution} minutes ago` : 'Never executed',
    cronSchedule: 'Every minute',
    nextExpectedExecution: lastCronExecution ? 
      new Date(new Date(lastCronExecution).getTime() + 1 * 60 * 1000).toISOString() : 
      'Unknown'
  });
} 