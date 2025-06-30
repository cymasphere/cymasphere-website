import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/utils/supabase/server";

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

    const supabase = await createSupabaseServer();
    
    // Get IP address and user agent
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown';
    const userAgent = request.headers.get('user-agent') || '';

    // Check if this open has already been recorded recently (prevent duplicates)
    const { data: existingOpen } = await supabase
      .from('email_opens')
      .select('id')
      .eq('send_id', sendId)
      .eq('subscriber_id', subscriberId)
      .gte('opened_at', new Date(Date.now() - 5 * 60 * 1000).toISOString()) // Within last 5 minutes
      .single();

    if (!existingOpen) {
      // Record the open event
      const { error: insertError } = await supabase
        .from('email_opens')
        .insert({
          send_id: sendId,
          campaign_id: campaignId,
          subscriber_id: subscriberId,
          ip_address: ip,
          user_agent: userAgent,
          opened_at: new Date().toISOString()
        });

      if (insertError) {
        console.error('❌ Error recording email open:', insertError);
      } else {
        console.log('✅ Email open recorded successfully');
        
        // Update campaign statistics
        try {
          const { data: currentCampaign } = await supabase
            .from('email_campaigns')
            .select('emails_opened')
            .eq('id', campaignId)
            .single();
            
          if (currentCampaign) {
            await supabase
              .from('email_campaigns')
              .update({ emails_opened: (currentCampaign.emails_opened || 0) + 1 })
              .eq('id', campaignId);
              
            console.log('📊 Updated campaign open count');
          }
        } catch (statsError) {
          console.error('❌ Error updating campaign stats:', statsError);
        }
      }
    } else {
      console.log('📧 Duplicate open ignored (within 5 minutes)');
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