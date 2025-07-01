require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function debugProductionAPI() {
  console.log('🔬 DEBUGGING PRODUCTION API EXACT FLOW\n');

  // Use the EXACT same client setup as production API
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  console.log('✅ Supabase client created with service role key');

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

  console.log(`📧 Campaign: "${campaign.name}"`);
  console.log(`📨 Send ID: ${send.id}`);

  const sendId = send.id;
  const campaignId = campaign.id;
  const subscriberId = send.subscriber_id;

  // STEP 1: Validate UUIDs (exact same as production)
  console.log('\n1️⃣ Validating UUIDs...');
  function isValidUUID(uuid) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }

  if (!isValidUUID(sendId) || !isValidUUID(campaignId) || !isValidUUID(subscriberId)) {
    console.log('❌ UUID validation failed');
    return;
  }
  console.log('✅ UUIDs valid');

  // STEP 2: Check send record exists (exact same as production)
  console.log('\n2️⃣ Checking send record...');
  const { data: sendRecord } = await supabase
    .from('email_sends')
    .select('id, sent_at')
    .eq('id', sendId)
    .single();

  if (!sendRecord) {
    console.log('❌ Send record not found');
    return;
  }
  console.log('✅ Send record found:', sendRecord.sent_at);

  // STEP 3: Check existing opens (exact same as production)
  console.log('\n3️⃣ Checking existing opens...');
  const { data: existingOpen, error: existingError } = await supabase
    .from('email_opens')
    .select('id')
    .eq('send_id', sendId)
    .single();

  console.log('Existing open result:', { 
    found: !!existingOpen, 
    error: existingError?.message || 'none' 
  });

  // STEP 4: Create the EXACT open record as production would
  console.log('\n4️⃣ Creating open record (exact same as production)...');
  
  const openRecord = {
    send_id: sendId,
    campaign_id: campaignId,
    subscriber_id: subscriberId,
    ip_address: null, // This is what production should use now
    user_agent: 'DEBUG-PRODUCTION-TEST-' + Date.now(),
    opened_at: new Date().toISOString()
  };

  console.log('Record to insert:', JSON.stringify(openRecord, null, 2));

  // STEP 5: Attempt the insert with full error details
  console.log('\n5️⃣ Attempting database insert...');
  
  try {
    const insertResult = await supabase
      .from('email_opens')
      .insert(openRecord);

    console.log('Insert result:', JSON.stringify(insertResult, null, 2));

    if (insertResult.error) {
      console.log('❌ INSERT FAILED WITH ERROR:');
      console.log('   Code:', insertResult.error.code);
      console.log('   Message:', insertResult.error.message);
      console.log('   Details:', insertResult.error.details);
      console.log('   Hint:', insertResult.error.hint);
      console.log('   Full error:', JSON.stringify(insertResult.error, null, 2));
    } else {
      console.log('✅ INSERT APPEARED TO SUCCEED');
      
      // Verify it was actually inserted
      console.log('\n6️⃣ Verifying insert...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const { data: verification } = await supabase
        .from('email_opens')
        .select('*')
        .eq('send_id', sendId)
        .order('opened_at', { ascending: false });

      console.log(`Verification: ${verification?.length || 0} opens found`);
      if (verification && verification.length > 0) {
        verification.forEach((open, i) => {
          console.log(`   ${i+1}. ${open.opened_at} - ${open.user_agent?.slice(0, 30)}`);
        });
      }
    }

  } catch (exception) {
    console.log('❌ EXCEPTION DURING INSERT:');
    console.log('   Type:', exception.constructor.name);
    console.log('   Message:', exception.message);
    console.log('   Stack:', exception.stack);
  }

  // STEP 6: Test campaign stats update
  console.log('\n7️⃣ Testing campaign stats update...');
  try {
    const { data: currentCampaign } = await supabase
      .from('email_campaigns')
      .select('emails_opened')
      .eq('id', campaignId)
      .single();

    if (currentCampaign) {
      const newCount = (currentCampaign.emails_opened || 0) + 1;
      const { error: updateError } = await supabase
        .from('email_campaigns')
        .update({ emails_opened: newCount })
        .eq('id', campaignId);

      if (updateError) {
        console.log('❌ Campaign stats update failed:', updateError.message);
      } else {
        console.log('✅ Campaign stats update succeeded');
      }
    }
  } catch (error) {
    console.log('❌ Campaign stats update exception:', error.message);
  }

  console.log('\n🏁 PRODUCTION API DEBUG COMPLETE');
}

debugProductionAPI().catch(error => {
  console.error('💥 SCRIPT CRASHED:', error);
  console.error('Stack:', error.stack);
}); 