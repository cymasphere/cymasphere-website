const { createClient } = require('@supabase/supabase-js');

async function checkTrackingAfterTest() {
  console.log('🔍 CHECKING IF TRACKING TEST CREATED OPEN RECORD\n');

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const campaignId = '424c9fdf-082c-433b-a873-1ea7f08c8a86'; // QQQQ campaign
  const sendId = '54833238-4c49-46c2-9a25-24bc8fd8c2a1';

  // Check opens for this specific send in the last few minutes
  const recentTime = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  
  const { data: opens, error: opensError } = await supabase
    .from('email_opens')
    .select('*')
    .eq('send_id', sendId)
    .gte('opened_at', recentTime)
    .order('opened_at', { ascending: false });

  if (opensError) {
    console.error('❌ Error checking opens:', opensError);
    return;
  }

  console.log(`📧 Campaign: ${campaignId}`);
  console.log(`📨 Send ID: ${sendId}`);
  console.log(`⏰ Checking opens since: ${recentTime}`);
  console.log(`👀 Opens found: ${opens?.length || 0}\n`);

  if (opens && opens.length > 0) {
    console.log('🎉 TRACKING IS WORKING!');
    opens.forEach((open, i) => {
      console.log(`${i+1}. Opened at: ${open.opened_at}`);
      console.log(`   IP: ${open.ip_address}`);
      console.log(`   User Agent: ${open.user_agent}`);
      console.log('');
    });
  } else {
    console.log('❌ NO OPENS RECORDED');
    console.log('   The tracking API returned a PNG but did not create database record');
    console.log('   Possible issues:');
    console.log('   - Bot detection filtering out curl requests');
    console.log('   - Database insert failing silently');
    console.log('   - RLS policy blocking insert');
    console.log('   - Send ID not found in email_sends table');
  }

  // Check if the send record exists
  const { data: send } = await supabase
    .from('email_sends')
    .select('*')
    .eq('id', sendId)
    .single();

  if (send) {
    console.log('✅ Send record exists:');
    console.log(`   Campaign: ${send.campaign_id}`);
    console.log(`   Email: ${send.email}`);
    console.log(`   Status: ${send.status}`);
  } else {
    console.log('❌ Send record NOT FOUND - this would prevent tracking');
  }

  // Check all opens for this campaign
  const { data: allOpens } = await supabase
    .from('email_opens')
    .select('*')
    .eq('campaign_id', campaignId);

  console.log(`\n📊 Total opens for campaign: ${allOpens?.length || 0}`);
}

checkTrackingAfterTest().catch(console.error); 