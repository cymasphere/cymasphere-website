import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

/**
 * POST - Track promotion view or conversion
 * Body: { promotion_id: string, type: 'view' | 'conversion', value?: number }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { promotion_id, type, value } = body;

    if (!promotion_id || !type) {
      return NextResponse.json(
        { error: 'promotion_id and type required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    if (type === 'view') {
      // Increment view count
      const { error } = await supabase.rpc('increment_promotion_view', {
        promotion_id,
      });

      if (error) {
        console.error('Error tracking promotion view:', error);
        return NextResponse.json(
          { error: 'Failed to track view' },
          { status: 500 }
        );
      }
    } else if (type === 'conversion') {
      // Increment conversion count and revenue
      const { error } = await supabase.rpc('increment_promotion_conversion', {
        promotion_id,
        conversion_value: value || 0,
      });

      if (error) {
        console.error('Error tracking promotion conversion:', error);
        return NextResponse.json(
          { error: 'Failed to track conversion' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error('Error in POST /api/promotions/track:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

