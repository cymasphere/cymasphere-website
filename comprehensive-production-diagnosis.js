require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function comprehensiveProductionDiagnosis() {
  console.log('🔬 COMPREHENSIVE PRODUCTION TRACKING DIAGNOSIS\n');

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  console.log('📊 STEP 1: DATABASE STATE ANALYSIS');
  console.log('=====================================\n');

  // Check total campaigns
  const { data: allCampaigns } = await supabase
    .from('email_campaigns')
    .select('id, name, status, emails_sent, emails_opened, created_at')
    .order('created_at', { ascending: false });

  console.log(`📧 Total campaigns: ${allCampaigns?.length || 0}`);
  
  if (allCampaigns && allCampaigns.length > 0) {
    console.log('\n📋 Recent campaigns:');
    allCampaigns.slice(0, 5).forEach((campaign, i) => {
      console.log(`${i + 1}. ${campaign.name} (${campaign.status}) - Sent: ${campaign.emails_sent || 0}, Opens: ${campaign.emails_opened || 0}`);
    });
  }

  // Check total sends
  const { data: allSends } = await supabase
    .from('email_sends')
    .select('id, campaign_id, email, sent_at')
    .order('sent_at', { ascending: false });

  console.log(`\n📤 Total email sends: ${allSends?.length || 0}`);
  
  if (allSends && allSends.length > 0) {
    console.log('\n📋 Recent sends:');
    allSends.slice(0, 5).forEach((send, i) => {
      console.log(`${i + 1}. ${send.email} - ${send.sent_at} (Campaign: ${send.campaign_id})`);
    });
  }

  // Check total opens
  const { data: allOpens } = await supabase
    .from('email_opens')
    .select('id, send_id, campaign_id, opened_at, user_agent, ip_address')
    .order('opened_at', { ascending: false });

  console.log(`\n👁️ Total email opens: ${allOpens?.length || 0}`);
  
  if (allOpens && allOpens.length > 0) {
    console.log('\n📋 Recent opens:');
    allOpens.slice(0, 3).forEach((open, i) => {
      console.log(`${i + 1}. ${open.opened_at} - ${open.user_agent?.substring(0, 40)}... (IP: ${open.ip_address})`);
    });
  }

  console.log('\n🔍 STEP 2: TRACKING API ANALYSIS');
  console.log('=================================\n');

  if (allSends && allSends.length > 0) {
    const latestSend = allSends[0];
    console.log(`🎯 Testing latest send: ${latestSend.email}`);
    console.log(`📧 Send ID: ${latestSend.id}`);
    console.log(`📬 Campaign ID: ${latestSend.campaign_id}`);

    // Get campaign data
    const { data: campaign } = await supabase
      .from('email_campaigns')
      .select('*')
      .eq('id', latestSend.campaign_id)
      .single();

    console.log(`\n📄 Campaign: ${campaign?.name}`);
    console.log(`📊 Current opens: ${campaign?.emails_opened || 0}`);

    // Check if tracking pixel is in the HTML
    if (campaign?.html_content) {
      const hasTrackingPixel = campaign.html_content.includes('/api/email-campaigns/track/open');
      const hasDisplayBlock = campaign.html_content.includes('display:block');
      const hasDisplayNone = campaign.html_content.includes('display:none');
      
      console.log(`\n🖼️ HTML Analysis:`);
      console.log(`   Has tracking pixel: ${hasTrackingPixel ? '✅' : '❌'}`);
      console.log(`   Uses display:block: ${hasDisplayBlock ? '✅' : '❌'}`);
      console.log(`   Uses display:none: ${hasDisplayNone ? '❌ BAD' : '✅'}`);
    }

    // Test tracking API with detailed logging
    const trackingUrl = `https://cymasphere.com/api/email-campaigns/track/open?c=${latestSend.campaign_id}&u=${latestSend.subscriber_id}&s=${latestSend.id}`;
    
    console.log(`\n🧪 Testing tracking API...`);
    console.log(`🎯 URL: ${trackingUrl}`);

    try {
      // Test 1: Simple fetch
      console.log('\n🔸 Test 1: Simple fetch');
      const response1 = await fetch(trackingUrl);
      console.log(`   Status: ${response1.status} ${response1.statusText}`);
      console.log(`   Content-Type: ${response1.headers.get('content-type')}`);

      // Test 2: With real browser headers
      console.log('\n🔸 Test 2: Real browser headers');
      const response2 = await fetch(trackingUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Referer': 'https://mail.google.com/'
        }
      });
      console.log(`   Status: ${response2.status} ${response2.statusText}`);

      // Wait for potential database updates
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Check for new opens
      const { data: newOpens } = await supabase
        .from('email_opens')
        .select('*')
        .eq('send_id', latestSend.id)
        .order('opened_at', { ascending: false });

      console.log(`\n📊 Opens for this send: ${newOpens?.length || 0}`);
      
      if (newOpens && newOpens.length > 0) {
        console.log('📝 Found opens:');
        newOpens.forEach((open, i) => {
          console.log(`   ${i + 1}. ${open.opened_at} - ${open.user_agent?.substring(0, 50)}...`);
        });
      }

      // Check campaign stats update
      const { data: updatedCampaign } = await supabase
        .from('email_campaigns')
        .select('emails_opened')
        .eq('id', latestSend.campaign_id)
        .single();

      console.log(`📊 Campaign opens after test: ${updatedCampaign?.emails_opened || 0}`);

    } catch (error) {
      console.log(`❌ API test failed: ${error.message}`);
    }
  }

  console.log('\n🔍 STEP 3: GMAIL-SPECIFIC DIAGNOSIS');
  console.log('====================================\n');

  console.log('📧 Gmail tracking checklist:');
  console.log('□ Email sent with latest code (has display:block pixel)');
  console.log('□ Email opened in Gmail');
  console.log('□ "Display external images" clicked');
  console.log('□ Email not in Spam/Promotions folder');
  console.log('□ Not using corporate/filtered email');
  console.log('□ Gmail Image Proxy enabled');

  console.log('\n💡 RECOMMENDATIONS:');
  console.log('====================\n');

  if (!allSends || allSends.length === 0) {
    console.log('❌ No emails sent - send a test campaign first');
  } else if (!allOpens || allOpens.length === 0) {
    console.log('❌ No opens recorded - tracking API has issues');
    console.log('🔧 Likely causes:');
    console.log('   1. Production code not updated');
    console.log('   2. Database permissions issue');
    console.log('   3. Bot detection blocking all requests');
    console.log('   4. API throwing unhandled errors');
  } else {
    console.log('✅ Tracking system is working');
    console.log('🎯 Gmail issue likely:');
    console.log('   1. Email has old tracking pixel (display:none)');
    console.log('   2. Gmail not loading external images');
    console.log('   3. Email in wrong folder');
    console.log('   4. Need to send NEW email with fixed code');
  }

  console.log('\n🚀 NEXT ACTIONS:');
  console.log('================\n');
  console.log('1. Send a BRAND NEW campaign from dashboard');
  console.log('2. Use simple subject like "Test Tracking Fix"');
  console.log('3. Add basic text content');
  console.log('4. Send immediately (not scheduled)');
  console.log('5. Check Gmail Primary inbox');
  console.log('6. Click "Display external images"');
  console.log('7. Wait 30 seconds');
  console.log('8. Check campaign opens in dashboard');
}

comprehensiveProductionDiagnosis().catch(console.error); 