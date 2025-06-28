#!/usr/bin/env node

// Test script to manually trigger the scheduled campaign processor
// Usage: node test-scheduled-campaigns.js

const https = require('https');
const http = require('http');

// Configuration
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
const CRON_SECRET = process.env.CRON_SECRET || 'your-secret-key';

function makeRequest(url, options, data) {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith('https://');
    const requestModule = isHttps ? https : http;
    
    const req = requestModule.request(url, options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsedData = JSON.parse(responseData);
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: parsedData
          });
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: responseData
          });
        }
      });
    });
    
    req.on('error', reject);
    
    if (data) {
      req.write(data);
    }
    
    req.end();
  });
}

async function testScheduledCampaigns() {
  console.log('🔄 Testing scheduled campaign processor...');
  console.log(`📡 API URL: ${API_URL}`);
  console.log(`🔑 Using CRON_SECRET: ${CRON_SECRET.slice(0, 8)}...`);
  
  const url = `${API_URL}/api/email-campaigns/process-scheduled`;
  
  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${CRON_SECRET}`
    }
  };
  
  try {
    console.log('\n📞 Making request...');
    const response = await makeRequest(url, options);
    
    console.log(`\n📊 Response Status: ${response.statusCode}`);
    console.log('📋 Response Data:');
    console.log(JSON.stringify(response.data, null, 2));
    
    if (response.statusCode === 200) {
      console.log('\n✅ Successfully processed scheduled campaigns!');
      
      if (response.data.processed > 0) {
        console.log(`\n📧 Results Summary:`);
        response.data.results.forEach((result, index) => {
          console.log(`\n${index + 1}. ${result.name} (${result.campaignId})`);
          console.log(`   Status: ${result.status}`);
          if (result.totalRecipients !== undefined) {
            console.log(`   Recipients: ${result.totalRecipients}`);
            console.log(`   Sent: ${result.sent}`);
            console.log(`   Failed: ${result.failed}`);
            console.log(`   Success Rate: ${result.successRate}%`);
          }
          if (result.error) {
            console.log(`   Error: ${result.error}`);
          }
        });
             } else {
         console.log('\n📭 No scheduled campaigns were due for processing.');
         
         // Show recently processed campaigns
         if (response.data.recentlyProcessed && response.data.recentlyProcessed.length > 0) {
           console.log(`\n📋 Recently Processed Campaigns:`);
           response.data.recentlyProcessed.forEach((campaign, index) => {
             console.log(`\n${index + 1}. ${campaign.name} (${campaign.id})`);
             console.log(`   Status: ${campaign.status}`);
             console.log(`   Recipients: ${campaign.total_recipients || 0}`);
             console.log(`   Sent: ${campaign.emails_sent || 0}`);
             if (campaign.sent_at) {
               console.log(`   Sent At: ${new Date(campaign.sent_at).toLocaleString()}`);
             }
             console.log(`   Last Updated: ${new Date(campaign.last_updated).toLocaleString()}`);
           });
         }
       }
    } else {
      console.log('\n❌ Failed to process scheduled campaigns');
      if (response.statusCode === 401) {
        console.log('🔒 Check your CRON_SECRET environment variable');
      }
    }
    
  } catch (error) {
    console.error('\n❌ Error making request:', error.message);
    console.error('\n🔧 Make sure your server is running and the API URL is correct');
  }
}

// Run the test
testScheduledCampaigns().catch(console.error); 