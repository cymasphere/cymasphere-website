/**
 * @fileoverview Test script to verify checkout promotion logic
 * 
 * This script simulates the checkout promotion lookup logic to verify
 * it correctly finds and applies promotions.
 * 
 * @module scripts/test-checkout-promotion
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testPromotionLookup(planType) {
  console.log(`\n🔍 Testing promotion lookup for plan: ${planType}\n`);
  
  try {
    // Fetch all active promotions
    const { data: promotions, error: promoError } = await supabase
      .from('promotions')
      .select('*')
      .eq('active', true)
      .order('priority', { ascending: false });

    if (promoError) {
      console.error('❌ Error fetching promotions:', promoError);
      return;
    }

    console.log(`📊 Found ${promotions?.length || 0} active promotions\n`);

    if (!promotions || promotions.length === 0) {
      console.log('ℹ️ No active promotions found');
      return;
    }

    const now = new Date();
    console.log(`⏰ Current time: ${now.toISOString()}\n`);

    // Find applicable promotion
    const activePromotion = promotions.find(promo => {
      console.log(`\n📋 Checking promotion: ${promo.name} (${promo.title})`);
      console.log(`   Priority: ${promo.priority}`);
      console.log(`   Applicable plans: ${JSON.stringify(promo.applicable_plans)}`);
      console.log(`   Start date: ${promo.start_date || 'No start date'}`);
      console.log(`   End date: ${promo.end_date || 'No end date'}`);
      
      // Check if plan is applicable
      const planApplicable = promo.applicable_plans && 
        Array.isArray(promo.applicable_plans) && 
        promo.applicable_plans.includes(planType);
      
      console.log(`   Plan applicable (${planType}): ${planApplicable ? '✅' : '❌'}`);
      
      if (!planApplicable) {
        console.log(`   ❌ Skipping - plan not applicable`);
        return false;
      }

      // Check date range
      const startDate = promo.start_date ? new Date(promo.start_date) : null;
      const endDate = promo.end_date ? new Date(promo.end_date) : null;
      
      const startValid = !startDate || startDate <= now;
      const endValid = !endDate || endDate >= now;

      console.log(`   Start valid: ${startValid ? '✅' : '❌'} ${startDate ? `(${startDate.toISOString()})` : ''}`);
      console.log(`   End valid: ${endValid ? '✅' : '❌'} ${endDate ? `(${endDate.toISOString()})` : ''}`);

      const isValid = startValid && endValid;
      console.log(`   Overall valid: ${isValid ? '✅' : '❌'}`);

      return isValid;
    });

    if (activePromotion) {
      console.log(`\n✅ Found applicable promotion:`);
      console.log(`   Name: ${activePromotion.name}`);
      console.log(`   Title: ${activePromotion.title}`);
      console.log(`   Coupon Code: ${activePromotion.stripe_coupon_code}`);
      console.log(`   Discount: ${activePromotion.discount_type === 'percentage' ? `${activePromotion.discount_value}%` : `$${activePromotion.discount_value}`}`);
      console.log(`   Priority: ${activePromotion.priority}`);
      return activePromotion;
    } else {
      console.log(`\n❌ No applicable promotion found for ${planType} plan`);
      return null;
    }
  } catch (error) {
    console.error('❌ Error in promotion lookup:', error);
    return null;
  }
}

async function main() {
  console.log('🧪 Testing Checkout Promotion Logic\n');
  console.log('='.repeat(60));
  
  await testPromotionLookup('lifetime');
  
  console.log('\n' + '='.repeat(60) + '\n');
}

main().catch(console.error);
