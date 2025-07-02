require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function testTrackingWithLogs() {
  console.log('🔍 TESTING TRACKING WITH DETAILED ANALYSIS\n');

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
  console.log('📧 Latest send ID:', latestSend.id);
  console.log('📧 Campaign ID:', latestSend.campaign_id);

  // Try multiple different approaches to trigger tracking
  const testCases = [
    {
      name: 'Real Gmail User Agent',
      headers: {
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36',
        'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
        'Referer': 'https://mail.google.com/',
        'Accept-Language': 'en-US,en;q=0.9',
      }
    },
    {
      name: 'iPhone Mail App',
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
        'Accept': 'image/*',
        'Accept-Language': 'en-us',
      }
    },
    {
      name: 'Outlook Web App',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36 Edg/111.0.1661.62',
        'Accept': 'image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        'Referer': 'https://outlook.live.com/',
      }
    },
    {
      name: 'Disable Bot Detection (if possible)',
      headers: {
        'User-Agent': 'Real-Human-Gmail-User/2024',
        'Accept': 'image/*',
        'X-Real-Human': 'true',
        'X-Disable-Bot-Detection': 'true'
      }
    }
  ];

  // Get current campaign stats
  const { data: campaignBefore } = await supabase
    .from('email_campaigns')
    .select('emails_opened')
    .eq('id', latestSend.campaign_id)
    .single();
  
  console.log(`📊 Current opens: ${campaignBefore?.emails_opened || 0}\n`);

  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    console.log(`${i + 1}. Testing: ${testCase.name}`);
    
    const trackingUrl = `https://cymasphere.com/api/email-campaigns/track/open?c=${latestSend.campaign_id}&u=${latestSend.subscriber_id}&s=${latestSend.id}`;
    
    try {
      // Add a small delay between each request
      if (i > 0) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
      const response = await fetch(trackingUrl, {
        method: 'GET',
        headers: testCase.headers
      });
      
      console.log(`   📡 Response: ${response.status} ${response.statusText}`);
      
      // Wait for potential database update
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Check if opens increased
      const { data: campaignAfter } = await supabase
        .from('email_campaigns')
        .select('emails_opened')
        .eq('id', latestSend.campaign_id)
        .single();
      
      const newOpens = campaignAfter?.emails_opened || 0;
      const increased = newOpens > (campaignBefore?.emails_opened || 0);
      
      console.log(`   📊 Opens: ${newOpens} ${increased ? '✅ INCREASED!' : '❌ No change'}`);
      
      if (increased) {
        console.log(`   🎉 SUCCESS! ${testCase.name} worked!`);
        
        // Check what was actually recorded
        const { data: latestOpen } = await supabase
          .from('email_opens')
          .select('*')
          .eq('send_id', latestSend.id)
          .order('opened_at', { ascending: false })
          .limit(1);
        
        if (latestOpen && latestOpen.length > 0) {
          console.log(`   📝 Recorded: ${latestOpen[0].user_agent?.substring(0, 50)}...`);
        }
        
        // Stop testing once we find one that works
        break;
      }
      
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
  }

  // Check if ANY opens exist for this send in the database
  console.log('\n🔍 Checking email_opens table directly...');
  const { data: allOpens } = await supabase
    .from('email_opens')
    .select('*')
    .eq('send_id', latestSend.id);

  console.log(`📊 Total opens in database for this send: ${allOpens?.length || 0}`);

  if (allOpens && allOpens.length > 0) {
    console.log('📝 Opens found:');
    allOpens.forEach((open, i) => {
      console.log(`   ${i + 1}. ${open.opened_at} - ${open.user_agent?.substring(0, 40)}... (${open.ip_address})`);
    });
  }

  // Final recommendations
  console.log('\n💡 NEXT STEPS:');
  if ((campaignBefore?.emails_opened || 0) === 0) {
    console.log('❌ Tracking API is still not working');
    console.log('🔧 Possible issues:');
    console.log('   1. Production deployment not updated');
    console.log('   2. Bot detection too aggressive');
    console.log('   3. Different database error');
    console.log('   4. Need to check production server logs');
    console.log('\n📧 For Gmail test:');
    console.log('   1. Send a NEW email from the dashboard');
    console.log('   2. Use the latest fixed code');
    console.log('   3. Try opening on mobile Gmail app');
  } else {
    console.log('✅ Tracking is working!');
    console.log('📧 Gmail should now work - try clicking "Display images"');
  }
}

testTrackingWithLogs().catch(console.error); 