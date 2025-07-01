require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function debugApiDetailed() {
  console.log('🔍 DETAILED API DEBUG - SIMULATING EMAIL CLIENT\n');

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // Get the most recent campaign and send
  const { data: campaign } = await supabase
    .from('email_campaigns')
    .select('*')
    .not('sent_at', 'is', null)
    .order('sent_at', { ascending: false })
    .limit(1)
    .single();

  if (!campaign) {
    console.log('❌ No campaigns found');
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

  console.log(`📧 Campaign: "${campaign.name}" (${campaign.id})`);
  console.log(`📨 Send ID: ${send.id}`);
  console.log(`📅 Sent at: ${send.sent_at}`);

  // Check current opens
  const { data: currentOpens } = await supabase
    .from('email_opens')
    .select('*')
    .eq('send_id', send.id);

  console.log(`📊 Current opens for this send: ${currentOpens?.length || 0}`);

  // Simulate a real email client open
  const trackingUrl = `https://cymasphere.com/api/email-campaigns/track/open?c=${campaign.id}&u=${send.subscriber_id}&s=${send.id}`;
  
  console.log('\n🧪 SIMULATING REAL EMAIL CLIENT OPEN:');
  console.log(`   URL: ${trackingUrl}`);

  // Use realistic email client headers
  const headers = {
    'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    'Accept': 'image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache',
    'Sec-Fetch-Dest': 'image',
    'Sec-Fetch-Mode': 'no-cors',
    'Sec-Fetch-Site': 'cross-site'
  };

  try {
    console.log('📱 Using iPhone Safari headers...');
    const response = await fetch(trackingUrl, { headers });
    
    console.log(`   ✅ Response: ${response.status} ${response.statusText}`);
    console.log(`   📄 Content-Type: ${response.headers.get('content-type')}`);
    
    if (response.status === 200) {
      // Wait for database operations to complete
      console.log('⏳ Waiting 3 seconds for database operations...');
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Check if open was recorded
      const { data: newOpens } = await supabase
        .from('email_opens')
        .select('*')
        .eq('send_id', send.id)
        .order('opened_at', { ascending: false });

      console.log(`📊 Opens after test: ${newOpens?.length || 0}`);
      
      if (newOpens && newOpens.length > currentOpens.length) {
        const latestOpen = newOpens[0];
        console.log('🎉 SUCCESS! New open recorded:');
        console.log(`   📅 Opened at: ${latestOpen.opened_at}`);
        console.log(`   🌐 IP: ${latestOpen.ip_address}`);
        console.log(`   🖥️  User Agent: ${latestOpen.user_agent}`);
        
        // Check campaign stats
        const { data: updatedCampaign } = await supabase
          .from('email_campaigns')
          .select('emails_opened, emails_sent')
          .eq('id', campaign.id)
          .single();
          
        if (updatedCampaign) {
          console.log(`📈 Campaign stats: ${updatedCampaign.emails_opened}/${updatedCampaign.emails_sent} opened`);
        }
      } else {
        console.log('❌ FAILED! No new open was recorded');
        console.log('🔍 Debugging why it failed...');
        
        // Check what the bot detection would return
        const testUA = headers['User-Agent'];
        const testIP = 'unknown'; // This is what it would be in production
        
        console.log('\n🤖 Bot Detection Analysis:');
        console.log(`   User Agent: ${testUA.slice(0, 80)}`);
        console.log(`   IP Address: ${testIP}`);
        
        // Test bot patterns
        const BOT_USER_AGENTS = [
          'bot', 'crawler', 'spider', 'scanner', 'checker', 'monitor', 'curl', 'wget', 'python', 'java', 'manual-test',
          'proofpoint', 'mimecast', 'forcepoint', 'symantec', 'mcafee',
          'Chrome/42.', 'Chrome/41.', 'Chrome/40.', 'Chrome/39.', 'Chrome/38.'
        ];
        
        const isBot = BOT_USER_AGENTS.some(pattern => 
          testUA.toLowerCase().includes(pattern.toLowerCase())
        );
        
        console.log(`   Detected as bot: ${isBot ? '❌ YES' : '✅ NO'}`);
        
        if (isBot) {
          const matchedPattern = BOT_USER_AGENTS.find(pattern => 
            testUA.toLowerCase().includes(pattern.toLowerCase())
          );
          console.log(`   Matched pattern: "${matchedPattern}"`);
        }
        
        // Check timing
        const sentTime = new Date(send.sent_at).getTime();
        const openTime = new Date().getTime();
        const timeDiff = (openTime - sentTime) / 1000;
        console.log(`   Time since sent: ${timeDiff.toFixed(1)} seconds`);
        console.log(`   Too fast (< 0.5s): ${timeDiff < 0.5 ? '❌ YES' : '✅ NO'}`);
      }
    } else {
      console.log(`❌ API returned ${response.status}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

debugApiDetailed().catch(console.error); 