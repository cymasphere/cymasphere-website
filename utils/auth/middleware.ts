import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/utils/supabase/server';
import { fetchUserPermissions } from '@/utils/supabase/actions';

export async function requireAdManagerAccess(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer();
    
    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' }, 
        { status: 401 }
      );
    }

    // Check if user has ad manager permissions
    const { can_access_ad_manager, error: permError } = await fetchUserPermissions(user.id);
    
    if (permError) {
      console.error('Error checking permissions:', permError);
      return NextResponse.json(
        { error: 'Permission check failed' }, 
        { status: 500 }
      );
    }

    if (!can_access_ad_manager) {
      return NextResponse.json(
        { error: 'Ad Manager access required' }, 
        { status: 403 }
      );
    }

    // User is authenticated and has ad manager access
    return null; // Allow request to continue
  } catch (error) {
    console.error('Auth middleware error:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}

export async function withAdManagerAuth(
  handler: (request: NextRequest, ...args: any[]) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...args: any[]) => {
    const authResult = await requireAdManagerAccess(request);
    if (authResult) {
      return authResult; // Return error response
    }
    return handler(request, ...args); // Continue to handler
  };
} 