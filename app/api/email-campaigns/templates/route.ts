import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/utils/supabase/server';

export async function GET(request: NextRequest) {
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

    // Get search and filter parameters
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const type = searchParams.get('type') || '';
    const status = searchParams.get('status') || '';

    // Build query
    let query = supabase
      .from('email_templates')
      .select(`
        id,
        name,
        description,
        subject,
        template_type,
        status,
        variables,
        created_by,
        last_used_at,
        created_at,
        updated_at
      `)
      .order('updated_at', { ascending: false });

    // Apply filters
    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%,subject.ilike.%${search}%`);
    }
    
    if (type && ['welcome', 'newsletter', 'promotional', 'transactional', 'custom'].includes(type)) {
      query = query.eq('template_type', type as any);
    }
    
    if (status && ['draft', 'active', 'archived'].includes(status)) {
      query = query.eq('status', status as any);
    }

    const { data: templates, error } = await query;

    if (error) {
      console.error('Error fetching templates:', error);
      return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 });
    }

    // Calculate usage statistics for each template
    const templateIds = templates?.map((t: any) => t.id) || [];
    let usageStats: Record<string, number> = {};

    if (templateIds.length > 0) {
      const { data: campaigns } = await supabase
        .from('email_campaigns')
        .select('template_id')
        .in('template_id', templateIds);

      // Count usage per template
      campaigns?.forEach((campaign: any) => {
        if (campaign.template_id) {
          usageStats[campaign.template_id] = (usageStats[campaign.template_id] || 0) + 1;
        }
      });
    }

    // Fetch intended audiences for all templates
    let templateAudiences: Record<string, { included: string[], excluded: string[] }> = {};
    
    if (templateIds.length > 0) {
      const { data: audienceRelations, error: audienceError } = await supabase
        .from('email_template_audiences')
        .select('template_id, audience_id, is_excluded')
        .in('template_id', templateIds);

      if (audienceError) {
        console.error('Error fetching template audiences:', audienceError);
        // Continue without audience data if there's an error
      } else {
        // Group audiences by template
        audienceRelations?.forEach((relation: any) => {
          if (!templateAudiences[relation.template_id]) {
            templateAudiences[relation.template_id] = { included: [], excluded: [] };
          }
          
          if (relation.is_excluded) {
            templateAudiences[relation.template_id].excluded.push(relation.audience_id);
          } else {
            templateAudiences[relation.template_id].included.push(relation.audience_id);
          }
        });
      }
    }

    // Add usage count and intended audiences to each template
    const templatesWithUsage = templates?.map((template: any) => ({
      ...template,
      usage_count: usageStats[template.id] || 0,
      type: template.template_type, // Map to frontend expected field name
      audienceIds: templateAudiences[template.id]?.included || [],
      excludedAudienceIds: templateAudiences[template.id]?.excluded || []
    })) || [];

    return NextResponse.json({
      success: true,
      templates: templatesWithUsage,
      total: templatesWithUsage.length
    });

  } catch (error) {
    console.error('Templates API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServer();
  
  console.log('🔐 POST /api/email-campaigns/templates called');
  console.log('📝 Headers:', Object.fromEntries(request.headers.entries()));
  
  // Get authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  console.log('👤 User:', user ? `${user.email} (${user.id})` : 'null');
  console.log('❌ Auth error:', authError);
  
  if (authError || !user) {
    console.log('🚫 Returning 401 - Authentication required');
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
    const body = await request.json();
    const { 
      name, 
      subject, 
      description,
      htmlContent,
      textContent,
      template_type = 'custom',
      audienceIds = [],
      excludedAudienceIds = [],
      status = 'draft',
      variables = {}
    } = body;

    console.log('📊 Template data received:', {
      name, subject, audienceIds, excludedAudienceIds
    });

    if (!name || !subject) {
      return NextResponse.json({ 
        error: 'Name and subject are required' 
      }, { status: 400 });
    }

    // Create template
    const { data: template, error } = await supabase
      .from('email_templates')
      .insert({
        name,
        description,
        subject,
        html_content: htmlContent,
        text_content: textContent,
        template_type,
        status,
        variables,
        created_by: user.id
      })
      .select()
      .single();

    if (error) {
      console.error('🚨 Database error creating template:', error);
      console.error('🚨 Error details:', JSON.stringify(error, null, 2));
      return NextResponse.json({ 
        error: 'Failed to create template',
        details: error.message 
      }, { status: 500 });
    }

    console.log('✅ Template created:', template.id);

    // Handle intended audience relationships
    const audienceInserts = [];

    // Add included audiences
    for (const audienceId of audienceIds) {
      audienceInserts.push({
        template_id: template.id,
        audience_id: audienceId,
        is_excluded: false
      });
    }

    // Add excluded audiences
    for (const audienceId of excludedAudienceIds) {
      audienceInserts.push({
        template_id: template.id,
        audience_id: audienceId,
        is_excluded: true
      });
    }

    // Insert audience relationships if any
    console.log('🎯 Audience inserts to create:', audienceInserts);
    
    if (audienceInserts.length > 0) {
      const { error: audienceError } = await supabase
        .from('email_template_audiences')
        .insert(audienceInserts);

      if (audienceError) {
        console.error('🚨 Database error creating template audiences:', audienceError);
        console.error('🚨 Audience error details:', JSON.stringify(audienceError, null, 2));
        // Don't fail the entire request, just log the error
        console.warn('⚠️ Template created but audience relationships failed');
      } else {
        console.log(`✅ Created ${audienceInserts.length} template audience relationships`);
      }
    } else {
      console.log('ℹ️ No audience relationships to create');
    }

    return NextResponse.json({ 
      template: {
        ...template,
        type: template.template_type,
        usage_count: 0,
        audienceIds,
        excludedAudienceIds
      },
      audienceCount: audienceInserts.length
    }, { status: 201 });

  } catch (error) {
    console.error('Create template API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const supabase = await createSupabaseServer();
  
  console.log('🔥 PUT /api/email-campaigns/templates called');
  
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
    const body = await request.json();
    const {
      id,
      name,
      description,
      subject,
      htmlContent,
      textContent,
      template_type = 'custom',
      status = 'draft',
      variables = {},
      audienceIds = [],
      excludedAudienceIds = []
    } = body;

    console.log('📊 Template update data received:', {
      id, name, subject, audienceIds, excludedAudienceIds
    });

    // Validate required fields
    if (!id || !name) {
      return NextResponse.json({ error: 'Template ID and name are required' }, { status: 400 });
    }

  // Update template
  const { data: template, error } = await supabase
    .from('email_templates')
    .update({
      name,
      description,
      subject,
      html_content: htmlContent,
      text_content: textContent,
      template_type,
      status,
      variables,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('🚨 Database error updating template:', error);
    console.error('🚨 Error details:', JSON.stringify(error, null, 2));
    return NextResponse.json({ 
      error: 'Failed to update template',
      details: error.message 
    }, { status: 500 });
  }

  console.log('✅ Template updated:', template.id);

  // Update audience relationships by replacing existing ones
  // First, delete existing relationships
  const { error: deleteError } = await supabase
    .from('email_template_audiences')
    .delete()
    .eq('template_id', id);

  if (deleteError) {
    console.error('🚨 Database error deleting existing template audiences:', deleteError);
    // Don't fail the entire request, just log the error
    console.warn('⚠️ Template updated but failed to delete existing audience relationships');
  }

  // Handle updated intended audience relationships
  const audienceInserts = [];

  // Add included audiences
  for (const audienceId of audienceIds) {
    audienceInserts.push({
      template_id: id,
      audience_id: audienceId,
      is_excluded: false
    });
  }

  // Add excluded audiences
  for (const audienceId of excludedAudienceIds) {
    audienceInserts.push({
      template_id: id,
      audience_id: audienceId,
      is_excluded: true
    });
  }

  // Insert new audience relationships if any
  if (audienceInserts.length > 0) {
    const { error: audienceError } = await supabase
      .from('email_template_audiences')
      .insert(audienceInserts);

    if (audienceError) {
      console.error('🚨 Database error updating template audiences:', audienceError);
      // Don't fail the entire request, just log the error
      console.warn('⚠️ Template updated but audience relationships may have failed');
    } else {
      console.log(`✅ Updated ${audienceInserts.length} template audience relationships`);
    }
  }

    return NextResponse.json({
      template: {
        ...template,
        type: template.template_type,
        usage_count: 0, // Would need separate query to get usage count
        audienceIds,
        excludedAudienceIds
      },
      audienceCount: audienceInserts.length
    });

  } catch (error) {
    console.error('Update template API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 