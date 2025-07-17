#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Read local environment variables
function readLocalEnv() {
  const envPath = path.join(__dirname, '.env.local');
  if (!fs.existsSync(envPath)) {
    console.log('❌ .env.local not found');
    return {};
  }

  const envContent = fs.readFileSync(envPath, 'utf8');
  const envVars = {};
  
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        envVars[key] = valueParts.join('=');
      }
    }
  });

  return envVars;
}

// Expected GitHub secrets from deploy.yml
const expectedGitHubSecrets = {
  // Core Application
  'NEXT_PUBLIC_SITE_URL': 'https://cymasphere.com',
  'NEXT_PUBLIC_SUPABASE_URL': 'https://jibirpbauzqhdiwjlrmf.supabase.co',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  'SUPABASE_SERVICE_ROLE_KEY': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  
  // Stripe Configuration
  'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY': 'pk_live_...', // Should be live key
  'STRIPE_SECRET_KEY': 'sk_live_...', // Should be live key
  'STRIPE_WEBHOOK_SECRET': 'whsec_...',
  'STRIPE_PRICE_ID_MONTHLY': 'price_...',
  'STRIPE_PRICE_ID_ANNUAL': 'price_...',
  'STRIPE_PRICE_ID_LIFETIME': 'price_...',
  
  // AWS Configuration
  'AWS_ACCESS_KEY_ID': 'AKIA...',
  'AWS_SECRET_ACCESS_KEY': '...',
  'AWS_REGION': 'us-east-1',
  
  // Deployment Configuration
  'LIGHTSAIL_SSH_KEY': '-----BEGIN OPENSSH PRIVATE KEY-----...',
  'LIGHTSAIL_HOST': 'your-lightsail-host',
  'LIGHTSAIL_USER': 'your-lightsail-user',
  'CRON_SECRET': 'your-secret-key',
  
  // Missing from deploy.yml but referenced in code
  'EMAIL_TEST_MODE': 'false',
  'LIFETIME_PRICE_ID_2': 'price_...',
  'NEXT_PUBLIC_API_URL': 'https://cymasphere.com'
};

// Check environment variable parity
function checkParity() {
  console.log('🔍 Checking Environment Variable Parity\n');
  
  const localEnv = readLocalEnv();
  
  console.log('📋 GitHub Secrets Required (from deploy.yml):');
  console.log('==============================================');
  
  let missingInLocal = 0;
  let missingInGitHub = 0;
  let differentValues = 0;
  
  Object.keys(expectedGitHubSecrets).forEach(key => {
    const localValue = localEnv[key];
    const expectedValue = expectedGitHubSecrets[key];
    
    if (!localValue) {
      console.log(`❌ ${key} - Missing in local .env.local`);
      missingInLocal++;
    } else if (key.includes('NEXT_PUBLIC_SITE_URL') && localValue.includes('localhost')) {
      console.log(`⚠️  ${key} - Local: ${localValue} (should be production URL in GitHub)`);
      differentValues++;
    } else if (key.includes('STRIPE') && localValue.includes('test')) {
      console.log(`⚠️  ${key} - Local: ${localValue.substring(0, 20)}... (should be live keys in GitHub)`);
      differentValues++;
    } else {
      console.log(`✅ ${key} - Present in local`);
    }
  });
  
  console.log('\n📋 Local Variables Not in GitHub Secrets:');
  console.log('==========================================');
  
  Object.keys(localEnv).forEach(key => {
    if (!expectedGitHubSecrets[key]) {
      console.log(`ℹ️  ${key} - In local but not in GitHub secrets`);
      missingInGitHub++;
    }
  });
  
  console.log('\n📊 Summary:');
  console.log('===========');
  console.log(`✅ Variables present in both: ${Object.keys(expectedGitHubSecrets).length - missingInLocal - differentValues}`);
  console.log(`❌ Missing in local: ${missingInLocal}`);
  console.log(`⚠️  Different values (test vs live): ${differentValues}`);
  console.log(`ℹ️  In local but not in GitHub: ${missingInGitHub}`);
  
  console.log('\n🔧 Action Items:');
  console.log('===============');
  
  if (missingInLocal > 0) {
    console.log('1. Add missing variables to your local .env.local');
  }
  
  if (missingInGitHub > 0) {
    console.log('2. Add missing variables to GitHub repository secrets');
  }
  
  if (differentValues > 0) {
    console.log('3. Ensure GitHub secrets use production values (live keys, production URLs)');
  }
  
  console.log('4. Update .github/workflows/deploy.yml to include missing environment variables');
  
  console.log('\n🌐 GitHub Secrets URL:');
  console.log('https://github.com/cymasphere/cymasphere-website/settings/secrets/actions');
}

// Run the check
checkParity(); 