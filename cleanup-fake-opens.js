const { createClient } = require('@supabase/supabase-js');

async function cleanupFakeOpens() {
  console.log('🧹 CLEANING UP FAKE OPENS FROM TESTING\n');

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // Find opens that should have been filtered (localhost IPs and old Chrome versions)
  const { data: fakeOpens } = await supabase
    .from('email_opens')
    .select('*')
    .or('ip_address.cs.::ffff:127.0.0.1,ip_address.cs.127.0.0.1,user_agent.ilike.%chrome/42%,user_agent.ilike.%chrome/41%,user_agent.ilike.%chrome/40%,user_agent.ilike.%chrome/39%,user_agent.ilike.%chrome/38%');

  if (fakeOpens && fakeOpens.length > 0) {
    console.log(`Found ${fakeOpens.length} fake opens to remove:`);
    
    fakeOpens.forEach((open, i) => {
      console.log(`${i+1}. IP: ${open.ip_address}, UA: ${open.user_agent?.slice(0, 50)}`);
    });

    // Delete the fake opens
    const { error } = await supabase
      .from('email_opens')
      .delete()
      .or('ip_address.cs.::ffff:127.0.0.1,ip_address.cs.127.0.0.1,user_agent.ilike.%chrome/42%,user_agent.ilike.%chrome/41%,user_agent.ilike.%chrome/40%,user_agent.ilike.%chrome/39%,user_agent.ilike.%chrome/38%');

    if (error) {
      console.error('❌ Error deleting fake opens:', error);
    } else {
      console.log('✅ Fake opens cleaned up');
      
      // Also update campaign stats if needed
      for (const open of fakeOpens) {
        const { data: campaign } = await supabase
          .from('email_campaigns')
          .select('emails_opened')
          .eq('id', open.campaign_id)
          .single();
          
        if (campaign && campaign.emails_opened > 0) {
          await supabase
            .from('email_campaigns')
            .update({ emails_opened: Math.max(0, campaign.emails_opened - 1) })
            .eq('id', open.campaign_id);
          console.log(`📊 Updated campaign ${open.campaign_id} open count`);
        }
      }
    }
  } else {
    console.log('No fake opens found to clean up');
  }
}

cleanupFakeOpens().catch(console.error); 