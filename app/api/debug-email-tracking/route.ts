import { NextRequest, NextResponse } from 'next/server'
import { createClient } from "@supabase/supabase-js";

export async function GET(request: NextRequest) {
  // Check for admin auth
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  
  if (!authHeader || !authHeader.startsWith('Bearer ') || authHeader.slice(7) !== cronSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Use admin client
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

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