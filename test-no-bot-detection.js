require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function testNoBotDetection() {
  console.log('🚫 TESTING WITH BOT DETECTION DISABLED\n');

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
  
  console.log('🎯 Testing tracking URL (no bot detection)');

  // Get current stats
  const { data: campaignBefore } = await supabase
    .from('email_campaigns')
    .select('emails_opened')
    .eq('id', latestSend.campaign_id)
    .single();
  
  console.log(`📊 Opens before: ${campaignBefore?.emails_opened || 0}`);

  // Test with obvious bot user agent that would normally be blocked
  const response = await fetch(trackingUrl, {
    method: 'GET',
    headers: {
      'User-Agent': 'curl/7.68.0' // This would normally be blocked
    }
  });
  
  console.log(`📡 Response: ${response.status} ${response.statusText}`);
  
  // Wait for database update
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // Check if opens increased
  const { data: campaignAfter } = await supabase
    .from('email_campaigns')
    .select('emails_opened')
    .eq('id', latestSend.campaign_id)
    .single();
  
  const newOpens = campaignAfter?.emails_opened || 0;
  const increased = newOpens > (campaignBefore?.emails_opened || 0);
  
  console.log(`📊 Opens after: ${newOpens}`);
  
  if (increased) {
    console.log('🎉 SUCCESS! Bot detection was the issue!');
    console.log('💡 Now Gmail tracking should work - bot detection was too aggressive');
  } else {
    console.log('❌ Still not working - issue is not bot detection');
    console.log('🔧 Likely issues:');
    console.log('   1. Production deployment not updated yet');
    console.log('   2. Database permission/RLS issue');  
    console.log('   3. Another error in the API');
  }
}

testNoBotDetection().catch(console.error); 