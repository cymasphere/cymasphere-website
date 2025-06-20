import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/utils/supabase/server';

// GET /api/email-campaigns/audiences/[id] - Get single audience
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createSupabaseServer();
  
  // Get authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return NextResponse.json({ 
      error: 'Authentication required' 
    }, { status: 401 });
  }

  // Check if user is admin
  const { data: adminCheck } = await supabase
    .from('admins')
    .select('*')
    .eq('user', user.id)
    .single();

  if (!adminCheck) {
    return NextResponse.json({ 
      error: 'Admin access required' 
    }, { status: 403 });
  }

  try {
    // Await params as required by Next.js
    const { id } = await params;

    const { data: audience, error } = await supabase
      .from('email_audiences')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ 
          error: 'Audience not found' 
        }, { status: 404 });
      }
      console.error('Error fetching audience:', error);
      return NextResponse.json({ 
        error: 'Failed to fetch audience' 
      }, { status: 500 });
    }

    return NextResponse.json({ audience });

  } catch (error) {
    console.error('Get audience API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

// PUT /api/email-campaigns/audiences/[id] - Update audience
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createSupabaseServer();
  
  // Get authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return NextResponse.json({ 
      error: 'Authentication required' 
    }, { status: 401 });
  }

  // Check if user is admin
  const { data: adminCheck } = await supabase
    .from('admins')
    .select('*')
    .eq('user', user.id)
    .single();

  if (!adminCheck) {
    return NextResponse.json({ 
      error: 'Admin access required' 
    }, { status: 403 });
  }

  try {
    // Await params as required by Next.js
    const { id } = await params;

    const body = await request.json();
    const { name, description, filters } = body;

    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (filters !== undefined) updateData.filters = filters;

    const { data: audience, error } = await supabase
      .from('email_audiences')
      .update(updateData)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ 
          error: 'Audience not found' 
        }, { status: 404 });
      }
      console.error('Error updating audience:', error);
      return NextResponse.json({ 
        error: 'Failed to update audience' 
      }, { status: 500 });
    }

    return NextResponse.json({ audience });

  } catch (error) {
    console.error('Update audience API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

// DELETE /api/email-campaigns/audiences/[id] - Delete audience
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createSupabaseServer();
  
  // Get authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return NextResponse.json({ 
      error: 'Authentication required' 
    }, { status: 401 });
  }

  // Check if user is admin
  const { data: adminCheck } = await supabase
    .from('admins')
    .select('*')
    .eq('user', user.id)
    .single();

  if (!adminCheck) {
    return NextResponse.json({ 
      error: 'Admin access required' 
    }, { status: 403 });
  }

  try {
    // Await params as required by Next.js
    const { id } = await params;

    const { error } = await supabase
      .from('email_audiences')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting audience:', error);
      return NextResponse.json({ 
        error: 'Failed to delete audience' 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      message: 'Audience deleted successfully' 
    });

  } catch (error) {
    console.error('Delete audience API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
} 