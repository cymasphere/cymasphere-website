require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function debugRealGmailIssue() {
  console.log('🔍 DEBUGGING REAL GMAIL ISSUE - WHY GMAIL ISNT LOADING TRACKING IMAGE\n');

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // Get the email content exactly as sent
  const { data: sends } = await supabase
    .from('email_sends')
    .select('*')
    .order('sent_at', { ascending: false })
    .limit(1);

  const latestSend = sends[0];
  
  const { data: campaign } = await supabase
    .from('email_campaigns')
    .select('*')
    .eq('id', latestSend.campaign_id)
    .single();

  console.log('📧 Analyzing the actual email you received...\n');

  // Extract and analyze the tracking pixel
  const htmlContent = campaign.html_content;
  const trackingRegex = /<img[^>]*src="([^"]*\/api\/email-campaigns\/track\/open[^"]*)"[^>]*>/gi;
  const trackingMatches = [...htmlContent.matchAll(trackingRegex)];

  if (trackingMatches.length === 0) {
    console.log('❌ NO TRACKING PIXEL FOUND!');
    return;
  }

  console.log('🎯 TRACKING PIXEL ANALYSIS:\n');
  
  trackingMatches.forEach((match, i) => {
    console.log(`${i + 1}. Full IMG tag: ${match[0]}`);
    console.log(`   URL: ${match[1]}\n`);
  });

  const trackingUrl = trackingMatches[0][1];

  // Check if there are any issues with the tracking pixel HTML
  console.log('🔍 POTENTIAL GMAIL BLOCKING ISSUES:\n');

  const imgTag = trackingMatches[0][0];
  
  // Check for common Gmail blocking issues
  const issues = [];
  
  if (imgTag.includes('display:none') || imgTag.includes('display: none')) {
    issues.push('❌ Tracking pixel has display:none - Gmail may not load it');
  }
  
  if (imgTag.includes('width="0"') || imgTag.includes('height="0"')) {
    issues.push('❌ Tracking pixel has zero dimensions - Gmail may not load it');
  }
  
  if (!imgTag.includes('width') || !imgTag.includes('height')) {
    issues.push('⚠️ Tracking pixel missing explicit dimensions');
  }
  
  if (!imgTag.includes('alt=')) {
    issues.push('⚠️ Tracking pixel missing alt attribute');
  }

  if (issues.length > 0) {
    console.log('🚨 POTENTIAL ISSUES FOUND:');
    issues.forEach(issue => console.log(`   ${issue}`));
  } else {
    console.log('✅ No obvious HTML issues with tracking pixel');
  }

  // Test different tracking pixel formats
  console.log('\n🧪 TESTING DIFFERENT PIXEL FORMATS:\n');

  const testFormats = [
    `<img src="${trackingUrl}" width="1" height="1" />`,
    `<img src="${trackingUrl}" width="1" height="1" alt="" />`,
    `<img src="${trackingUrl}" width="1" height="1" alt="" style="border:0;" />`,
    `<img src="${trackingUrl}" width="1" height="1" alt="" style="display:block;" />`,
    `<img src="${trackingUrl}" width="1" height="1" alt="" style="border:0;display:block;margin:0;padding:0;" />`
  ];

  testFormats.forEach((format, i) => {
    console.log(`${i + 1}. ${format}`);
  });

  // Check tracking URL accessibility
  console.log('\n🌐 CHECKING TRACKING URL ACCESSIBILITY:\n');

  try {
    const response = await fetch(trackingUrl, {
      method: 'HEAD',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; GoogleImageProxy)',
      }
    });

    console.log(`📡 HEAD request: ${response.status} ${response.statusText}`);
    console.log(`📄 Content-Type: ${response.headers.get('content-type')}`);
    console.log(`📏 Content-Length: ${response.headers.get('content-length')}`);
    console.log(`🔒 CORS headers: ${response.headers.get('access-control-allow-origin') || 'None'}`);

  } catch (error) {
    console.log(`❌ HEAD request failed: ${error.message}`);
  }

  // Check for Gmail-specific issues
  console.log('\n📧 GMAIL-SPECIFIC DIAGNOSTICS:\n');

  console.log('🔍 Common reasons Gmail doesn\'t load tracking images:');
  console.log('   1. Gmail Enhanced Safe Browsing blocking suspicious URLs');
  console.log('   2. Gmail proxy cache - image already cached from previous loads');
  console.log('   3. Corporate/ISP email security scanning');
  console.log('   4. Gmail confidence-based filtering for new senders');
  console.log('   5. Email landed in Promotions/Spam tab');
  console.log('   6. User has "Always display external images" disabled globally');

  // Check email headers and content
  console.log('\n📋 EMAIL ANALYSIS:');
  console.log(`   Subject: ${campaign.subject}`);
  console.log(`   From: ${campaign.sender_name} <${campaign.sender_email}>`);
  console.log(`   Reply-To: ${campaign.reply_to_email}`);
  console.log(`   Content length: ${htmlContent.length} chars`);

  // Check if email might look spammy
  const spamIndicators = [];
  
  if (campaign.subject.includes('Test') || campaign.subject.includes('🧪')) {
    spamIndicators.push('Subject contains test indicators');
  }
  
  if (htmlContent.includes('tracking')) {
    spamIndicators.push('Content mentions tracking');
  }
  
  if (htmlContent.match(/<img[^>]*>/gi)?.length > 5) {
    spamIndicators.push('Email contains many images');
  }

  if (spamIndicators.length > 0) {
    console.log('\n⚠️ POTENTIAL SPAM INDICATORS:');
    spamIndicators.forEach(indicator => console.log(`   • ${indicator}`));
  }

  // Final recommendations
  console.log('\n💡 DEBUGGING STEPS TO TRY:\n');
  console.log('1. Check which Gmail tab the email landed in (Primary/Promotions/Spam)');
  console.log('2. Forward the email to another email provider (Outlook, Yahoo)');
  console.log('3. Send a simpler email without test indicators');
  console.log('4. Try from a different sending domain');
  console.log('5. Check Gmail\'s "Images" settings in Settings > General');
  console.log('6. Try opening email on mobile vs desktop Gmail');
  
  console.log('\n🎯 NEXT ACTIONS:');
  console.log('1. Tell me which Gmail tab the email appeared in');
  console.log('2. Try forwarding the email to see if tracking works elsewhere');
  console.log('3. Check your Gmail image settings');
}

debugRealGmailIssue().catch(console.error); 