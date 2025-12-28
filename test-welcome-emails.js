/**
 * Script to send all variations of welcome emails to ryan@cymasphere.com
 * Tests: subscription (monthly), subscription (annual), lifetime, trial, elite
 */

require('dotenv').config({ path: '.env.local' });
const { sendEmail } = require('./utils/email.ts');
const { generateWelcomeEmailHtml, generateWelcomeEmailText } = require('./utils/email-campaigns/welcome-email.ts');

const testEmail = 'ryan@cymasphere.com';

async function sendWelcomeEmails() {
  console.log(`\n📧 Sending welcome email variations to ${testEmail}\n`);
  console.log('='.repeat(80));

  const variations = [
    {
      name: 'Monthly Subscription',
      data: {
        customerName: 'Ryan Test',
        customerEmail: testEmail,
        purchaseType: 'subscription',
        subscriptionType: 'monthly',
        planName: 'monthly_6',
        isTrial: false,
      },
      subject: 'Welcome to Cymasphere - Monthly Subscription',
    },
    {
      name: 'Annual Subscription',
      data: {
        customerName: 'Ryan Test',
        customerEmail: testEmail,
        purchaseType: 'subscription',
        subscriptionType: 'annual',
        planName: 'annual_59',
        isTrial: false,
      },
      subject: 'Welcome to Cymasphere - Annual Subscription',
    },
    {
      name: 'Lifetime Purchase',
      data: {
        customerName: 'Ryan Test',
        customerEmail: testEmail,
        purchaseType: 'lifetime',
        planName: 'lifetime_149',
        isTrial: false,
      },
      subject: 'Welcome to Cymasphere - Lifetime License',
    },
    {
      name: 'Free Trial Start',
      data: {
        customerName: 'Ryan Test',
        customerEmail: testEmail,
        purchaseType: 'subscription',
        subscriptionType: 'monthly',
        planName: 'monthly_6',
        isTrial: true,
        trialEndDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
        trialDays: 7,
      },
      subject: 'Welcome to Cymasphere - Free Trial Started',
    },
    {
      name: 'Elite Access (NFR)',
      data: {
        customerName: 'Ryan Test',
        customerEmail: testEmail,
        purchaseType: 'elite',
        planName: 'elite',
        isTrial: false,
      },
      subject: 'Welcome to Cymasphere - Elite Access',
    },
  ];

  for (const variation of variations) {
    console.log(`\n📬 Sending: ${variation.name}`);
    console.log('-'.repeat(80));

    try {
      const html = generateWelcomeEmailHtml(variation.data);
      const text = generateWelcomeEmailText(variation.data);

      const result = await sendEmail({
        to: testEmail,
        subject: variation.subject,
        html: html,
        text: text,
        from: 'Cymasphere <support@cymasphere.com>',
      });

      if (result.success) {
        console.log(`✅ Successfully sent ${variation.name}`);
        console.log(`   Message ID: ${result.messageId || 'N/A'}`);
      } else {
        console.log(`❌ Failed to send ${variation.name}`);
        console.log(`   Error: ${result.error}`);
      }
    } catch (error) {
      console.log(`❌ Exception sending ${variation.name}:`);
      console.log(`   ${error.message}`);
    }

    // Small delay between emails
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('\n' + '='.repeat(80));
  console.log('✅ All email variations sent!\n');
}

sendWelcomeEmails().catch(console.error);



