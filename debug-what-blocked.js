require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function debugWhatBlocked() {
  console.log('🔍 TESTING TRACKING WITH REAL BROWSER USER AGENT\n');

  // Test with a real browser user agent
  const realUserAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36';
  
  // Get the most recent campaign
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { data: campaign } = await supabase
    .from('email_campaigns')
    .select('*')
    .not('sent_at', 'is', null)
    .order('sent_at', { ascending: false })
    .limit(1)
    .single();

  if (!campaign) {
    console.log('❌ No recent campaigns found');
    return;
  }

  console.log(`📧 Testing tracking for campaign: "${campaign.name}"`);
  console.log(`   Campaign ID: ${campaign.id}`);

  // Get a send record for this campaign
  const { data: send } = await supabase
    .from('email_sends')
    .select('*')
    .eq('campaign_id', campaign.id)
    .limit(1)
    .single();

  if (!send) {
    console.log('❌ No send records found for this campaign');
    return;
  }

  console.log(`📨 Using send ID: ${send.id}`);
  console.log(`   Email: ${send.email}`);

  // Construct tracking URL
  const trackingUrl = `https://cymasphere.com/api/email-campaigns/track/open?c=${campaign.id}&u=${send.subscriber_id}&s=${send.id}`;
  console.log(`🔗 Tracking URL: ${trackingUrl}`);

  // Test the tracking endpoint with a real browser user agent
  console.log('\n🧪 TESTING WITH REAL BROWSER USER AGENT:');
  console.log(`   User Agent: ${realUserAgent}`);

  try {
    const response = await fetch(trackingUrl, {
      headers: {
        'User-Agent': realUserAgent,
        'Accept': 'image/*,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Cache-Control': 'no-cache'
      }
    });

    console.log(`   Status: ${response.status}`);
    console.log(`   Content-Type: ${response.headers.get('content-type')}`);

    if (response.status === 200) {
      console.log('   ✅ Tracking endpoint responded with PNG');
      
      // Wait a moment then check if open was recorded
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const { data: opens } = await supabase
        .from('email_opens')
        .select('*')
        .eq('send_id', send.id)
        .order('opened_at', { ascending: false });

      console.log(`   📊 Opens recorded: ${opens?.length || 0}`);
      
      if (opens && opens.length > 0) {
        console.log('   🎉 SUCCESS! Open was recorded');
        const latestOpen = opens[0];
        console.log(`      Opened at: ${latestOpen.opened_at}`);
        console.log(`      IP: ${latestOpen.ip_address}`);
        console.log(`      User Agent: ${latestOpen.user_agent}`);
      } else {
        console.log('   ❌ FAILED! No open was recorded despite 200 response');
        console.log('   This means bot detection is blocking the real browser');
      }
    } else {
      console.log(`   ❌ Tracking endpoint failed with status ${response.status}`);
    }

  } catch (error) {
    console.error('❌ Error testing tracking:', error.message);
  }

  // Test bot detection logic manually
  console.log('\n🤖 MANUAL BOT DETECTION TEST:');
  
  // Simulate the bot detection function
  const BOT_USER_AGENTS = [
    'bot', 'crawler', 'spider', 'scanner', 'checker', 'monitor', 'curl', 'wget', 'python', 'java', 'manual-test',
    'proofpoint', 'mimecast', 'forcepoint', 'symantec', 'mcafee',
    'Chrome/42.', 'Chrome/41.', 'Chrome/40.', 'Chrome/39.', 'Chrome/38.'
  ];

  const isBot = BOT_USER_AGENTS.some(pattern => 
    realUserAgent.toLowerCase().includes(pattern.toLowerCase())
  );

  console.log(`   Real browser detected as bot: ${isBot ? '❌ YES (BAD)' : '✅ NO (GOOD)'}`);
  
  if (isBot) {
    const matchedPattern = BOT_USER_AGENTS.find(pattern => 
      realUserAgent.toLowerCase().includes(pattern.toLowerCase())
    );
    console.log(`   ❌ Bot pattern that matched: "${matchedPattern}"`);
  }
}

debugWhatBlocked().catch(console.error); 