require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function testComprehensiveDebug() {
  console.log('🔬 COMPREHENSIVE TRACKING DEBUG - STEP BY STEP REPLICATION\n');

  // Step 1: Setup exactly like production API
  console.log('1️⃣ Setting up Supabase client (service role)...');
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // Step 2: Get campaign and send like production
  console.log('2️⃣ Getting campaign and send data...');
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
  console.log(`📨 Send: ${send.id} -> ${send.email}`);

  // Step 3: Simulate URL parameters like production API gets
  console.log('3️⃣ Simulating URL parameters...');
  const sendId = send.id;
  const campaignId = campaign.id;
  const subscriberId = send.subscriber_id;

  console.log('   Parameters:', { sendId, campaignId, subscriberId });

  // Step 4: Validate UUIDs like production
  console.log('4️⃣ Validating UUIDs...');
  function isValidUUID(uuid) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }

  const validations = {
    sendId: isValidUUID(sendId),
    campaignId: isValidUUID(campaignId),
    subscriberId: isValidUUID(subscriberId)
  };
  console.log('   Validations:', validations);

  if (!validations.sendId || !validations.campaignId || !validations.subscriberId) {
    console.log('❌ UUID validation failed!');
    return;
  }

  // Step 5: Check send record exists like production
  console.log('5️⃣ Checking send record exists...');
  const { data: sendRecord, error: sendError } = await supabase
    .from('email_sends')
    .select('id, sent_at')
    .eq('id', sendId)
    .single();

  if (sendError) {
    console.log('❌ Error getting send record:', sendError);
    return;
  }

  console.log('   Send record found:', sendRecord ? 'YES' : 'NO');
  console.log('   Sent at:', sendRecord?.sent_at);

  // Step 6: Check for existing opens like production
  console.log('6️⃣ Checking for existing opens...');
  const { data: existingOpen, error: existingError } = await supabase
    .from('email_opens')
    .select('id')
    .eq('send_id', sendId)
    .single();

  console.log('   Existing open found:', existingOpen ? 'YES' : 'NO');
  console.log('   Query error (expected if no existing):', existingError?.message || 'NONE');

  if (existingOpen) {
    console.log('ℹ️ Open already exists, this would be skipped in production');
    console.log('   But let\'s continue anyway for testing...');
  }

  // Step 7: Create open record exactly like production
  console.log('7️⃣ Creating open record exactly like production API...');
  
  const openRecord = {
    send_id: sendId,
    campaign_id: campaignId,
    subscriber_id: subscriberId,
    ip_address: 'unknown', // This is what production sees
    user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    opened_at: new Date().toISOString()
  };

  console.log('   Record to insert:', JSON.stringify(openRecord, null, 2));

  // Step 8: Try the insert with detailed error handling
  console.log('8️⃣ Attempting database insert...');
  
  try {
    const { data: insertResult, error: insertError } = await supabase
      .from('email_opens')
      .insert(openRecord);

    if (insertError) {
      console.log('❌ INSERT FAILED!');
      console.log('   Error code:', insertError.code);
      console.log('   Error message:', insertError.message);
      console.log('   Error details:', insertError.details);
      console.log('   Error hint:', insertError.hint);
      console.log('   Full error:', JSON.stringify(insertError, null, 2));
    } else {
      console.log('✅ INSERT SUCCESS!');
      console.log('   Insert result:', insertResult);

      // Step 9: Verify the record was actually inserted
      console.log('9️⃣ Verifying record was inserted...');
      const { data: verification } = await supabase
        .from('email_opens')
        .select('*')
        .eq('send_id', sendId)
        .order('opened_at', { ascending: false });

      console.log(`   Opens found for send: ${verification?.length || 0}`);
      if (verification && verification.length > 0) {
        console.log('   Latest open:', verification[0]);
      }

      // Step 10: Check campaign stats update
      console.log('🔟 Checking if campaign stats need updating...');
      const { data: currentCampaign } = await supabase
        .from('email_campaigns')
        .select('emails_opened')
        .eq('id', campaignId)
        .single();

      console.log(`   Current campaign opens: ${currentCampaign?.emails_opened || 0}`);
    }

  } catch (exception) {
    console.log('❌ EXCEPTION THROWN!');
    console.log('   Exception type:', exception.constructor.name);
    console.log('   Exception message:', exception.message);
    console.log('   Exception stack:', exception.stack);
  }

  console.log('\n🏁 Comprehensive debug complete!');
}

testComprehensiveDebug().catch(error => {
  console.error('💥 SCRIPT CRASHED:', error);
  console.error('Stack trace:', error.stack);
}); 