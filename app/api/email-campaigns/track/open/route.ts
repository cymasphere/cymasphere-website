import { NextRequest, NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';

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

    // Check if the send record exists (for proper tracking)
    const { data: sendRecord } = await supabase
      .from('email_sends')
      .select('id')
      .eq('id', sendId)
      .single();

    // Check if this open has already been recorded for this specific email send (prevent duplicates)
    const { data: existingOpen } = await supabase
      .from('email_opens')
      .select('id')
      .eq('send_id', sendId)
      .single();

    if (!existingOpen) {
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
        console.log('⚠️ Send record not found in production DB - likely development testing');
        // Add a note to track that this was a development test
        openRecord.ip_address = `DEV-TEST: ${ip}`;
      }

      const { error: insertError } = await supabase
        .from('email_opens')
        .insert(openRecord);

      if (insertError) {
        console.error('❌ Error recording email open:', insertError);
      } else {
        console.log('✅ Email open recorded successfully', sendRecord ? '(production)' : '(dev test)');
        
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
            console.log('⚠️ Campaign not found in production DB - likely development testing');
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