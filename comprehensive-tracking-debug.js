require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function comprehensiveTrackingDebug() {
  console.log('🔍 COMPREHENSIVE TRACKING DEBUG - FINDING THE EXACT ISSUE\n');

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // Step 1: Check if emails were actually sent
  console.log('📧 STEP 1: CHECKING EMAIL SENDS...\n');
  
  const { data: allSends, error: sendsError } = await supabase
    .from('email_sends')
    .select('*')
    .order('sent_at', { ascending: false });

  if (sendsError) {
    console.log('❌ Error fetching sends:', sendsError.message);
    return;
  }

  console.log(`📊 Total email sends: ${allSends?.length || 0}`);
  
  if (!allSends || allSends.length === 0) {
    console.log('❌ NO EMAIL SENDS FOUND! Email was never actually sent to database.');
    console.log('💡 This means the send API failed to create send records.');
    return;
  }

  console.log('✅ Email sends found:');
  allSends.forEach((send, i) => {
    console.log(`   ${i + 1}. To: ${send.email} | Sent: ${send.sent_at} | Campaign: ${send.campaign_id}`);
  });

  // Step 2: Get the campaign with tracking pixel
  const latestSend = allSends[0];
  console.log(`\n🎯 ANALYZING LATEST SEND TO: ${latestSend.email}\n`);

  const { data: campaign, error: campaignError } = await supabase
    .from('email_campaigns')
    .select('*')
    .eq('id', latestSend.campaign_id)
    .single();

  if (campaignError || !campaign) {
    console.log('❌ Error fetching campaign:', campaignError?.message);
    return;
  }

  console.log(`📧 Campaign: ${campaign.name}`);
  console.log(`📊 Current stats: Sent: ${campaign.emails_sent || 0}, Opens: ${campaign.emails_opened || 0}`);

  // Step 3: Check HTML content for tracking pixel
  console.log('\n🔍 STEP 3: ANALYZING EMAIL CONTENT FOR TRACKING PIXEL...\n');
  
  const htmlContent = campaign.html_content;
  if (!htmlContent) {
    console.log('❌ NO HTML CONTENT! Email has no content.');
    return;
  }

  console.log(`📄 HTML content length: ${htmlContent.length} characters`);

  // Look for tracking pixel
  const trackingPixelRegex = /src="([^"]*\/api\/email-campaigns\/track\/open[^"]*)"/g;
  const trackingMatches = [...htmlContent.matchAll(trackingPixelRegex)];

  if (trackingMatches.length === 0) {
    console.log('❌ NO TRACKING PIXEL FOUND IN EMAIL CONTENT!');
    console.log('💡 This is the problem - emails are sent without tracking pixels.');
    
    // Show sample of HTML content
    console.log('\n📄 Sample HTML content:');
    console.log(htmlContent.substring(0, 500) + '...');
    return;
  }

  console.log(`✅ Found ${trackingMatches.length} tracking pixel(s):`);
  trackingMatches.forEach((match, i) => {
    console.log(`   ${i + 1}. ${match[1]}`);
  });

  const trackingUrl = trackingMatches[0][1];

  // Step 4: Parse tracking URL parameters
  console.log('\n🔍 STEP 4: ANALYZING TRACKING URL...\n');
  
  try {
    const url = new URL(trackingUrl);
    const params = {
      campaign_id: url.searchParams.get('c'),
      subscriber_id: url.searchParams.get('u'), 
      send_id: url.searchParams.get('s')
    };

    console.log('📋 Tracking URL parameters:');
    console.log(`   Campaign ID: ${params.campaign_id}`);
    console.log(`   Subscriber ID: ${params.subscriber_id}`);
    console.log(`   Send ID: ${params.send_id}`);

    // Verify these IDs exist
    console.log('\n🔍 Verifying tracking parameters...');
    
    if (params.send_id !== latestSend.id) {
      console.log('⚠️ WARNING: Tracking send_id does not match actual send record!');
      console.log(`   Tracking: ${params.send_id}`);
      console.log(`   Actual: ${latestSend.id}`);
    } else {
      console.log('✅ Send ID matches');
    }

    if (params.campaign_id !== campaign.id) {
      console.log('⚠️ WARNING: Tracking campaign_id does not match!');
      console.log(`   Tracking: ${params.campaign_id}`);
      console.log(`   Actual: ${campaign.id}`);
    } else {
      console.log('✅ Campaign ID matches');
    }

  } catch (urlError) {
    console.log('❌ Invalid tracking URL:', urlError.message);
    return;
  }

  // Step 5: Test tracking URL directly
  console.log('\n🧪 STEP 5: TESTING TRACKING URL DIRECTLY...\n');
  
  try {
    console.log('Making request to:', trackingUrl);
    
    const response = await fetch(trackingUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'image/*',
        'Referer': 'https://mail.google.com/'
      }
    });

    console.log(`📥 Response: ${response.status} ${response.statusText}`);
    console.log(`📄 Content-Type: ${response.headers.get('content-type')}`);
    console.log(`📏 Content-Length: ${response.headers.get('content-length')}`);

    if (response.status !== 200) {
      console.log('❌ TRACKING URL FAILED!');
      const errorText = await response.text();
      console.log(`Error: ${errorText.substring(0, 200)}`);
      return;
    }

    console.log('✅ Tracking URL responds correctly');

  } catch (fetchError) {
    console.log('❌ Error testing tracking URL:', fetchError.message);
    return;
  }

  // Step 6: Wait and check database for new opens
  console.log('\n⏳ STEP 6: WAITING 3 SECONDS THEN CHECKING DATABASE...\n');
  
  await new Promise(resolve => setTimeout(resolve, 3000));

  const { data: opens, error: opensError } = await supabase
    .from('email_opens')
    .select('*')
    .eq('send_id', latestSend.id)
    .order('opened_at', { ascending: false });

  if (opensError) {
    console.log('❌ Error fetching opens:', opensError.message);
    return;
  }

  console.log(`📊 Opens for this send: ${opens?.length || 0}`);

  if (!opens || opens.length === 0) {
    console.log('❌ NO OPENS RECORDED! The tracking API is not recording to database.');
    console.log('🔍 This is the exact problem - tracking URL works but database insert fails.');
  } else {
    console.log('✅ Opens found:');
    opens.forEach((open, i) => {
      console.log(`   ${i + 1}. ${open.opened_at} - IP: ${open.ip_address} - UA: ${open.user_agent?.substring(0, 50)}`);
    });
  }

  // Step 7: Check campaign stats update
  console.log('\n📊 STEP 7: CHECKING CAMPAIGN STATS UPDATE...\n');
  
  const { data: updatedCampaign } = await supabase
    .from('email_campaigns')
    .select('emails_opened, emails_sent')
    .eq('id', campaign.id)
    .single();

  console.log(`📈 Campaign stats:`);
  console.log(`   Emails sent: ${updatedCampaign?.emails_sent || 0}`);
  console.log(`   Emails opened: ${updatedCampaign?.emails_opened || 0}`);

  if ((updatedCampaign?.emails_opened || 0) === 0) {
    console.log('❌ Campaign open count not updated!');
  }

  // Step 8: Gmail-specific test
  console.log('\n🧪 STEP 8: GMAIL-SPECIFIC TEST...\n');
  
  try {
    const gmailResponse = await fetch(trackingUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; GoogleImageProxy)',
        'X-Forwarded-For': '74.125.224.72',
        'Accept': 'image/*'
      }
    });

    console.log(`📧 Gmail proxy response: ${gmailResponse.status} ${gmailResponse.statusText}`);

    // Wait and check again
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const { data: gmailOpens } = await supabase
      .from('email_opens')
      .select('*')
      .eq('send_id', latestSend.id)
      .order('opened_at', { ascending: false });

    console.log(`📊 Opens after Gmail test: ${gmailOpens?.length || 0}`);

  } catch (gmailError) {
    console.log('❌ Gmail test error:', gmailError.message);
  }

  // Final diagnosis
  console.log('\n🎯 DIAGNOSIS:\n');
  
  if (trackingMatches.length === 0) {
    console.log('❌ ROOT CAUSE: No tracking pixel in email content');
    console.log('💡 FIX: Email sending process needs to inject tracking pixels');
  } else if ((opens?.length || 0) === 0) {
    console.log('❌ ROOT CAUSE: Tracking pixel exists but database recording fails');
    console.log('💡 FIX: Check tracking API database insert logic');
  } else if ((updatedCampaign?.emails_opened || 0) === 0) {
    console.log('❌ ROOT CAUSE: Opens recorded but campaign stats not updated');
    console.log('💡 FIX: Check campaign statistics update logic');
  } else {
    console.log('✅ TRACKING WORKING: Opens recorded and stats updated');
    console.log('💡 Gmail may be caching images or using different user agent');
  }
}

comprehensiveTrackingDebug().catch(console.error); 