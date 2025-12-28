/**
 * Script to fix a user's purchase association
 * Finds the Stripe customer by email and links it to the profile
 * Usage: node fix-user-purchase.js <email>
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

if (!email) {
  console.error('❌ Please provide an email address');
  console.error('Usage: node fix-user-purchase.js <email>');
  process.exit(1);
}

async function fixUserPurchase() {
  console.log(`\n🔍 Fixing purchase association for: ${email}\n`);
  console.log('='.repeat(80));

  // 1. Find user in profiles table
  console.log('\n📋 1. FINDING USER PROFILE');
  console.log('-'.repeat(80));
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('email', email)
    .single();

  if (profileError || !profile) {
    console.log('❌ User not found in profiles table');
    console.log('Error:', profileError?.message);
    return;
  }

  console.log('✅ User found:');
  console.log(`   ID: ${profile.id}`);
  console.log(`   Email: ${profile.email}`);
  console.log(`   Current Customer ID: ${profile.customer_id || 'N/A'}`);
  console.log(`   Current Subscription: ${profile.subscription || 'none'}`);

  // 2. Search Stripe for customer by email
  console.log('\n📋 2. SEARCHING STRIPE FOR CUSTOMER');
  console.log('-'.repeat(80));
  
  let stripeCustomer = null;
  try {
    const customers = await stripe.customers.list({
      email: email,
      limit: 100,
    });

    if (customers.data.length === 0) {
      console.log('❌ No Stripe customer found with this email');
      return;
    }

    if (customers.data.length > 1) {
      console.log(`⚠️  Found ${customers.data.length} customers with this email. Using the most recent one.`);
    }

    stripeCustomer = customers.data[0];
    console.log('✅ Stripe Customer found:');
    console.log(`   ID: ${stripeCustomer.id}`);
    console.log(`   Email: ${stripeCustomer.email}`);
    console.log(`   Created: ${new Date(stripeCustomer.created * 1000).toISOString()}`);

    // Check if this customer ID is already linked to a different profile
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('customer_id', stripeCustomer.id)
      .single();

    if (existingProfile && existingProfile.id !== profile.id) {
      console.log(`\n⚠️  WARNING: This customer ID is already linked to another profile:`);
      console.log(`   Profile ID: ${existingProfile.id}`);
      console.log(`   Email: ${existingProfile.email}`);
      console.log(`\n   This might indicate duplicate accounts. Proceeding anyway...`);
    }
  } catch (stripeError) {
    console.log('❌ Error searching Stripe:', stripeError.message);
    return;
  }

  // 3. Check for lifetime purchase
  console.log('\n📋 3. CHECKING FOR LIFETIME PURCHASE');
  console.log('-'.repeat(80));
  
  const lifetimePriceId = process.env.STRIPE_PRICE_ID_LIFETIME;
  const lifetimePriceId2 = process.env.LIFETIME_PRICE_ID_2;

  let hasLifetime = false;
  let lifetimeInvoice = null;

  try {
    // Check invoices
    const invoices = await stripe.invoices.list({
      customer: stripeCustomer.id,
      limit: 100,
      status: 'paid',
      expand: ['data.lines.data.price'],
    });

    console.log(`   Found ${invoices.data.length} paid invoices`);

    for (const invoice of invoices.data) {
      // Check metadata
      const hasMetadata = invoice.metadata?.purchase_type === 'lifetime';
      
      // Check line items
      const hasLifetimePrice = invoice.lines.data.some(
        (line) =>
          line.price?.id === lifetimePriceId ||
          (lifetimePriceId2 && line.price?.id === lifetimePriceId2)
      );

      if (hasMetadata || hasLifetimePrice) {
        hasLifetime = true;
        lifetimeInvoice = invoice;
        console.log(`\n✅ Lifetime purchase found!`);
        console.log(`   Invoice ID: ${invoice.id}`);
        console.log(`   Amount: $${(invoice.amount_paid / 100).toFixed(2)}`);
        console.log(`   Date: ${new Date(invoice.created * 1000).toISOString()}`);
        console.log(`   Has Metadata: ${hasMetadata}`);
        console.log(`   Has Lifetime Price: ${hasLifetimePrice}`);
        break;
      }
    }

    if (!hasLifetime) {
      // Check payment intents
      console.log(`\n   Checking payment intents...`);
      const paymentIntents = await stripe.paymentIntents.list({
        customer: stripeCustomer.id,
        limit: 100,
      });

      for (const pi of paymentIntents.data) {
        if (pi.metadata?.purchase_type === 'lifetime' && pi.status === 'succeeded') {
          hasLifetime = true;
          console.log(`\n✅ Lifetime purchase found in payment intent!`);
          console.log(`   Payment Intent ID: ${pi.id}`);
          console.log(`   Amount: $${(pi.amount / 100).toFixed(2)}`);
          console.log(`   Date: ${new Date(pi.created * 1000).toISOString()}`);
          break;
        }
      }
    }

    if (!hasLifetime) {
      console.log('❌ No lifetime purchase found for this customer');
      console.log('   The customer may have purchased a subscription instead, or the purchase may not be complete.');
    }
  } catch (error) {
    console.log('❌ Error checking for lifetime purchase:', error.message);
  }

  // 4. Link customer ID to profile
  console.log('\n📋 4. LINKING CUSTOMER ID TO PROFILE');
  console.log('-'.repeat(80));
  
  if (profile.customer_id === stripeCustomer.id) {
    console.log('✅ Customer ID already linked correctly');
  } else {
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ customer_id: stripeCustomer.id })
      .eq('id', profile.id);

    if (updateError) {
      console.log('❌ Error updating customer ID:', updateError.message);
      return;
    }

    console.log('✅ Customer ID linked to profile');
  }

  // 5. Refresh subscription status
  console.log('\n📋 5. REFRESHING SUBSCRIPTION STATUS');
  console.log('-'.repeat(80));
  
  try {
    const { data: updatedProfile } = await supabase
      .from('profiles')
      .select('subscription, subscription_expiration, subscription_source')
      .eq('id', profile.id)
      .single();

    console.log('   Current status before refresh:');
    console.log(`   Subscription: ${updatedProfile?.subscription || 'none'}`);
    console.log(`   Source: ${updatedProfile?.subscription_source || 'none'}`);

    // If we found a lifetime purchase, set it directly
    if (hasLifetime) {
      console.log('\n   Setting lifetime subscription...');
      const { error: lifetimeError } = await supabase
        .from('profiles')
        .update({
          subscription: 'lifetime',
          subscription_expiration: null,
          subscription_source: 'stripe',
        })
        .eq('id', profile.id);

      if (lifetimeError) {
        console.log('❌ Error setting lifetime subscription:', lifetimeError.message);
      } else {
        console.log('✅ Lifetime subscription set successfully');
      }
    } else {
      console.log('\n   No lifetime purchase found - checking for subscriptions...');
      // Check for active subscriptions
      const subscriptions = await stripe.subscriptions.list({
        customer: stripeCustomer.id,
        limit: 100,
      });

      const activeSub = subscriptions.data.find(
        sub => sub.status === 'active' || sub.status === 'trialing'
      );

      if (activeSub) {
        const monthlyPriceId = process.env.STRIPE_PRICE_ID_MONTHLY;
        const annualPriceId = process.env.STRIPE_PRICE_ID_ANNUAL;
        const priceId = activeSub.items.data[0]?.price?.id;
        
        let subType = 'none';
        if (priceId === monthlyPriceId) subType = 'monthly';
        else if (priceId === annualPriceId) subType = 'annual';

        if (subType !== 'none') {
          const expiration = new Date(activeSub.current_period_end * 1000);
          const { error: subError } = await supabase
            .from('profiles')
            .update({
              subscription: subType,
              subscription_expiration: expiration.toISOString(),
              subscription_source: 'stripe',
            })
            .eq('id', profile.id);

          if (subError) {
            console.log('❌ Error setting subscription:', subError.message);
          } else {
            console.log(`✅ ${subType} subscription set successfully`);
          }
        }
      }
    }
  } catch (error) {
    console.log('❌ Error refreshing subscription:', error.message);
  }

  // 6. Final status
  console.log('\n📋 6. FINAL STATUS');
  console.log('-'.repeat(80));
  
  const { data: finalProfile } = await supabase
    .from('profiles')
    .select('subscription, subscription_expiration, subscription_source, customer_id')
    .eq('id', profile.id)
    .single();

  console.log('✅ Final Profile Status:');
  console.log(`   Customer ID: ${finalProfile?.customer_id || 'N/A'}`);
  console.log(`   Subscription: ${finalProfile?.subscription || 'none'}`);
  console.log(`   Subscription Source: ${finalProfile?.subscription_source || 'none'}`);
  console.log(`   Expiration: ${finalProfile?.subscription_expiration || 'N/A'}`);

  console.log('\n' + '='.repeat(80));
  console.log('✅ Fix complete!\n');
  console.log('⚠️  NOTE: If subscription is still "none", you may need to:');
  console.log('   1. Run updateUserProStatus via admin panel');
  console.log('   2. Or manually verify the Stripe purchase data');
  console.log('');
}

fixUserPurchase().catch(console.error);

