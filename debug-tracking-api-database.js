require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function debugTrackingApiDatabase() {
  console.log('🐛 DEBUGGING WHY TRACKING API ISNT SAVING TO DATABASE\n');

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
  
  console.log('🎯 Testing tracking URL with different user agents...\n');

  const testUserAgents = [
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Mozilla/5.0 (compatible; GoogleImageProxy)',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1'
  ];

  // Get current open count
  const { data: campaignBefore } = await supabase
    .from('email_campaigns')
    .select('emails_opened')
    .eq('id', latestSend.campaign_id)
    .single();
  
  console.log(`📊 Current opens: ${campaignBefore?.emails_opened || 0}\n`);

  for (let i = 0; i < testUserAgents.length; i++) {
    const userAgent = testUserAgents[i];
    console.log(`${i + 1}. Testing with: ${userAgent.substring(0, 60)}...`);
    
    try {
      const response = await fetch(trackingUrl, {
        method: 'GET',
        headers: {
          'User-Agent': userAgent,
          'Accept': 'image/*',
          'Referer': 'https://mail.google.com/'
        }
      });
      
      console.log(`   📡 Response: ${response.status} ${response.statusText}`);
      console.log(`   📄 Content-Type: ${response.headers.get('content-type')}`);
      
      // Wait a moment for database to update
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check if opens increased
      const { data: campaignAfter } = await supabase
        .from('email_campaigns')
        .select('emails_opened')
        .eq('id', latestSend.campaign_id)
        .single();
      
      const newOpens = campaignAfter?.emails_opened || 0;
      const increased = newOpens > (campaignBefore?.emails_opened || 0);
      
      console.log(`   📊 Opens after: ${newOpens} ${increased ? '✅ INCREASED!' : '❌ No change'}`);
      
      if (increased) {
        console.log('   🎉 This user agent works!');
        break; // Stop testing once we find one that works
      }
      
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
    
    console.log('');
  }

  // Check email_opens table directly
  console.log('\n🔍 CHECKING email_opens TABLE...');
  
  const { data: opens, error: opensError } = await supabase
    .from('email_opens')
    .select('*')
    .eq('send_id', latestSend.id)
    .order('opened_at', { ascending: false });

  if (opensError) {
    console.log(`❌ Error querying email_opens: ${opensError.message}`);
  } else {
    console.log(`📊 Found ${opens.length} opens for this send:`);
    opens.forEach((open, i) => {
      console.log(`${i + 1}. ${open.opened_at} - ${open.user_agent?.substring(0, 50)}... (IP: ${open.ip_address})`);
    });
  }

  // Test the tracking API directly with minimal bot detection
  console.log('\n🧪 TESTING API WITH MINIMAL BOT DETECTION...');
  
  try {
    const testUrl = `${trackingUrl}&test=minimal`;
    const response = await fetch(testUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Real-Human-Browser/1.0',
        'Accept': 'image/*',
        'X-Real-IP': '192.168.1.100' // Simulate real home IP
      }
    });
    
    console.log(`📡 Minimal bot detection test: ${response.status}`);
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const { data: campaignFinal } = await supabase
      .from('email_campaigns')
      .select('emails_opened')
      .eq('id', latestSend.campaign_id)
      .single();
    
    console.log(`📊 Final opens: ${campaignFinal?.emails_opened || 0}`);
    
  } catch (error) {
    console.log(`❌ Minimal test error: ${error.message}`);
  }

  console.log('\n💡 RECOMMENDATIONS:');
  console.log('1. Try opening email in Gmail on mobile device');
  console.log('2. Try forwarding email to different email provider');
  console.log('3. Check Spam/Promotions folders');
  console.log('4. Temporarily disable bot detection completely');
}

debugTrackingApiDatabase().catch(console.error); 