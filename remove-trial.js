/**
 * Script to remove trial subscription for a user
 * Cancels all active/trialing subscriptions and updates profile
 * Usage: node remove-trial.js ryan@cymasphere.com
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const Stripe = require('stripe');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const stripeKey = process.env.STRIPE_SECRET_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

if (!stripeKey) {
  console.error('❌ Missing Stripe credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const stripe = new Stripe(stripeKey);

const email = process.argv[2] || 'ryan@cymasphere.com';

async function removeTrial() {
  console.log(`\n🔍 Removing trial for: ${email}\n`);

  // Find user profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, email, customer_id, subscription, trial_expiration')
    .eq('email', email.toLowerCase().trim())
    .single();

  if (profileError || !profile) {
    console.log(`❌ User not found: ${email}`);
    return;
  }

  console.log(`📋 User: ${profile.email}`);
  console.log(`   User ID: ${profile.id}`);
  console.log(`   Customer ID: ${profile.customer_id || 'N/A'}`);
  console.log(`   Current Subscription: ${profile.subscription}`);
  console.log(`   Trial Expiration: ${profile.trial_expiration || 'N/A'}`);

  if (!profile.customer_id) {
    console.log(`\n⚠️  No customer ID found. Updating profile to remove trial status...`);
    
    // Just update the profile to remove trial
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        subscription: 'none',
        trial_expiration: null,
        subscription_expiration: null,
      })
      .eq('id', profile.id);

    if (updateError) {
      console.error('❌ Error updating profile:', updateError);
      return;
    }

    console.log(`\n✅ Profile updated - trial removed`);
    return;
  }

  // Get all subscriptions for this customer
  const subscriptions = await stripe.subscriptions.list({
    customer: profile.customer_id,
    status: 'all',
    limit: 100,
  });

  const activeSubscriptions = subscriptions.data.filter(
    (sub) => sub.status === 'active' || sub.status === 'trialing' || sub.status === 'past_due'
  );

  console.log(`\n📋 Found ${activeSubscriptions.length} active subscription(s):`);
  activeSubscriptions.forEach((sub, idx) => {
    console.log(`   ${idx + 1}. ${sub.id}`);
    console.log(`      Status: ${sub.status}`);
    console.log(`      Created: ${new Date(sub.created * 1000).toISOString()}`);
    if (sub.trial_end) {
      console.log(`      Trial End: ${new Date(sub.trial_end * 1000).toISOString()}`);
    }
    if (sub.current_period_end) {
      console.log(`      Current Period End: ${new Date(sub.current_period_end * 1000).toISOString()}`);
    }
  });

  if (activeSubscriptions.length === 0) {
    console.log(`\n⚠️  No active subscriptions found. Just updating profile...`);
  } else {
    // Cancel all active subscriptions
    console.log(`\n❌ Canceling ${activeSubscriptions.length} subscription(s):`);
    
    for (const sub of activeSubscriptions) {
      try {
        await stripe.subscriptions.cancel(sub.id, {
          invoice_now: false,
          prorate: false,
        });
        console.log(`   ✅ Canceled: ${sub.id}`);
      } catch (error) {
        console.error(`   ❌ Failed to cancel ${sub.id}:`, error.message);
      }
    }
  }

  // Update profile to remove trial and subscription
  console.log(`\n📝 Updating profile...`);
  const { error: updateError } = await supabase
    .from('profiles')
    .update({
      subscription: 'none',
      trial_expiration: null,
      subscription_expiration: null,
    })
    .eq('id', profile.id);

  if (updateError) {
    console.error('❌ Error updating profile:', updateError);
    return;
  }

  console.log(`\n✅ Successfully removed trial and canceled subscriptions for ${email}`);
  console.log(`   - All subscriptions canceled`);
  console.log(`   - Profile updated: subscription = 'none', trial_expiration = null\n`);
}

removeTrial().catch(console.error);
