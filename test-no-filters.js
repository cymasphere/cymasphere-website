require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function testNoFilters() {
  console.log('🚨 TESTING WITH ALL FILTERS DISABLED\n');

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // Get the "4444" campaign
  const { data: campaign } = await supabase
    .from('email_campaigns')
    .select('*')
    .eq('name', '4444')
    .single();

  const { data: send } = await supabase
    .from('email_sends')
    .select('*')
    .eq('campaign_id', campaign.id)
    .single();

  console.log(`📧 Testing: "${campaign.name}" (${campaign.id})`);
  console.log(`📨 Send ID: ${send.id}`);

  // Count existing opens
  const { data: beforeOpens } = await supabase
    .from('email_opens')
    .select('*')
    .eq('send_id', send.id);

  console.log(`📊 Opens before test: ${beforeOpens?.length || 0}`);

  // Test the tracking URL
  const trackingUrl = `https://cymasphere.com/api/email-campaigns/track/open?c=${campaign.id}&u=${send.subscriber_id}&s=${send.id}`;
  
  console.log('🔗 Testing tracking URL...');
  console.log(`   ${trackingUrl}`);

  try {
    const response = await fetch(trackingUrl, {
      headers: {
        'User-Agent': 'TEST-NO-FILTERS-' + Date.now(),
        'Accept': 'image/*'
      }
    });

    console.log(`📡 Response: ${response.status} (${response.headers.get('content-type')})`);

    if (response.status === 200) {
      console.log('⏳ Waiting for database operations...');
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Check for new opens
      const { data: afterOpens } = await supabase
        .from('email_opens')
        .select('*')
        .eq('send_id', send.id)
        .order('opened_at', { ascending: false });

      console.log(`📊 Opens after test: ${afterOpens?.length || 0}`);

      if (afterOpens && afterOpens.length > (beforeOpens?.length || 0)) {
        console.log('🎉 SUCCESS! New open was recorded with ALL filters disabled');
        const latestOpen = afterOpens[0];
        console.log(`   📅 Opened at: ${latestOpen.opened_at}`);
        console.log(`   🌐 IP: ${latestOpen.ip_address || 'null'}`);
        console.log(`   🖥️  User Agent: ${latestOpen.user_agent}`);

        // Check campaign stats
        const { data: updatedCampaign } = await supabase
          .from('email_campaigns')
          .select('emails_opened, emails_sent')
          .eq('id', campaign.id)
          .single();

        console.log(`📈 Campaign stats: ${updatedCampaign?.emails_opened}/${updatedCampaign?.emails_sent} opened`);

      } else {
        console.log('❌ STILL NOT WORKING even with all filters disabled!');
        console.log('\n🔍 This means there\'s a deeper issue:');
        console.log('   1. Check production server logs for errors');
        console.log('   2. Database permissions issue');
        console.log('   3. API route not being hit properly');
        console.log('   4. Something else is blocking the insert');
        
        console.log('\n📋 All opens for this send:');
        if (afterOpens && afterOpens.length > 0) {
          afterOpens.forEach((open, i) => {
            console.log(`   ${i+1}. ${new Date(open.opened_at).toLocaleString()} - ${open.user_agent?.slice(0, 50)}`);
          });
        } else {
          console.log('   (none)');
        }
      }
    } else {
      console.log(`❌ API returned ${response.status}`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }

  console.log('\n🎯 NEXT STEPS:');
  console.log('1. Now try opening the actual email in your email client');
  console.log('2. Make sure to enable external images');
  console.log('3. Wait a few seconds and check if it gets recorded');
  console.log('4. If it still doesn\'t work, there\'s a fundamental issue beyond filtering');
}

testNoFilters().catch(console.error); 