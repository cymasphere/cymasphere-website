require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function testFixedTracking() {
  console.log('🧪 TESTING FIXED TRACKING PIXEL (NO MORE display:none!)\n');

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // Create a new campaign with fixed tracking
  console.log('📧 Creating new test campaign...');
  
  const campaign = {
    name: 'Fixed Tracking Test',
    subject: '✅ Gmail Tracking Fix Test',
    html_content: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Gmail Tracking Fix Test</title>
</head>
<body style="font-family: Arial, sans-serif; padding: 20px; background-color: #f4f4f4;">
    <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 8px;">
        <h1 style="color: #333;">✅ Gmail Tracking Fix Test</h1>
        <p style="color: #666; line-height: 1.6;">
            This email has a FIXED tracking pixel that uses <code>display:block</code> instead of <code>display:none</code>.
        </p>
        <p style="color: #666; line-height: 1.6;">
            <strong>Gmail should now load the tracking image!</strong>
        </p>
        <div style="background: #e8f5e8; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 0; color: #2d5a2d; font-size: 14px;">
                🎯 When you click "Display external images" in Gmail, the tracking should work!
            </p>
        </div>
        <p style="color: #999; font-size: 12px;">
            Sent from Cymasphere Email Campaigns - Fixed Tracking Version
        </p>
    </div>
</body>
</html>`,
    text_content: 'Gmail Tracking Fix Test - The tracking pixel should now work properly!',
    status: 'draft',
    audience_type: 'static',
    sender_name: 'Cymasphere Team',
    sender_email: 'noreply@cymasphere.com',
    reply_to_email: 'ryan@cymasphere.com'
  };

  const { data: newCampaign, error: createError } = await supabase
    .from('email_campaigns')
    .insert(campaign)
    .select()
    .single();

  if (createError) {
    console.log('❌ Error creating campaign:', createError.message);
    return;
  }

  console.log('✅ Created campaign:', newCampaign.id);

  // Send the campaign
  console.log('\n📤 Sending fixed tracking campaign...');
  
  try {
    const response = await fetch('https://cymasphere.com/api/email-campaigns/send', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        campaignId: newCampaign.id,
        testEmail: 'ryan@cymasphere.com'
      })
    });

    const result = await response.text();
    console.log(`Response: ${response.status} ${response.statusText}`);
    console.log(`Body: ${result}`);

    if (response.ok) {
      console.log('\n🎉 SUCCESS! Fixed tracking campaign sent!');
      
      // Wait for database to update
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Check the campaign status
      const { data: sentCampaign } = await supabase
        .from('email_campaigns')
        .select('*')
        .eq('id', newCampaign.id)
        .single();

      console.log('\n📊 Campaign Status:');
      console.log(`   Status: ${sentCampaign?.status}`);
      console.log(`   Emails sent: ${sentCampaign?.emails_sent || 0}`);
      console.log(`   Emails opened: ${sentCampaign?.emails_opened || 0}`);

      // Get send record to check tracking pixel
      const { data: sends } = await supabase
        .from('email_sends')
        .select('*')
        .eq('campaign_id', newCampaign.id);

      if (sends && sends.length > 0) {
        console.log(`\n📧 Email sent to: ${sends[0].email}`);
        
        // Check what the tracking pixel looks like now
        if (sentCampaign.html_content.includes('display:block')) {
          console.log('✅ Tracking pixel uses display:block (GOOD!)');
        } else if (sentCampaign.html_content.includes('display:none')) {
          console.log('❌ Tracking pixel still uses display:none (BAD!)');
        } else {
          console.log('⚠️ No display style found in tracking pixel');
        }
        
        console.log('\n🎯 NOW TEST IN GMAIL:');
        console.log('1. Check your Gmail for "Gmail Tracking Fix Test"');
        console.log('2. Click "Display external images"');
        console.log('3. Wait 10 seconds');
        console.log('4. Run this script again to check opens:');
        console.log(`   node -e "require('dotenv').config({path:'.env.local'});const s=require('@supabase/supabase-js').createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY);s.from('email_campaigns').select('emails_opened').eq('id','${newCampaign.id}').single().then(({data})=>console.log('Opens:',data?.emails_opened||0))"`);
      }
      
    } else {
      console.log('\n❌ Failed to send campaign');
    }

  } catch (error) {
    console.log('\n❌ Error:', error.message);
  }
}

testFixedTracking().catch(console.error); 