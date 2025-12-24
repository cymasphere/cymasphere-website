/**
 * @fileoverview Email open tracking pixel API endpoint
 * 
 * This endpoint serves a 1x1 transparent PNG pixel for tracking email opens.
 * Records unique opens per email send with deduplication to prevent multiple
 * counts from the same email. Updates campaign statistics with open counts.
 * Includes basic bot detection to filter out obvious test requests.
 * 
 * @module api/email-campaigns/track/open
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';

/**
 * @brief GET endpoint to track email opens via tracking pixel
 * 
 * Serves a transparent 1x1 PNG pixel and records email open events.
 * Implements deduplication to ensure only the first open per email send
 * is counted. Updates campaign statistics with unique open counts.
 * 
 * Query parameters:
 * - s: Send ID (email_sends.id) - required
 * - c: Campaign ID - required
 * - u: Subscriber ID - required
 * 
 * Responses:
 * 
 * 200 OK - Always returns tracking pixel (PNG image):
 * - Content-Type: image/png
 * - 1x1 transparent PNG pixel
 * 
 * @param request Next.js request object containing query parameters
 * @returns NextResponse with PNG tracking pixel
 * @note Always returns pixel even on errors (to prevent broken images in emails)
 * @note Deduplicates opens per send_id (only first open is recorded)
 * @note Includes basic bot detection for obvious test patterns
 * @note Uses service role client to bypass RLS for anonymous tracking
 * 
 * @example
 * ```typescript
 * // GET /api/email-campaigns/track/open?s=uuid&c=uuid&u=uuid
 * // Returns: PNG image (1x1 transparent pixel)
 * ```
 */
export async function GET(request: NextRequest) {
  console.log('🔥 UNIQUE OPENS TRACKING - DEDUPLICATION');
  
  try {
    const { searchParams } = new URL(request.url);
    const sendId = searchParams.get('s');
    const campaignId = searchParams.get('c');
    const subscriberId = searchParams.get('u');

    console.log('🔥 Params:', { sendId, campaignId, subscriberId });

    // Use service role client to bypass ALL permissions
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: { autoRefreshToken: false, persistSession: false }
      }
    );
    
    // Get user agent and IP
    const userAgent = request.headers.get('user-agent') || 'Unknown';
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1';
    
    console.log('🔥 User Agent:', userAgent?.slice(0, 50));
    console.log('🔥 IP:', ip);

    // MINIMAL bot detection - only block obvious test patterns
    const isObviousTestBot = userAgent.toLowerCase().includes('nuclear-test') || 
                            userAgent.toLowerCase().includes('monitor-') ||
                            userAgent.toLowerCase().includes('quick-status') ||
                            userAgent.toLowerCase().includes('test-should-be-blocked') ||
                            userAgent.toLowerCase().includes('test-deployment');

    // Only block the specific fake user agent from server-side requests  
    const isServerFakeAgent = userAgent.includes('Chrome/42.0.2311.135') &&
                             userAgent.includes('Edge/12.246');

    if (isObviousTestBot) {
      console.log('🤖 Blocking obvious test request:', userAgent);
    } else if (isServerFakeAgent) {
      console.log('🎭 Blocking server fake user agent:', userAgent);
    } else if (sendId && campaignId && subscriberId) {
      console.log('✅ Processing email open...');
      
      // CHECK FOR EXISTING OPEN (DEDUPLICATION)
      console.log('🔍 Checking for existing opens for this email send...');
      const { data: existingOpens, error: existingError } = await supabase
        .from('email_opens')
        .select('id')
        .eq('send_id', sendId)
        .limit(1);

      console.log('🔍 Existing opens check:', { existingOpens, existingError });

      if (existingError) {
        console.error('❌ Error checking existing opens:', existingError);
      } else if (existingOpens && existingOpens.length > 0) {
        console.log('📧 DUPLICATE OPEN - This email was already opened (deduplication)');
        console.log('✅ Returning pixel without recording duplicate');
      } else {
        console.log('🆕 UNIQUE OPEN - Recording first open for this email send');
        
        const openRecord = {
          send_id: sendId,
          campaign_id: campaignId,
          subscriber_id: subscriberId,
          ip_address: ip,
          user_agent: userAgent,
          opened_at: new Date().toISOString()
        };

        console.log('🔥 Insert record:', openRecord);

        const { data: insertData, error: insertError } = await supabase
          .from('email_opens')
          .insert(openRecord)
          .select();

        console.log('🔥 Insert result:', { insertData, insertError });

        if (insertError) {
          console.error('🔥 INSERT ERROR:', JSON.stringify(insertError, null, 2));
        } else {
          console.log('🔥 SUCCESS - UNIQUE EMAIL OPEN RECORDED!');
          
          // Update campaign stats (only for unique opens)
          console.log('🔥 Updating campaign stats...');
          
          const { data: currentCampaign } = await supabase
            .from('email_campaigns')
            .select('emails_opened')
            .eq('id', campaignId)
            .single();
            
          const newCount = (currentCampaign?.emails_opened || 0) + 1;
          
          const { error: updateError } = await supabase
            .from('email_campaigns')
            .update({ emails_opened: newCount })
            .eq('id', campaignId);
            
          console.log('🔥 Stats update:', { newCount, updateError });
        }
      }
    }

    // Always return pixel
    const pixel = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
      'base64'
    );

    return new NextResponse(pixel, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

  } catch (error) {
    console.error('🔥 CRITICAL ERROR:', error);
    
    // Return pixel even on error
    const pixel = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
      'base64'
    );

    return new NextResponse(pixel, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });
  }
} 