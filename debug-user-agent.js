const { createClient } = require('@supabase/supabase-js');

// This simulates the bot detection logic
const BOT_USER_AGENTS = [
  'bot',
  'crawler', 
  'spider',
  'scanner',
  'checker',
  'monitor',
  'curl',
  'wget',
  'python',
  'java',
  'manual-test',
  'proofpoint',
  'mimecast',
  'forcepoint',
  'symantec',
  'mcafee',
  'Chrome/42.',
  'Chrome/41.',
  'Chrome/40.',
  'Chrome/39.',
  'Chrome/38.'
];

function isLikelyBotOpen(userAgent, ipAddress) {
  if (userAgent) {
    const ua = userAgent.toLowerCase();
    if (BOT_USER_AGENTS.some(botPattern => ua.includes(botPattern.toLowerCase()))) {
      return true;
    }
  }
  return false;
}

async function debugUserAgent() {
  console.log('🔍 TESTING BOT DETECTION LOGIC\n');

  // Test various user agents
  const testUserAgents = [
    'curl/8.7.1',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
    'PostmanRuntime/7.32.3',
    'GoogleBot/2.1',
    'Mail/16.0 (macOS 13.0)',
    'Outlook-iOS/709.2189423.prod.iphone (16.7.2)',
    'Gmail/6.11.26.184541133 (iPhone; OS 16.7.2; en_US)'
  ];

  testUserAgents.forEach(ua => {
    const isBot = isLikelyBotOpen(ua, null);
    console.log(`${isBot ? '🤖 BOT' : '✅ HUMAN'}: ${ua}`);
  });

  console.log('\n📧 WHAT TO TRY:');
  console.log('1. Open the email in your actual email client');
  console.log('2. Enable external images');  
  console.log('3. Check browser developer tools > Network tab');
  console.log('4. Look for the tracking pixel request and see the User-Agent header');
  console.log('5. If it contains any of these bot keywords, that\'s why it\'s being filtered:');
  console.log('   ' + BOT_USER_AGENTS.join(', '));
}

debugUserAgent().catch(console.error); 