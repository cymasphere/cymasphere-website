require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function analyzeRecordedOpen() {
  console.log('🔍 ANALYZING THE RECORDED OPEN - WHY DID GMAIL TEST WORK?\n');

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // Get the latest email send
  const { data: sends } = await supabase
    .from('email_sends')
    .select('*')
    .order('sent_at', { ascending: false })
    .limit(1);

  const latestSend = sends[0];
  console.log(`📧 Latest send: ${latestSend.email} at ${latestSend.sent_at}`);

  // Get ALL opens for this send
  const { data: opens } = await supabase
    .from('email_opens')
    .select('*')
    .eq('send_id', latestSend.id)
    .order('opened_at', { ascending: false});

  console.log(`\n📊 Total opens for this send: ${opens?.length || 0}\n`);

  if (!opens || opens.length === 0) {
    console.log('❌ No opens found - something changed since the last test');
    return;
  }

  // Analyze each open
  opens.forEach((open, i) => {
    console.log(`${i + 1}. OPEN ANALYSIS:`);
    console.log(`   🕒 Opened at: ${open.opened_at}`);
    console.log(`   🌐 IP Address: ${open.ip_address || 'None'}`);
    console.log(`   🖥️ User Agent: ${open.user_agent || 'None'}`);
    console.log(`   📧 Send ID: ${open.send_id}`);
    console.log(`   📋 Campaign ID: ${open.campaign_id}`);
    console.log(`   👤 Subscriber ID: ${open.subscriber_id}`);
    console.log('');

    // Analyze user agent
    if (open.user_agent) {
      const ua = open.user_agent.toLowerCase();
      
      console.log('   🔍 User Agent Analysis:');
      if (ua.includes('googleimageproxy')) {
        console.log('   ✅ This is a Gmail Image Proxy request');
      } else if (ua.includes('chrome') || ua.includes('safari') || ua.includes('firefox')) {
        console.log('   ✅ This appears to be a real browser');
      } else if (ua.includes('curl') || ua.includes('fetch') || ua.includes('node')) {
        console.log('   🤖 This appears to be an automated request');
      } else {
        console.log('   ❓ Unknown user agent type');
      }
    }

    // Analyze IP
    if (open.ip_address) {
      console.log(`   🌐 IP Analysis: ${open.ip_address}`);
      if (open.ip_address.startsWith('74.125') || open.ip_address.startsWith('66.249')) {
        console.log('   ✅ This is a Google IP address (Gmail proxy)');
      } else if (open.ip_address.includes('DEV-TEST')) {
        console.log('   🧪 This is a development test');
      } else {
        console.log('   🏠 This appears to be a regular user IP');
      }
    }
    console.log('');
  });

  // Check campaign stats
  const { data: campaign } = await supabase
    .from('email_campaigns')
    .select('emails_opened, emails_sent')
    .eq('id', latestSend.campaign_id)
    .single();

  console.log('📈 CAMPAIGN STATS:');
  console.log(`   Emails sent: ${campaign?.emails_sent || 0}`);
  console.log(`   Emails opened: ${campaign?.emails_opened || 0}`);

  // Test the tracking URL one more time to see what happens
  console.log('\n🧪 TESTING TRACKING URL AGAIN WITH DIFFERENT USER AGENTS...\n');

  const trackingUrl = `https://cymasphere.com/api/email-campaigns/track/open?c=${latestSend.campaign_id}&u=900f11b8-c901-49fd-bfab-5fafe984ce72&s=${latestSend.id}`;

  const testCases = [
    {
      name: 'Real Gmail User (what you should use)',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        'Sec-Fetch-Site': 'cross-site',
        'Sec-Fetch-Mode': 'no-cors',
        'Referer': 'https://mail.google.com/'
      }
    },
    {
      name: 'Gmail Image Proxy (working)',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; GoogleImageProxy)',
        'X-Forwarded-For': '74.125.224.72',
        'Accept': 'image/*'
      }
    },
    {
      name: 'Simple Browser Request',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'image/*'
      }
    }
  ];

  for (const test of testCases) {
    console.log(`\n   Testing: ${test.name}`);
    
    try {
      const response = await fetch(trackingUrl, {
        headers: test.headers
      });

      console.log(`   Response: ${response.status} ${response.statusText}`);
      
      if (response.status === 200) {
        console.log(`   ✅ Request succeeded`);
      } else {
        const errorText = await response.text();
        console.log(`   ❌ Request failed: ${errorText.substring(0, 100)}`);
      }

    } catch (error) {
      console.log(`   💥 Request error: ${error.message}`);
    }

    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Final check - how many opens now?
  await new Promise(resolve => setTimeout(resolve, 3000));

  const { data: finalOpens } = await supabase
    .from('email_opens')
    .select('*')
    .eq('send_id', latestSend.id);

  console.log(`\n📊 FINAL OPEN COUNT: ${finalOpens?.length || 0}`);

  console.log('\n🎯 CONCLUSION:');
  if ((finalOpens?.length || 0) > (opens?.length || 0)) {
    console.log('✅ Additional opens recorded during testing!');
    console.log('💡 The tracking system IS working - Gmail just has specific requirements');
  } else {
    console.log('❌ No new opens recorded');
    console.log('💡 There may be deduplication or bot detection preventing multiple opens');
  }

  console.log('\n💡 FOR REAL GMAIL TESTING:');
  console.log('1. Clear your browser cache');
  console.log('2. Open Gmail in incognito mode');
  console.log('3. Open the email and click "Display images"');
  console.log('4. Wait 10 seconds');
  console.log('5. Check if open count increased');
}

analyzeRecordedOpen().catch(console.error); 