import { NextRequest, NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sendId = searchParams.get('s');
    const campaignId = searchParams.get('c');
    const subscriberId = searchParams.get('u');
    const targetUrl = searchParams.get('url');

    console.log('🔗 Email click tracking:', { sendId, campaignId, subscriberId, targetUrl });

    if (!sendId || !campaignId || !subscriberId || !targetUrl) {
      console.log('❌ Missing required tracking parameters');
      // Redirect to a safe fallback if URL is missing
      const fallbackUrl = targetUrl || 'https://cymasphere.com';
      return NextResponse.redirect(fallbackUrl);
    }

    // Use service role client for anonymous tracking click access
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

    // Check if this click has already been recorded for this specific email send and URL (prevent duplicates)
    const { data: existingClick } = await supabase
      .from('email_clicks')
      .select('id')
      .eq('send_id', sendId)
      .eq('url', targetUrl)
      .single();

    if (!existingClick) {
      // Record the click event (even if send record doesn't exist - for development testing)
      const clickRecord = {
        send_id: sendId,
        campaign_id: campaignId,
        subscriber_id: subscriberId,
        url: targetUrl,
        ip_address: ip,
        user_agent: userAgent,
        clicked_at: new Date().toISOString()
      };

      if (!sendRecord) {
        console.log('⚠️ Send record not found in production DB - likely development testing');
        // Add a note to track that this was a development test
        clickRecord.ip_address = `DEV-TEST: ${ip}`;
      }

      const { error: insertError } = await supabase
        .from('email_clicks')
        .insert(clickRecord);

      if (insertError) {
        console.error('❌ Error recording email click:', insertError);
      } else {
        console.log('✅ Email click recorded successfully', sendRecord ? '(production)' : '(dev test)');
        
        // Update campaign statistics
        try {
          // Count unique clickers for this campaign (industry standard)
          const { data: uniqueClickers, error: countError } = await supabase
            .from('email_clicks')
            .select('send_id')
            .eq('campaign_id', campaignId);
            
          if (countError) {
            console.error('❌ Error counting unique clickers:', countError);
          } else {
            // Count unique send_ids to get unique click rate
            const uniqueSendIds = new Set(uniqueClickers?.map(c => c.send_id) || []);
            const uniqueClickCount = uniqueSendIds.size;
            
            const { error: updateError } = await supabase
              .from('email_campaigns')
              .update({ emails_clicked: uniqueClickCount })
              .eq('id', campaignId);
              
            if (updateError) {
              console.error('❌ Error updating campaign click count:', updateError);
            } else {
              console.log(`📊 Updated campaign unique click count to ${uniqueClickCount}`);
            }
          }
        } catch (statsError) {
          console.error('❌ Exception updating campaign stats:', statsError);
        }
      }
    } else {
      console.log('🔗 Duplicate click ignored (already recorded for this email send and URL)');
    }

    // Always redirect to the target URL
    return NextResponse.redirect(targetUrl);

  } catch (error) {
    console.error('❌ Error in click tracking:', error);
    
    // Redirect to target URL even on error, or fallback
    const targetUrl = new URL(request.url).searchParams.get('url') || 'https://cymasphere.com';
    return NextResponse.redirect(targetUrl);
  }
} 