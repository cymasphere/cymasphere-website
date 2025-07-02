require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function verifyTrackingPixelInEmail() {
  console.log('🔍 VERIFYING TRACKING PIXEL IS ACTUALLY IN SENT EMAILS\n');

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // Get the most recent email send
  const { data: sends } = await supabase
    .from('email_sends')
    .select('*')
    .order('sent_at', { ascending: false })
    .limit(1);

  if (!sends || sends.length === 0) {
    console.log('❌ No email sends found!');
    return;
  }

  const latestSend = sends[0];
  console.log('📧 Latest email send:');
  console.log(`   Email: ${latestSend.email}`);
  console.log(`   Campaign: ${latestSend.campaign_id}`);
  console.log(`   Send ID: ${latestSend.id}`);
  console.log(`   Sent at: ${latestSend.sent_at}`);

  // Get the campaign content
  const { data: campaign } = await supabase
    .from('email_campaigns')
    .select('*')
    .eq('id', latestSend.campaign_id)
    .single();

  if (!campaign) {
    console.log('❌ Campaign not found!');
    return;
  }

  console.log(`\n📧 Campaign: ${campaign.name}`);
  console.log(`   Subject: ${campaign.subject}`);
  console.log(`   Status: ${campaign.status}`);

  // Analyze the HTML content
  const htmlContent = campaign.html_content;
  console.log(`\n📄 HTML Content length: ${htmlContent.length} characters`);

  // Look for tracking pixel
  console.log('\n🔍 SEARCHING FOR TRACKING PIXEL...\n');

  const trackingPixelRegex = /<img[^>]*src="[^"]*\/api\/email-campaigns\/track\/open[^"]*"[^>]*>/gi;
  const trackingMatches = [...htmlContent.matchAll(trackingPixelRegex)];

  if (trackingMatches.length === 0) {
    console.log('❌ NO TRACKING PIXEL FOUND IN EMAIL HTML!');
    console.log('\n🔍 Let me check what the HTML contains:');
    
    // Show a sample of the HTML
    console.log('\n📄 HTML Content Sample (first 500 chars):');
    console.log(htmlContent.substring(0, 500));
    console.log('\n📄 HTML Content Sample (last 500 chars):');
    console.log(htmlContent.substring(htmlContent.length - 500));
    
    // Check if there are any img tags at all
    const allImgTags = htmlContent.match(/<img[^>]*>/gi) || [];
    console.log(`\n🖼️ Found ${allImgTags.length} img tags total:`);
    allImgTags.forEach((img, i) => {
      console.log(`${i + 1}. ${img}`);
    });

    console.log('\n💡 ISSUE IDENTIFIED:');
    console.log('The tracking pixel is NOT being injected into the email content!');
    console.log('This means the tracking code is not running during email generation.');
    
    return;
  }

  console.log(`✅ Found ${trackingMatches.length} tracking pixel(s):`);
  
  trackingMatches.forEach((match, i) => {
    console.log(`\n${i + 1}. ${match[0]}`);
    
    // Parse the tracking URL
    const urlMatch = match[0].match(/src="([^"]*)/);
    if (urlMatch) {
      const trackingUrl = urlMatch[1];
      console.log(`   URL: ${trackingUrl}`);
      
      // Parse parameters
      const url = new URL(trackingUrl);
      console.log(`   Campaign ID: ${url.searchParams.get('c')}`);
      console.log(`   User ID: ${url.searchParams.get('u')}`);
      console.log(`   Send ID: ${url.searchParams.get('s')}`);
      
      // Check if parameters match this send
      const expectedCampaignId = latestSend.campaign_id;
      const expectedSendId = latestSend.id;
      
      if (url.searchParams.get('c') === expectedCampaignId) {
        console.log(`   ✅ Campaign ID matches`);
      } else {
        console.log(`   ❌ Campaign ID mismatch! Expected: ${expectedCampaignId}`);
      }
      
      if (url.searchParams.get('s') === expectedSendId) {
        console.log(`   ✅ Send ID matches`);
      } else {
        console.log(`   ❌ Send ID mismatch! Expected: ${expectedSendId}`);
      }
      
      // Check the style
      const styleMatch = match[0].match(/style="([^"]*)"/);
      if (styleMatch) {
        const style = styleMatch[1];
        console.log(`   Style: ${style}`);
        
        if (style.includes('display:none')) {
          console.log(`   ❌ Still using display:none (BAD!)`);
        } else if (style.includes('display:block')) {
          console.log(`   ✅ Using display:block (GOOD!)`);
        } else {
          console.log(`   ⚠️ No display style specified`);
        }
      }
    }
  });

  // Test the tracking URL
  if (trackingMatches.length > 0) {
    const firstMatch = trackingMatches[0][0];
    const urlMatch = firstMatch.match(/src="([^"]*)/);
    
    if (urlMatch) {
      const trackingUrl = urlMatch[1];
      console.log('\n🧪 TESTING TRACKING URL...');
      
      try {
        const response = await fetch(trackingUrl, {
          method: 'GET',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          }
        });
        
        console.log(`📡 Response: ${response.status} ${response.statusText}`);
        console.log(`📄 Content-Type: ${response.headers.get('content-type')}`);
        
        if (response.ok) {
          console.log('✅ Tracking URL is accessible');
          
          // Check if open was recorded
          setTimeout(async () => {
            const { data: updatedCampaign } = await supabase
              .from('email_campaigns')
              .select('emails_opened')
              .eq('id', latestSend.campaign_id)
              .single();
            
            console.log(`\n📊 Campaign opens after test: ${updatedCampaign?.emails_opened || 0}`);
          }, 2000);
          
        } else {
          console.log('❌ Tracking URL is not accessible');
        }
        
      } catch (error) {
        console.log(`❌ Error testing tracking URL: ${error.message}`);
      }
    }
  }

  console.log('\n💡 SUMMARY:');
  if (trackingMatches.length > 0) {
    console.log('✅ Tracking pixel IS included in email content');
    console.log('🎯 If Gmail still not tracking, the issue is likely:');
    console.log('   1. Gmail Image Proxy caching');
    console.log('   2. Gmail not loading external images');
    console.log('   3. Bot detection still too aggressive');
    console.log('   4. Email landed in Promotions/Spam tab');
  } else {
    console.log('❌ Tracking pixel is NOT included in email content');
    console.log('🔧 Need to fix email generation/tracking injection code');
  }
}

verifyTrackingPixelInEmail().catch(console.error); 