import { NextRequest, NextResponse } from 'next/server'
import { createClient } from "@/utils/supabase/server";

export async function GET(request: NextRequest) {
  // Check for admin auth (cron secret or authenticated admin)
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  
  // Allow cron access OR authenticated admin access
  const isCronAccess = authHeader && authHeader.startsWith('Bearer ') && authHeader.slice(7) === cronSecret;
  
  const supabase = await createClient();
  
  if (!isCronAccess) {
    // Check if user is authenticated admin
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const { data: adminCheck } = await supabase
      .from('admins')
      .select('id')
      .eq('user', user.id)
      .single();

    if (!adminCheck) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }
  }

  try {
    // Get recent email sends
    const { data: sends, error: sendsError } = await supabase
      .from('email_sends')
      .select('*')
      .order('sent_at', { ascending: false })
      .limit(10);

    // Get recent email opens
    const { data: opens, error: opensError } = await supabase
      .from('email_opens')
      .select('*')
      .order('opened_at', { ascending: false })
      .limit(10);

    // Get recent campaigns with stats
    const { data: campaigns, error: campaignsError } = await supabase
      .from('email_campaigns')
      .select('id, name, status, emails_sent, emails_opened, emails_clicked, total_recipients')
      .in('status', ['sent', 'completed'])
      .order('sent_at', { ascending: false })
      .limit(5);

    return NextResponse.json({ 
      message: 'Email Tracking Debug Data',
      sends: sends || [],
      opens: opens || [],
      campaigns: campaigns || [],
      errors: {
        sends: sendsError?.message,
        opens: opensError?.message,
        campaigns: campaignsError?.message
      }
    })
  } catch (error) {
    return NextResponse.json({ 
      error: 'Debug failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 