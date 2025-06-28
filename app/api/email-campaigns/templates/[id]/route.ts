import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/utils/supabase/server';

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
    const resolvedParams = await params;
    const templateId = resolvedParams.id;

    // Fetch the template
    const { data: template, error } = await supabase
      .from('email_templates')
      .select('*')
      .eq('id', templateId)
      .single();

    if (error) {
      console.error('Error fetching template:', error);
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Template not found' }, { status: 404 });
      }
      return NextResponse.json({ error: 'Failed to fetch template' }, { status: 500 });
    }

    // Get audience relationships from junction table
    const { data: audienceRelations, error: audienceError } = await supabase
      .from('email_template_audiences')
      .select('audience_id, is_excluded')
      .eq('template_id', templateId);

    if (audienceError) {
      console.error('Error fetching template audiences:', audienceError);
      // Don't fail the request, just log the error
    }

    // Separate included and excluded audiences
    const audienceIds: string[] = [];
    const excludedAudienceIds: string[] = [];

    if (audienceRelations) {
      for (const relation of audienceRelations) {
        if (relation.audience_id) { // Check for null
          if (relation.is_excluded) {
            excludedAudienceIds.push(relation.audience_id);
          } else {
            audienceIds.push(relation.audience_id);
          }
        }
      }
    }

    // Transform the data for frontend consumption
    const transformedTemplate = {
      ...template,
      type: template.template_type, // Map to frontend expected field name
      htmlContent: template.html_content, // Map to frontend expected field name
      textContent: template.text_content, // Map to frontend expected field name
      audienceIds,
      excludedAudienceIds
    };

    return NextResponse.json({
      success: true,
      template: transformedTemplate
    });

  } catch (error) {
    console.error('Template API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 