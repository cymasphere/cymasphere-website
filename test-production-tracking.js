require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function testProductionTracking() {
  console.log('🎯 TESTING PRODUCTION TRACKING API DIRECTLY\n');

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // Get the most recent campaign
  const { data: campaign } = await supabase
    .from('email_campaigns')
    .select('*')
    .not('sent_at', 'is', null)
    .order('sent_at', { ascending: false })
    .limit(1)
    .single();

  if (!campaign) {
    console.log('❌ No sent campaigns found');
    return;
  }

  const { data: send } = await supabase
    .from('email_sends')
    .select('*')
    .eq('campaign_id', campaign.id)
    .limit(1)
    .single();

  if (!send) {
    console.log('❌ No send records found');
    return;
  }

  console.log(`📧 Testing campaign: "${campaign.name}"`);
  console.log(`📨 Send ID: ${send.id}`);
  console.log(`📅 Sent at: ${send.sent_at}`);

  // Check current opens before test
  const { data: opensBefore } = await supabase
    .from('email_opens')
    .select('*')
    .eq('send_id', send.id);

  console.log(`📊 Opens before test: ${opensBefore?.length || 0}`);

  // Call the production tracking API directly
  const trackingUrl = `https://cymasphere.com/api/email-campaigns/track/open?c=${campaign.id}&u=${send.subscriber_id}&s=${send.id}`;
  
  console.log('\n🔗 Testing production tracking URL:');
  console.log(`   ${trackingUrl}`);

  try {
    const response = await fetch(trackingUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
        'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });

    console.log(`📡 Response: ${response.status} ${response.statusText}`);
    console.log(`📄 Content-Type: ${response.headers.get('content-type')}`);
    console.log(`📏 Content-Length: ${response.headers.get('content-length')} bytes`);

    if (response.status === 200) {
      console.log('✅ Got PNG response from tracking API');
      
      // Wait for database operation
      console.log('⏳ Waiting 3 seconds for database operations...');
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Check if open was recorded
      const { data: opensAfter } = await supabase
        .from('email_opens')
        .select('*')
        .eq('send_id', send.id)
        .order('opened_at', { ascending: false });

      console.log(`📊 Opens after test: ${opensAfter?.length || 0}`);
      
      if (opensAfter && opensAfter.length > opensBefore.length) {
        console.log('🎉 SUCCESS! New open was recorded:');
        const newOpen = opensAfter[0];
        console.log(`   📅 Opened at: ${newOpen.opened_at}`);
        console.log(`   🌐 IP: ${newOpen.ip_address}`);
        console.log(`   🖥️  User Agent: ${newOpen.user_agent?.slice(0, 60)}...`);
        
        // Check campaign stats
        const { data: updatedCampaign } = await supabase
          .from('email_campaigns')
          .select('emails_opened, emails_sent')
          .eq('id', campaign.id)
          .single();
          
        console.log(`📈 Campaign stats: ${updatedCampaign?.emails_opened}/${updatedCampaign?.emails_sent} opened`);
        
      } else {
        console.log('❌ FAILED! No new open was recorded');
        console.log('\n🔍 TROUBLESHOOTING:');
        console.log('   - Check production server logs for errors');
        console.log('   - Verify the debug logging shows up in production');
        console.log('   - Check if bot detection is too aggressive');
        console.log('   - Verify database permissions for email_opens table');
        
        // Show the exact tracking calls that would be made
        console.log('\n📋 Debug info for tracking:');
        console.log(`   Campaign ID: ${campaign.id}`);
        console.log(`   Subscriber ID: ${send.subscriber_id}`);
        console.log(`   Send ID: ${send.id}`);
        console.log(`   Bot detection would see IP: "unknown" (from production)`);
      }
    } else {
      console.log(`❌ Tracking API returned ${response.status}`);
      const text = await response.text();
      console.log('Response body:', text.slice(0, 200));
    }

  } catch (error) {
    console.error('❌ Error calling tracking API:', error.message);
  }
}

testProductionTracking().catch(console.error); 