import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/utils/supabase/server';

export async function GET(request: NextRequest) {
  const supabase = await createSupabaseServer();
  
  // Get the authenticated user using proper authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return NextResponse.json({ 
      error: 'Not authenticated'
    }, { status: 401 });
  }

  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  // Check if user is admin
  const { data: adminCheck } = await supabase
    .from('admins')
    .select('*')
    .eq('user', user.id)
    .single();

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      profile,
      isAdmin: !!adminCheck,
      adminRecord: adminCheck
    }
  });
} 