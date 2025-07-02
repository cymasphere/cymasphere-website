require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function checkEmailSendsSchema() {
  console.log('🔍 CHECKING EMAIL_SENDS TABLE SCHEMA\n');

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // Get all email sends with all columns
  const { data: sends, error } = await supabase
    .from('email_sends')
    .select('*')
    .order('sent_at', { ascending: false })
    .limit(3);

  if (error) {
    console.log('❌ Error:', error.message);
    return;
  }

  console.log(`📊 Found ${sends.length} email sends`);
  
  if (sends.length > 0) {
    console.log('\n📋 Email sends data:');
    sends.forEach((send, i) => {
      console.log(`\n${i + 1}. Send ID: ${send.id}`);
      console.log(`   Campaign: ${send.campaign_id}`);
      console.log(`   Email: ${send.email}`);
      console.log(`   Sent at: ${send.sent_at}`);
      console.log(`   Subscriber ID: ${send.subscriber_id || 'UNDEFINED!!'}`);
      console.log(`   Status: ${send.status}`);
      
      // Show all available columns
      const columns = Object.keys(send);
      console.log(`   Available columns: ${columns.join(', ')}`);
    });

    // Check if we need to look up subscriber_id differently
    console.log('\n🔍 Looking up subscriber info...');
    
    const latestSend = sends[0];
    console.log(`\n📧 Latest send email: ${latestSend.email}`);
    
    // Try to find subscriber by email
    const { data: subscribers } = await supabase
      .from('subscribers')
      .select('id, email, name')
      .eq('email', latestSend.email);

    if (subscribers && subscribers.length > 0) {
      console.log(`✅ Found subscriber: ${subscribers[0].id} (${subscribers[0].name})`);
      console.log(`❌ But email_sends.subscriber_id is: ${latestSend.subscriber_id || 'NULL/UNDEFINED'}`);
      console.log('\n🔧 FIX NEEDED: email_sends table not storing subscriber_id correctly!');
    } else {
      console.log(`❌ No subscriber found for email: ${latestSend.email}`);
    }
  }
}

checkEmailSendsSchema().catch(console.error); 