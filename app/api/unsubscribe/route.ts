import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { email, action = 'unsubscribe' } = await request.json();

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 400 }
      );
    }

    if (action === 'unsubscribe') {
      // Handle unsubscribe
      const { data: subscriber, error: fetchError } = await supabase
        .from('subscribers')
        .select('id, email, status, unsubscribe_date')
        .eq('email', email.toLowerCase())
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        return NextResponse.json(
          { success: false, error: 'Failed to fetch subscriber' },
          { status: 500 }
        );
      }

      if (!subscriber) {
        // Create a new inactive subscriber record
        const { error: insertError } = await supabase
          .from('subscribers')
          .insert({
            email: email.toLowerCase(),
            status: 'INACTIVE',
            unsubscribe_date: new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (insertError) {
          console.error('Error creating inactive subscriber:', insertError);
          return NextResponse.json(
            { success: false, error: 'Failed to unsubscribe' },
            { status: 500 }
          );
        }

        return NextResponse.json({
          success: true,
          message: 'Successfully unsubscribed from emails',
          email: email.toLowerCase(),
          status: 'INACTIVE'
        });
      }

      // Update existing subscriber
      const { error: updateError } = await supabase
        .from('subscribers')
        .update({
          status: 'INACTIVE',
          unsubscribe_date: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', subscriber.id);

      if (updateError) {
        console.error('Error updating subscriber:', updateError);
        return NextResponse.json(
          { success: false, error: 'Failed to unsubscribe' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Successfully unsubscribed from emails',
        email: email.toLowerCase(),
        status: 'INACTIVE'
      });

    } else if (action === 'resubscribe') {
      // Handle resubscribe
      const { data: subscriber, error: fetchError } = await supabase
        .from('subscribers')
        .select('id, email, status')
        .eq('email', email.toLowerCase())
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        return NextResponse.json(
          { success: false, error: 'Failed to fetch subscriber' },
          { status: 500 }
        );
      }

      if (!subscriber) {
        return NextResponse.json(
          { success: false, error: 'Subscriber not found' },
          { status: 404 }
        );
      }

      // Update subscriber status to active
      const { error: updateError } = await supabase
        .from('subscribers')
        .update({
          status: 'ACTIVE',
          unsubscribe_date: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', subscriber.id);

      if (updateError) {
        console.error('Error updating subscriber:', updateError);
        return NextResponse.json(
          { success: false, error: 'Failed to resubscribe' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Successfully resubscribed to emails',
        email: email.toLowerCase(),
        status: 'ACTIVE'
      });

    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid action' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Unsubscribe API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
