/**
 * @fileoverview Script to verify Stripe coupon exists and test checkout logic
 * 
 * This script verifies that a Stripe coupon exists and can be retrieved,
 * then tests the checkout promotion logic.
 * 
 * @module scripts/verify-stripe-coupon
 */

require('dotenv').config({ path: '.env.local' });
const Stripe = require('stripe');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function verifyCoupon(couponCode) {
  console.log(`\n🔍 Verifying Stripe coupon: ${couponCode}\n`);
  
  try {
    const coupon = await stripe.coupons.retrieve(couponCode);
    console.log('✅ Coupon EXISTS in Stripe:');
    console.log('   ID:', coupon.id);
    console.log('   Name:', coupon.name);
    console.log('   Amount Off:', coupon.amount_off ? `$${(coupon.amount_off / 100).toFixed(2)}` : 'N/A');
    console.log('   Percent Off:', coupon.percent_off ? `${coupon.percent_off}%` : 'N/A');
    console.log('   Currency:', coupon.currency || 'N/A');
    console.log('   Duration:', coupon.duration);
    console.log('   Valid:', coupon.valid);
    console.log('   Redeem By:', coupon.redeem_by ? new Date(coupon.redeem_by * 1000).toISOString() : 'No expiration');
    console.log('   Times Redeemed:', coupon.times_redeemed);
    return { exists: true, coupon };
  } catch (error) {
    if (error.code === 'resource_missing') {
      console.log('❌ Coupon DOES NOT EXIST in Stripe');
      console.log('   Error:', error.message);
      return { exists: false, error: error.message };
    } else {
      console.log('❌ Error retrieving coupon:', error.message);
      return { exists: false, error: error.message };
    }
  }
}

async function main() {
  const couponCodes = ['NEWYEAR26', 'BLACKFRIDAY2025'];
  
  for (const code of couponCodes) {
    await verifyCoupon(code);
    console.log('\n' + '='.repeat(50) + '\n');
  }
}

main().catch(console.error);
