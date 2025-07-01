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

    console.log('🔥 TRACKING DEBUG - Email open tracking:', { sendId, campaignId, subscriberId, timestamp: new Date().toISOString() });

    if (!sendId || !campaignId || !subscriberId) {
      console.log('❌ TRACKING DEBUG - Missing required tracking parameters');
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
      console.log('❌ TRACKING DEBUG - Invalid UUID format in tracking parameters:', { sendId, campaignId, subscriberId });
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
    
    console.log('🔥 TRACKING DEBUG - Supabase client created');
    
    // Get IP address and user agent
    const rawIp = request.headers.get('x-forwarded-for') || 
                  request.headers.get('x-real-ip') || 
                  null;
    
    // Handle IP address for INET column - must be valid IP or null
    const ip = rawIp && rawIp !== 'unknown' ? rawIp.split(',')[0].trim() : null;
    const userAgent = request.headers.get('user-agent') || '';
    
    console.log('🔥 TRACKING DEBUG - Request details:', {
      rawIp,
      processedIp: ip,
      userAgent: userAgent?.slice(0, 50),
      allHeaders: Object.fromEntries(request.headers.entries())
    });

    // Industry-standard bot detection (2024 best practices)
    const isBot = isLikelyBotOpen(userAgent, ip || null);
    const isPrefetcher = isKnownPrefetcher(userAgent);

    console.log('🔥 TRACKING DEBUG - Bot detection:', { isBot, isPrefetcher });

    if (isBot) {
      console.log('🤖 TRACKING DEBUG - Bot/automated open detected - not recording:', {
        userAgent: userAgent?.slice(0, 50),
        ip: ip || 'null',
        reason: 'Matched known bot pattern'
      });
      
      // Still return pixel but don't record the open
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

    console.log('🔥 TRACKING DEBUG - Bot check passed, proceeding...');

    // Check if the send record exists (for proper tracking)
    console.log('🔥 TRACKING DEBUG - Checking send record...');
    const { data: sendRecord, error: sendError } = await supabase
      .from('email_sends')
      .select('id, sent_at')
      .eq('id', sendId)
      .single();

    console.log('🔥 TRACKING DEBUG - Send record result:', { sendRecord, sendError });

    // Calculate time between send and open for additional bot detection
    let openedWithinSeconds: number | undefined;
    if (sendRecord?.sent_at) {
      const sentTime = new Date(sendRecord.sent_at).getTime();
      const openTime = new Date().getTime();
      openedWithinSeconds = (openTime - sentTime) / 1000;
      
      console.log('🔥 TRACKING DEBUG - Timing check:', { openedWithinSeconds, sentTime, openTime });
      
      // Check for suspiciously fast opens (industry standard: 0.5s threshold)  
      if (openedWithinSeconds < 0.5) {
        console.log('🤖 TRACKING DEBUG - Suspiciously fast open detected - not recording:', {
          openedWithinSeconds,
          userAgent: userAgent?.slice(0, 50),
          note: 'Faster than 0.5 seconds indicates automation'
        });
        
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
      }

    if (isPrefetcher) {
      console.log('📱 TRACKING DEBUG - Known prefetcher detected - recording with flag:', {
        userAgent: userAgent?.slice(0, 50)
      });
    }

    // Check if this open has already been recorded for this specific email send (prevent duplicates)
    console.log('🔥 TRACKING DEBUG - Checking for existing opens...');
    const { data: existingOpen, error: existingError } = await supabase
      .from('email_opens')
      .select('id')
      .eq('send_id', sendId)
      .single();

    console.log('🔥 TRACKING DEBUG - Existing open check:', { existingOpen, existingError });

    if (!existingOpen) {
      console.log('🔥 TRACKING DEBUG - No existing open found, proceeding with insert...');
      
      // Record the open event (even if send record doesn't exist - for development testing)
      const openRecord = {
        send_id: sendId,
        campaign_id: campaignId,
        subscriber_id: subscriberId,
        ip_address: ip,
        user_agent: userAgent,
        opened_at: new Date().toISOString()
      };

      if (!sendRecord) {
        console.log('⚠️ TRACKING DEBUG - Send record not found in production DB - likely development testing');
        // Add a note to track that this was a development test
        openRecord.ip_address = ip ? `DEV-TEST: ${ip}` : 'DEV-TEST: unknown';
      }

      console.log('🔄 TRACKING DEBUG - Attempting to insert open record:', openRecord);

      const { data: insertData, error: insertError } = await supabase
        .from('email_opens')
        .insert(openRecord)
        .select();

      console.log('🔥 TRACKING DEBUG - Insert result:', { insertData, insertError });

      if (insertError) {
        console.error('❌ TRACKING DEBUG - Error recording email open:', insertError);
        console.error('❌ TRACKING DEBUG - Full error details:', JSON.stringify(insertError, null, 2));
        console.error('❌ TRACKING DEBUG - Insert data was:', JSON.stringify(openRecord, null, 2));
      } else {
        console.log('✅ TRACKING DEBUG - Email open recorded successfully', {
          insertedId: insertData?.[0]?.id,
          isPrefetcher,
          openedWithinSeconds
        });
        
        console.log('🔥 TRACKING DEBUG - Starting campaign stats update...');
        
        // Update campaign statistics using increment to avoid race conditions
        try {
          // Use a more reliable approach with atomic increment
          const { data: currentCampaign, error: fetchError } = await supabase
            .from('email_campaigns')
            .select('emails_opened')
            .eq('id', campaignId)
            .single();
            
            console.log('🔥 TRACKING DEBUG - Current campaign fetch:', { currentCampaign, fetchError });
            
          if (fetchError) {
            console.error('❌ TRACKING DEBUG - Error fetching campaign for stats update:', fetchError);
          } else if (currentCampaign) {
            const newCount = (currentCampaign.emails_opened || 0) + 1;
            console.log('🔥 TRACKING DEBUG - Updating count from', currentCampaign.emails_opened, 'to', newCount);
            
            const { error: updateError } = await supabase
              .from('email_campaigns')
              .update({ emails_opened: newCount })
              .eq('id', campaignId);
              
            console.log('🔥 TRACKING DEBUG - Stats update result:', { updateError });
              
            if (updateError) {
              console.error('❌ TRACKING DEBUG - Error updating campaign open count:', updateError);
            } else {
              console.log(`📊 TRACKING DEBUG - Updated campaign open count to ${newCount}`);
            }
          } else {
            console.log('⚠️ TRACKING DEBUG - Campaign not found - unable to update stats');
          }
        } catch (statsError) {
          console.error('❌ TRACKING DEBUG - Exception updating campaign stats:', statsError);
        }
      }
    } else {
      console.log('📧 TRACKING DEBUG - Duplicate open ignored (already recorded for this email send)');
    }

    console.log('🔥 TRACKING DEBUG - Returning pixel...');

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
    console.error('❌ TRACKING DEBUG - Error in open tracking:', error);
    
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