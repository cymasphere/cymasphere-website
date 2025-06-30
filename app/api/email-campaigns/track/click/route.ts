import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/utils/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sendId = searchParams.get('s');
    const campaignId = searchParams.get('c');
    const subscriberId = searchParams.get('u');
    const originalUrl = searchParams.get('url');

    console.log('🔗 Email click tracking:', { sendId, campaignId, subscriberId, originalUrl });

    if (!sendId || !campaignId || !subscriberId || !originalUrl) {
      console.log('❌ Missing required tracking parameters');
      // Redirect to fallback URL or homepage if original URL is missing
      return NextResponse.redirect(originalUrl || process.env.NEXT_PUBLIC_SITE_URL || 'https://cymasphere.com');
    }

    const supabase = await createSupabaseServer();
    
    // Get IP address and user agent
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown';
    const userAgent = request.headers.get('user-agent') || '';

    // Decode the original URL
    const decodedUrl = decodeURIComponent(originalUrl);

    try {
      // Record the click event
      const { error: insertError } = await supabase
        .from('email_clicks')
        .insert({
          send_id: sendId,
          campaign_id: campaignId,
          subscriber_id: subscriberId,
          url: decodedUrl,
          ip_address: ip,
          user_agent: userAgent,
          clicked_at: new Date().toISOString()
        });

      if (insertError) {
        console.error('❌ Error recording email click:', insertError);
      } else {
        console.log('✅ Email click recorded successfully');
        
        // Update campaign statistics
        try {
          const { data: currentCampaign } = await supabase
            .from('email_campaigns')
            .select('emails_clicked')
            .eq('id', campaignId)
            .single();
            
          if (currentCampaign) {
            await supabase
              .from('email_campaigns')
              .update({ emails_clicked: (currentCampaign.emails_clicked || 0) + 1 })
              .eq('id', campaignId);
              
            console.log('📊 Updated campaign click count');
          }
        } catch (statsError) {
          console.error('❌ Error updating campaign stats:', statsError);
        }
      }
    } catch (dbError) {
      console.error('❌ Database error recording click:', dbError);
    }

    // Always redirect to the original URL
    return NextResponse.redirect(decodedUrl);

  } catch (error) {
    console.error('❌ Error in click tracking:', error);
    
    // Try to redirect to original URL or fallback
    const { searchParams } = new URL(request.url);
    const originalUrl = searchParams.get('url');
    const fallbackUrl = originalUrl ? decodeURIComponent(originalUrl) : (process.env.NEXT_PUBLIC_SITE_URL || 'https://cymasphere.com');
    
    return NextResponse.redirect(fallbackUrl);
  }
} 