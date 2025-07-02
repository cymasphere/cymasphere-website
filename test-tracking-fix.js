require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function testTrackingFix() {
  console.log('🧪 TESTING TRACKING API FIX\n');

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // Get the latest send
  const { data: sends } = await supabase
    .from('email_sends')
    .select('*')
    .order('sent_at', { ascending: false })
    .limit(1);

  const latestSend = sends[0];
  const trackingUrl = `https://cymasphere.com/api/email-campaigns/track/open?c=${latestSend.campaign_id}&u=${latestSend.subscriber_id}&s=${latestSend.id}`;
  
  console.log('📧 Testing latest send:', latestSend.email);
  console.log('🎯 Tracking URL:', trackingUrl);

  // Get current stats
  const { data: campaignBefore } = await supabase
    .from('email_campaigns')
    .select('emails_opened')
    .eq('id', latestSend.campaign_id)
    .single();
  
  console.log(`\n📊 Current opens: ${campaignBefore?.emails_opened || 0}`);

  // Test the fixed tracking API
  console.log('\n🧪 Testing fixed tracking API...');
  
  try {
    const response = await fetch(trackingUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'image/*'
      }
    });
    
    console.log(`📡 Response: ${response.status} ${response.statusText}`);
    console.log(`📄 Content-Type: ${response.headers.get('content-type')}`);
    
    if (response.ok) {
      console.log('✅ Tracking pixel served successfully');
      
      // Wait for database to update
      console.log('\n⏳ Waiting 3 seconds for database update...');
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Check if opens increased
      const { data: campaignAfter } = await supabase
        .from('email_campaigns')
        .select('emails_opened')
        .eq('id', latestSend.campaign_id)
        .single();
      
      const newOpens = campaignAfter?.emails_opened || 0;
      const increased = newOpens > (campaignBefore?.emails_opened || 0);
      
      console.log(`📊 Opens after test: ${newOpens}`);
      
      if (increased) {
        console.log('🎉 SUCCESS! Tracking is now working!');
        
        // Check the email_opens table
        const { data: opensData } = await supabase
          .from('email_opens')
          .select('*')
          .eq('send_id', latestSend.id)
          .order('opened_at', { ascending: false })
          .limit(1);
        
        if (opensData && opensData.length > 0) {
          const latestOpen = opensData[0];
          console.log('\n📝 Latest open record:');
          console.log(`   Opened at: ${latestOpen.opened_at}`);
          console.log(`   User agent: ${latestOpen.user_agent?.substring(0, 60)}...`);
          console.log(`   IP: ${latestOpen.ip_address}`);
        }
        
      } else {
        console.log('❌ Still not working - may need more investigation');
      }
      
    } else {
      console.log('❌ Tracking API returned error');
    }
    
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }

  console.log('\n💡 If this test worked, the Gmail tracking should now work too!');
  console.log('Try opening the email in Gmail and clicking "Display external images"');
}

testTrackingFix().catch(console.error); 