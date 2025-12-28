/**
 * Script to send all welcome email variations to ryan@cymasphere.com
 * Run with: node send-welcome-emails.js
 * Or with tsx: npx tsx send-welcome-emails.ts (if converted to TS)
 */

require('dotenv').config({ path: '.env.local' });

// Since we can't easily import TypeScript, let's make a direct API call
// or use a workaround. Actually, let's just make an HTTP request to trigger it
// if the server is running, or provide instructions.

const https = require('https');
const http = require('http');

const testEmail = 'ryan@cymasphere.com';

async function sendEmails() {
  console.log(`\n📧 Sending welcome email variations to ${testEmail}\n`);
  console.log('='.repeat(80));

  // Try to call the API endpoint
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/test-welcome-emails',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  };

  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const result = JSON.parse(data);
            console.log('\n✅ Success!');
            console.log(JSON.stringify(result, null, 2));
            resolve(result);
          } catch (e) {
            console.log('\n⚠️  Response received but not JSON:');
            console.log(data.substring(0, 500));
            resolve({ success: false, error: 'Invalid response format' });
          }
        } else {
          console.log(`\n❌ Error: HTTP ${res.statusCode}`);
          console.log('Response:', data.substring(0, 500));
          console.log('\n💡 Tip: Make sure your Next.js dev server is running on port 3000');
          console.log('   Run: npm run dev');
          resolve({ success: false, error: `HTTP ${res.statusCode}` });
        }
      });
    });

    req.on('error', (error) => {
      console.log(`\n❌ Connection error: ${error.message}`);
      console.log('\n💡 Tip: Make sure your Next.js dev server is running on port 3000');
      console.log('   Run: npm run dev');
      resolve({ success: false, error: error.message });
    });

    req.end();
  });
}

sendEmails().then((result) => {
  if (result.success) {
    console.log('\n✅ All emails sent successfully!');
    process.exit(0);
  } else {
    console.log('\n❌ Failed to send emails');
    process.exit(1);
  }
}).catch((error) => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});



