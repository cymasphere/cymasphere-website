require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function debugUndefinedSubscriber() {
  console.log('🔍 DEBUGGING UNDEFINED SUBSCRIBER_ID\n');

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // Get the exact same query the diagnostic used
  const { data: allSends } = await supabase
    .from('email_sends')
    .select('id, campaign_id, email, sent_at')  // ❌ This is missing subscriber_id!
    .order('sent_at', { ascending: false });

  console.log('❌ FOUND THE BUG! The diagnostic query was missing subscriber_id in SELECT');
  console.log('This is why it showed undefined!\n');

  // Get the correct data
  const { data: sendsWithSubscriber } = await supabase
    .from('email_sends')
    .select('id, campaign_id, subscriber_id, email, sent_at')  // ✅ Now includes subscriber_id
    .order('sent_at', { ascending: false })
    .limit(1);

  if (sendsWithSubscriber && sendsWithSubscriber.length > 0) {
    const latestSend = sendsWithSubscriber[0];
    console.log('✅ CORRECT data:');
    console.log(`   Send ID: ${latestSend.id}`);
    console.log(`   Campaign ID: ${latestSend.campaign_id}`);
    console.log(`   Subscriber ID: ${latestSend.subscriber_id}`);
    console.log(`   Email: ${latestSend.email}`);

    // Build correct tracking URL
    const trackingUrl = `https://cymasphere.com/api/email-campaigns/track/open?c=${latestSend.campaign_id}&u=${latestSend.subscriber_id}&s=${latestSend.id}`;
    console.log(`\n🎯 CORRECT tracking URL: ${trackingUrl}`);

    // Test the corrected URL
    console.log('\n🧪 Testing corrected tracking URL...');
    
    try {
      const response = await fetch(trackingUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'image/*'
        }
      });
      
      console.log(`📡 Response: ${response.status} ${response.statusText}`);
      
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Check if opens increased
      const { data: campaign } = await supabase
        .from('email_campaigns')
        .select('emails_opened')
        .eq('id', latestSend.campaign_id)
        .single();
      
      console.log(`📊 Campaign opens: ${campaign?.emails_opened || 0}`);
      
      // Check email_opens table
      const { data: opens } = await supabase
        .from('email_opens')
        .select('*')
        .eq('send_id', latestSend.id);
      
      console.log(`📊 Direct opens for this send: ${opens?.length || 0}`);
      
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }
  }

  // Check if there's a subscriber record missing
  console.log('\n🔍 Checking subscriber records...');
  const { data: allSubscribers } = await supabase
    .from('subscribers')
    .select('id, email, name');

  console.log(`📊 Total subscribers: ${allSubscribers?.length || 0}`);
  if (allSubscribers && allSubscribers.length > 0) {
    console.log('📋 Subscribers:');
    allSubscribers.forEach((sub, i) => {
      console.log(`   ${i + 1}. ${sub.email} (${sub.name}) - ID: ${sub.id}`);
    });
  }
}

debugUndefinedSubscriber().catch(console.error); 