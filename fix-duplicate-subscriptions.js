/**
 * Script to fix users with duplicate active subscriptions
 * This will keep the most recent active subscription and cancel the others
 * Usage: node fix-duplicate-subscriptions.js [email]
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

const email = process.argv[2];

async function fixDuplicateSubscriptions() {
  if (email) {
    // Fix specific user
    console.log(`\n🔍 Fixing duplicate subscriptions for: ${email}\n`);
    await fixUserSubscriptions(email);
  } else {
    // Find all users with duplicate subscriptions
    console.log('\n🔍 Finding all users with duplicate subscriptions...\n');
    
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, email, customer_id')
      .not('customer_id', 'is', null);

    if (error) {
      console.error('❌ Error fetching profiles:', error);
      return;
    }

    console.log(`Found ${profiles.length} users with customer IDs\n`);

    let fixedCount = 0;
    for (const profile of profiles) {
      if (profile.customer_id) {
        const hasDuplicates = await checkForDuplicates(profile.customer_id);
        if (hasDuplicates) {
          console.log(`\n⚠️ Found duplicates for ${profile.email}`);
          await fixUserSubscriptions(profile.email);
          fixedCount++;
        }
      }
    }

    console.log(`\n✅ Fixed ${fixedCount} user(s) with duplicate subscriptions\n`);
  }
}

async function checkForDuplicates(customerId) {
  const subscriptions = await stripe.subscriptions.list({
    customer: customerId,
    status: 'all',
    limit: 100,
  });

  const activeSubscriptions = subscriptions.data.filter(
    (sub) => sub.status === 'active' || sub.status === 'trialing' || sub.status === 'past_due'
  );

  return activeSubscriptions.length > 1;
}

async function fixUserSubscriptions(userEmail) {
  // Find user profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, email, customer_id')
    .eq('email', userEmail)
    .single();

  if (profileError || !profile) {
    console.log(`❌ User not found: ${userEmail}`);
    return;
  }

  if (!profile.customer_id) {
    console.log(`❌ No customer ID for user: ${userEmail}`);
    return;
  }

  console.log(`\n📋 User: ${profile.email}`);
  console.log(`   Customer ID: ${profile.customer_id}`);

  // Get all subscriptions
  const subscriptions = await stripe.subscriptions.list({
    customer: profile.customer_id,
    status: 'all',
    limit: 100,
  });

  const activeSubscriptions = subscriptions.data.filter(
    (sub) => sub.status === 'active' || sub.status === 'trialing' || sub.status === 'past_due'
  );

  console.log(`\n   Found ${activeSubscriptions.length} active subscription(s):`);
  activeSubscriptions.forEach((sub, idx) => {
    console.log(`   ${idx + 1}. ${sub.id}`);
    console.log(`      Status: ${sub.status}`);
    console.log(`      Created: ${new Date(sub.created * 1000).toISOString()}`);
    console.log(`      Current Period End: ${new Date(sub.current_period_end * 1000).toISOString()}`);
  });

  if (activeSubscriptions.length <= 1) {
    console.log(`\n✅ No duplicates found for ${userEmail}`);
    return;
  }

  // Sort by creation date (most recent first)
  activeSubscriptions.sort((a, b) => b.created - a.created);

  // Keep the most recent subscription, cancel the rest
  const subscriptionToKeep = activeSubscriptions[0];
  const subscriptionsToCancel = activeSubscriptions.slice(1);

  console.log(`\n✅ Keeping subscription: ${subscriptionToKeep.id} (most recent)`);
  console.log(`❌ Canceling ${subscriptionsToCancel.length} duplicate subscription(s):`);

  for (const subToCancel of subscriptionsToCancel) {
    try {
      await stripe.subscriptions.cancel(subToCancel.id);
      console.log(`   ✅ Canceled: ${subToCancel.id}`);
    } catch (cancelError) {
      console.error(`   ❌ Failed to cancel ${subToCancel.id}:`, cancelError.message);
    }
  }

  // Update profile with the subscription we're keeping
  const subscriptionItem = subscriptionToKeep.items.data[0];
  if (subscriptionItem) {
    const priceId = subscriptionItem.price.id;
    const subscriptionType = 
      priceId === process.env.STRIPE_PRICE_ID_MONTHLY 
        ? "monthly" 
        : priceId === process.env.STRIPE_PRICE_ID_ANNUAL
        ? "annual" 
        : "none";

    await supabase
      .from("profiles")
      .update({
        subscription: subscriptionType,
        subscription_expiration: new Date(subscriptionToKeep.current_period_end * 1000).toISOString(),
        trial_expiration: subscriptionToKeep.trial_end ? new Date(subscriptionToKeep.trial_end * 1000).toISOString() : null,
      })
      .eq("id", profile.id);

    console.log(`\n✅ Updated profile subscription to: ${subscriptionType}`);
  }

  console.log(`\n✅ Fixed duplicate subscriptions for ${userEmail}\n`);
}

fixDuplicateSubscriptions().catch(console.error);

