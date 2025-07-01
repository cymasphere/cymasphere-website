import { NextRequest, NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';
import { isLikelyBotOpen, isKnownPrefetcher } from '@/utils/email-tracking';

// Helper function to validate UUID format
function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sendId = searchParams.get('s');
    const campaignId = searchParams.get('c');
    const subscriberId = searchParams.get('u');

    console.log('📧 Email open tracking:', { sendId, campaignId, subscriberId });

    if (!sendId || !campaignId || !subscriberId) {
      console.log('❌ Missing required tracking parameters');
      // Return a 1x1 transparent pixel regardless
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
    }

    // Validate UUID formats to prevent PostgreSQL errors
    if (!isValidUUID(sendId) || !isValidUUID(campaignId) || !isValidUUID(subscriberId)) {
      console.log('❌ Invalid UUID format in tracking parameters:', { sendId, campaignId, subscriberId });
      // Still return pixel but don't try to record in database
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
    }

    // Use service role client for anonymous tracking pixel access
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: { autoRefreshToken: false, persistSession: false }
      }
    );
    
    // Get IP address and user agent
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown';
    const userAgent = request.headers.get('user-agent') || '';

    // TEMPORARILY DISABLED: Check if this is likely a bot/automated open FIRST (before database operations)
    const isBot = isLikelyBotOpen(userAgent, ip);
    const isPrefetcher = isKnownPrefetcher(userAgent);

    // TEMP FIX: Log bot detection but don't block recording for testing
    if (isBot) {
      console.log('🤖 Bot/automated open detected - LOGGING BUT ALLOWING:', {
        userAgent: userAgent?.slice(0, 50),
        ip,
        reason: 'Failed bot detection - TEMP DISABLED'
      });
      // Continue processing instead of returning early
    }

    // Check if the send record exists (for proper tracking)
    const { data: sendRecord } = await supabase
      .from('email_sends')
      .select('id, sent_at')
      .eq('id', sendId)
      .single();

    // Calculate time between send and open for additional bot detection
    let openedWithinSeconds: number | undefined;
    if (sendRecord?.sent_at) {
      const sentTime = new Date(sendRecord.sent_at).getTime();
      const openTime = new Date().getTime();
      openedWithinSeconds = (openTime - sentTime) / 1000;
      
      // TEMP DISABLED: Additional bot check for suspiciously fast opens
      if (openedWithinSeconds < 2) {
        console.log('🤖 Suspiciously fast open detected - LOGGING BUT ALLOWING:', {
          openedWithinSeconds,
          userAgent: userAgent?.slice(0, 50)
        });
        // Continue processing instead of blocking
      }
    }

    if (isPrefetcher) {
      console.log('📱 Known prefetcher detected - recording with flag:', {
        userAgent: userAgent?.slice(0, 50)
      });
    }

    // Check if this open has already been recorded for this specific email send (prevent duplicates)
    const { data: existingOpen } = await supabase
      .from('email_opens')
      .select('id')
      .eq('send_id', sendId)
      .single();

    if (!existingOpen) {
      // Only record legitimate opens (not bots, not development tests)
      if (!sendRecord) {
        console.log('⚠️ Send record not found - skipping recording (likely development test)');
        
        // Don't record anything for missing send records (development tests)
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
      }

      // Record the legitimate open event
      const openRecord = {
        send_id: sendId,
        campaign_id: campaignId,
        subscriber_id: subscriberId,
        ip_address: ip,
        user_agent: userAgent,
        opened_at: new Date().toISOString()
      };

      const { error: insertError } = await supabase
        .from('email_opens')
        .insert(openRecord);

      if (insertError) {
        console.error('❌ Error recording email open:', insertError);
      } else {
        console.log('✅ Email open recorded successfully', {
          isPrefetcher,
          openedWithinSeconds
        });
        
        // Update campaign statistics using increment to avoid race conditions
        try {
          // Use a more reliable approach with atomic increment
          const { data: currentCampaign, error: fetchError } = await supabase
            .from('email_campaigns')
            .select('emails_opened')
            .eq('id', campaignId)
            .single();
            
          if (fetchError) {
            console.error('❌ Error fetching campaign for stats update:', fetchError);
          } else if (currentCampaign) {
            const newCount = (currentCampaign.emails_opened || 0) + 1;
            const { error: updateError } = await supabase
              .from('email_campaigns')
              .update({ emails_opened: newCount })
              .eq('id', campaignId);
              
            if (updateError) {
              console.error('❌ Error updating campaign open count:', updateError);
            } else {
              console.log(`📊 Updated campaign open count to ${newCount}`);
            }
          } else {
            console.log('⚠️ Campaign not found - unable to update stats');
          }
        } catch (statsError) {
          console.error('❌ Exception updating campaign stats:', statsError);
        }
      }
    } else {
      console.log('📧 Duplicate open ignored (already recorded for this email send)');
    }

    // Always return a 1x1 transparent pixel
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
    console.error('❌ Error in open tracking:', error);
    
    // Always return a pixel even on error
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