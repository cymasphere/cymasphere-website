require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function quickTrackingFixTest() {
  console.log('🚀 QUICK TEST: FIXED TRACKING PIXEL\n');

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // Get the existing campaign
  const { data: campaigns } = await supabase
    .from('email_campaigns')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1);

  const campaign = campaigns[0];
  console.log(`📧 Using existing campaign: ${campaign.name}`);

  // Update the campaign subject so we can tell it apart
  const { error: updateError } = await supabase
    .from('email_campaigns')
    .update({ 
      subject: '🔧 FIXED Tracking Test - Try Again!',
      name: 'FIXED Tracking Test'
    })
    .eq('id', campaign.id);

  if (updateError) {
    console.log('⚠️ Could not update campaign, but continuing...');
  } else {
    console.log('✅ Updated campaign subject');
  }

  // Send the campaign (it will now use the fixed tracking pixel code)
  console.log('\n📤 Sending with FIXED tracking pixel...');
  
  try {
    const response = await fetch('https://cymasphere.com/api/email-campaigns/send', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        campaignId: campaign.id,
        testEmail: 'ryan@cymasphere.com'
      })
    });

    const result = await response.text();
    console.log(`Response: ${response.status} ${response.statusText}`);
    console.log(`Body: ${result.substring(0, 200)}...`);

    if (response.ok) {
      console.log('\n🎉 FIXED TRACKING EMAIL SENT!');
      
      // Wait for send to process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Get the latest send record
      const { data: sends } = await supabase
        .from('email_sends')
        .select('*')
        .eq('campaign_id', campaign.id)
        .order('sent_at', { ascending: false })
        .limit(1);

      if (sends && sends.length > 0) {
        const latestSend = sends[0];
        console.log(`\n📧 Latest send: ${latestSend.email} at ${latestSend.sent_at}`);
        console.log(`📬 Send ID: ${latestSend.id}`);
        
        // Get updated campaign to check HTML content
        const { data: updatedCampaign } = await supabase
          .from('email_campaigns')
          .select('html_content')
          .eq('id', campaign.id)
          .single();

        if (updatedCampaign) {
          console.log('\n🔍 TRACKING PIXEL ANALYSIS:');
          if (updatedCampaign.html_content.includes('display:block')) {
            console.log('✅ NEW EMAIL USES display:block (GOOD!)');
          } else if (updatedCampaign.html_content.includes('display:none')) {
            console.log('❌ Still uses display:none (deployment not updated yet)');
          } else {
            console.log('⚠️ No display style found');
          }
          
          // Extract tracking URL
          const trackingMatch = updatedCampaign.html_content.match(/src="([^"]*\/api\/email-campaigns\/track\/open[^"]*)"/);
          if (trackingMatch) {
            console.log(`\n🎯 Tracking URL: ${trackingMatch[1]}`);
          }
        }
        
        console.log('\n🧪 NOW TEST IN GMAIL:');
        console.log('1. Look for "FIXED Tracking Test - Try Again!" in Gmail');
        console.log('2. Click "Display external images"');
        console.log('3. Wait 10 seconds');
        console.log('4. Check if opens increased:');
        console.log(`   Campaign ID: ${campaign.id}`);
        
        // Simple check command
        console.log('\n📊 To check opens quickly:');
        console.log(`curl -s https://cymasphere.com/api/email-campaigns/${campaign.id} | grep -o '"emails_opened":[0-9]*'`);
      }
      
    } else {
      console.log('\n❌ Send failed - trying simpler approach');
      
      console.log('\n💡 MANUAL FIX VERIFICATION:');
      console.log('The key fix was changing display:none to display:block in:');
      console.log('  • utils/email-tracking.ts');
      console.log('  • app/api/email-campaigns/send/route.ts');
      console.log('');
      console.log('If production deployment updated, new emails should work!');
    }

  } catch (error) {
    console.log('\n❌ Error:', error.message);
  }
}

quickTrackingFixTest().catch(console.error); 