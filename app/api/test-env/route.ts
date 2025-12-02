import { NextResponse } from 'next/server';

export async function GET() {
  const hasServiceKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
  const hasUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
  
  return NextResponse.json({
    hasServiceKey,
    hasUrl,
    serviceKeyLength: hasServiceKey ? process.env.SUPABASE_SERVICE_ROLE_KEY!.length : 0,
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || 'NOT SET',
    allSupabaseVars: Object.keys(process.env).filter(k => k.includes('SUPABASE'))
  });
}

