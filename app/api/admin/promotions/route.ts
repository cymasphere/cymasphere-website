import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

/**
 * GET - Fetch all promotions
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: adminCheck } = await supabase
      .from('admins')
      .select('*')
      .eq('user', user.id)
      .single();

    if (!adminCheck) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch all promotions
    const { data: promotions, error } = await supabase
      .from('promotions')
      .select('*')
      .order('priority', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching promotions:', error);
      return NextResponse.json({ error: 'Failed to fetch promotions' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      promotions,
    });
  } catch (error) {
    console.error('Error in GET /api/admin/promotions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST - Create or update a promotion
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: adminCheck } = await supabase
      .from('admins')
      .select('*')
      .eq('user', user.id)
      .single();

    if (!adminCheck) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const {
      id,
      name,
      title,
      description,
      active,
      start_date,
      end_date,
      applicable_plans,
      discount_type,
      discount_value,
      stripe_coupon_code,
      create_stripe_coupon,
      banner_theme,
      priority,
    } = body;

    // Calculate sale prices based on discount
    const NORMAL_PRICES = {
      monthly: 6,
      annual: 59,
      lifetime: 149,
    };

    const calculateSalePrice = (normalPrice: number) => {
      if (discount_type === 'percentage') {
        return Math.round(normalPrice * (1 - discount_value / 100));
      } else {
        return normalPrice - discount_value;
      }
    };

    const sale_prices = {
      sale_price_monthly: applicable_plans.includes('monthly') 
        ? calculateSalePrice(NORMAL_PRICES.monthly) 
        : null,
      sale_price_annual: applicable_plans.includes('annual') 
        ? calculateSalePrice(NORMAL_PRICES.annual) 
        : null,
      sale_price_lifetime: applicable_plans.includes('lifetime') 
        ? calculateSalePrice(NORMAL_PRICES.lifetime) 
        : null,
    };

    // Create Stripe coupon if requested
    let stripe_coupon_id = body.stripe_coupon_id;
    let stripe_coupon_created = body.stripe_coupon_created || false;

    if (create_stripe_coupon && stripe_coupon_code) {
      try {
        console.log('🔍 Checking if Stripe coupon exists:', stripe_coupon_code);
        console.log('📋 Promotion details:', { discount_type, discount_value, title });
        
        // Validate coupon code format (Stripe allows alphanumeric, underscores, hyphens)
        const couponCodeRegex = /^[a-zA-Z0-9_-]+$/;
        if (!couponCodeRegex.test(stripe_coupon_code)) {
          throw new Error(`Invalid coupon code format. Only letters, numbers, underscores, and hyphens are allowed.`);
        }
        
        // Check if coupon already exists
        let coupon;
        try {
          coupon = await stripe.coupons.retrieve(stripe_coupon_code);
          console.log('✅ Stripe coupon already exists:', stripe_coupon_code);
          stripe_coupon_id = coupon.id;
          stripe_coupon_created = true;
        } catch (err: any) {
          if (err.code === 'resource_missing') {
            // Coupon doesn't exist, create it
            console.log('📝 Coupon not found, creating new one...');
            
            // Validate discount value
            if (!discount_value || discount_value <= 0) {
              throw new Error('Discount value must be greater than 0');
            }
            
            if (discount_type === 'percentage' && discount_value > 100) {
              throw new Error('Percentage discount cannot exceed 100%');
            }

            const couponParams: Stripe.CouponCreateParams = {
              id: stripe_coupon_code,
              name: title || stripe_coupon_code,
              duration: 'once',
            };

            if (discount_type === 'percentage') {
              couponParams.percent_off = Math.round(discount_value);
              console.log(`💰 Creating ${discount_value}% OFF coupon`);
            } else {
              // For amount off, use the discount_value directly (assumed to be in dollars)
              const amountInCents = Math.round(discount_value * 100);
              couponParams.amount_off = amountInCents;
              couponParams.currency = 'usd';
              console.log(`💰 Creating $${discount_value} OFF coupon (${amountInCents} cents)`);
            }

            console.log('🎫 Coupon parameters:', JSON.stringify(couponParams, null, 2));
            
            try {
              coupon = await stripe.coupons.create(couponParams);
              console.log('✅ Successfully created Stripe coupon:', coupon.id);
              console.log('📊 Coupon details:', {
                id: coupon.id,
                name: coupon.name,
                percent_off: coupon.percent_off,
                amount_off: coupon.amount_off,
                currency: coupon.currency,
              });
              
              stripe_coupon_id = coupon.id;
              stripe_coupon_created = true;
            } catch (createError: any) {
              console.error('❌ Stripe coupon creation failed:', {
                code: createError.code,
                message: createError.message,
                type: createError.type,
                param: createError.param,
              });
              throw new Error(`Failed to create Stripe coupon: ${createError.message || 'Unknown error'}`);
            }
          } else {
            console.error('❌ Unexpected Stripe error:', err.code, err.message);
            throw err;
          }
        }
      } catch (error) {
        console.error('❌ Error with Stripe coupon:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({
          error: 'Failed to create Stripe coupon',
          details: errorMessage,
        }, { status: 500 });
      }
    } else {
      console.log('⏭️ Skipping Stripe coupon creation (checkbox not checked or code missing)');
    }

    // Convert date inputs to UTC timestamps
    const formatDateToUTC = (dateString: string | null | undefined) => {
      if (!dateString) return null;
      // Parse as local date and convert to UTC timestamp for storage
      const date = new Date(dateString + 'T00:00:00.000Z');
      return date.toISOString();
    };

    const promotionData = {
      name,
      title,
      description,
      active,
      start_date: formatDateToUTC(start_date),
      end_date: formatDateToUTC(end_date),
      applicable_plans,
      discount_type,
      discount_value,
      ...sale_prices,
      stripe_coupon_code,
      stripe_coupon_id,
      stripe_coupon_created,
      banner_theme,
      priority: priority || 0,
    };

    let result;
    if (id) {
      // Update existing promotion
      const { data, error } = await supabase
        .from('promotions')
        .update(promotionData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating promotion:', error);
        return NextResponse.json({ error: 'Failed to update promotion' }, { status: 500 });
      }
      result = data;
    } else {
      // Create new promotion
      const { data, error } = await supabase
        .from('promotions')
        .insert(promotionData)
        .select()
        .single();

      if (error) {
        console.error('Error creating promotion:', error);
        return NextResponse.json({ error: 'Failed to create promotion' }, { status: 500 });
      }
      result = data;
    }

    return NextResponse.json({
      success: true,
      promotion: result,
      stripe_coupon_created,
    });
  } catch (error) {
    console.error('Error in POST /api/admin/promotions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE - Delete a promotion
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: adminCheck } = await supabase
      .from('admins')
      .select('*')
      .eq('user', user.id)
      .single();

    if (!adminCheck) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Promotion ID required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('promotions')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting promotion:', error);
      return NextResponse.json({ error: 'Failed to delete promotion' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Promotion deleted successfully',
    });
  } catch (error) {
    console.error('Error in DELETE /api/admin/promotions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

