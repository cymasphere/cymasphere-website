import { NextRequest, NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  console.log('🔥 FIXED BOT DETECTION - ALLOW GMAIL');
  
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
      console.log('✅ Recording legitimate email open...');
      
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
        console.log('🔥 SUCCESS - EMAIL OPEN RECORDED!');
        
        // Update campaign stats
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