require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function monitorDeployment() {
  console.log('🚀 MONITORING DEPLOYMENT - Waiting for nuclear tracking to go live...\n');

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  let attempt = 1;
  const maxAttempts = 20;
  
  while (attempt <= maxAttempts) {
    console.log(`🔍 Attempt ${attempt}/${maxAttempts} - Testing production API...`);
    
    try {
      // Get current open count
      const { data: opensBefore } = await supabase
        .from('email_opens')
        .select('id')
        .eq('campaign_id', '06b60a0e-44b3-46e4-a7ac-f47251171101');
      
      const countBefore = opensBefore?.length || 0;
      console.log(`   Opens before: ${countBefore}`);
      
      // Hit the production API with unique user agent
      const testUrl = `https://cymasphere.com/api/email-campaigns/track/open?c=06b60a0e-44b3-46e4-a7ac-f47251171101&u=900f11b8-c901-49fd-bfab-5fafe984ce72&s=25a33bbb-8f79-4fd3-84dc-b2b0eedd58ad`;
      
      const response = await fetch(testUrl, {
        headers: {
          'User-Agent': `Nuclear-Test-${attempt}-${Date.now()}`
        }
      });
      
      console.log(`   API Response: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        // Wait a moment for database write
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Check if new open was recorded
        const { data: opensAfter } = await supabase
          .from('email_opens')
          .select('id, user_agent')
          .eq('campaign_id', '06b60a0e-44b3-46e4-a7ac-f47251171101')
          .order('opened_at', { ascending: false });
        
        const countAfter = opensAfter?.length || 0;
        console.log(`   Opens after: ${countAfter}`);
        
        if (countAfter > countBefore) {
          console.log('\n🎉🎉🎉 NUCLEAR DEPLOYMENT IS LIVE! 🎉🎉🎉');
          console.log('✅ Production API is now recording opens!');
          console.log('🎯 Gmail tracking will now work when you click "Display external images"');
          console.log('\nLatest opens:');
          opensAfter.slice(0, 3).forEach((open, i) => {
            console.log(`   ${i+1}. ${open.user_agent}`);
          });
          return;
        } else {
          console.log('   ❌ Still using old code (no new opens recorded)');
        }
      } else {
        console.log('   ❌ API error');
      }
      
    } catch (error) {
      console.log(`   ❌ Test failed: ${error.message}`);
    }
    
    if (attempt < maxAttempts) {
      console.log('   ⏳ Waiting 30 seconds before next test...\n');
      await new Promise(resolve => setTimeout(resolve, 30000));
    }
    
    attempt++;
  }
  
  console.log('\n⏰ Deployment monitoring complete');
  console.log('If nuclear tracking still not working, there may be a caching issue');
}

monitorDeployment().catch(console.error); 