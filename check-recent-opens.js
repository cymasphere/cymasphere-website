const { createClient } = require('@supabase/supabase-js');

async function checkRecentOpens() {
  console.log('🔍 CHECKING WHAT IS HITTING TRACKING ENDPOINT\n');

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // Get recent opens (last 30 minutes)
  const recentTime = new Date(Date.now() - 30 * 60 * 1000).toISOString();
  
  const { data: opens } = await supabase
    .from('email_opens')
    .select('*')
    .gte('opened_at', recentTime)
    .order('opened_at', { ascending: false });

  console.log(`👀 Found ${opens?.length || 0} opens in last 30 minutes:\n`);

  if (opens && opens.length > 0) {
    opens.forEach((open, i) => {
      console.log(`${i+1}. Opened: ${open.opened_at}`);
      console.log(`   IP: ${open.ip_address}`);
      console.log(`   User Agent: ${open.user_agent || 'Unknown'}`);
      console.log(`   Campaign: ${open.campaign_id}`);
      
      // Analyze if this looks like a bot
      const userAgent = open.user_agent || '';
      const isLikelyBot = userAgent.toLowerCase().includes('bot') || 
                         userAgent.toLowerCase().includes('crawler') ||
                         userAgent.toLowerCase().includes('scanner') ||
                         userAgent.toLowerCase().includes('security') ||
                         userAgent.toLowerCase().includes('proofpoint') ||
                         userAgent.toLowerCase().includes('mimecast');
      
      console.log(`   🤖 Looks like bot: ${isLikelyBot ? 'YES' : 'NO'}`);
      console.log('');
    });

    console.log('📊 ANALYSIS:');
    const botLikeOpens = opens.filter(open => {
      const ua = (open.user_agent || '').toLowerCase();
      return ua.includes('bot') || ua.includes('crawler') || ua.includes('scanner') || 
             ua.includes('security') || ua.includes('proofpoint') || ua.includes('mimecast');
    });
    
    console.log(`   Total opens: ${opens.length}`);
    console.log(`   Bot-like opens: ${botLikeOpens.length}`);
    console.log(`   Likely human opens: ${opens.length - botLikeOpens.length}`);
    
    if (botLikeOpens.length > 0) {
      console.log('\n🚨 THESE LOOK LIKE AUTOMATED OPENS:');
      botLikeOpens.forEach(open => {
        console.log(`   - ${open.user_agent}`);
      });
      console.log('\n💡 These should be filtered out by bot detection');
    }
  } else {
    console.log('No recent opens found');
  }
}

checkRecentOpens().catch(console.error); 