-- Add template-audience relationships (intended audiences for templates)
-- This allows templates to have default/intended audiences that can be overridden in campaigns

-- Create junction table for template-audience relationships (many-to-many)
CREATE TABLE IF NOT EXISTS email_template_audiences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES email_templates(id) ON DELETE CASCADE,
  audience_id UUID REFERENCES email_audiences(id) ON DELETE CASCADE,
  is_excluded BOOLEAN DEFAULT FALSE, -- TRUE for excluded audiences, FALSE for included
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(template_id, audience_id, is_excluded)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_template_audiences_template ON email_template_audiences(template_id);
CREATE INDEX IF NOT EXISTS idx_template_audiences_audience ON email_template_audiences(audience_id);
CREATE INDEX IF NOT EXISTS idx_template_audiences_excluded ON email_template_audiences(is_excluded);

-- Enable RLS on the new table
ALTER TABLE email_template_audiences ENABLE ROW LEVEL SECURITY;

-- Create policy for admin access to template audiences
CREATE POLICY "Admins can manage template audiences" ON email_template_audiences
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM admins 
    WHERE admins.user = auth.uid()
  )
);

-- Add comment for documentation
COMMENT ON TABLE email_template_audiences IS 'Junction table linking templates to their intended/default audiences. These can be overridden when creating campaigns from templates.';
COMMENT ON COLUMN email_template_audiences.is_excluded IS 'FALSE = included audience, TRUE = excluded audience for this template'; 