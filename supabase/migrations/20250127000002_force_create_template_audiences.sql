-- Force create the email_template_audiences table (it seems the previous migration didn't work)

-- Drop table if it exists and recreate it
DROP TABLE IF EXISTS email_template_audiences CASCADE;

-- Create junction table for template-audience relationships (many-to-many)
CREATE TABLE email_template_audiences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES email_templates(id) ON DELETE CASCADE,
  audience_id UUID NOT NULL REFERENCES email_audiences(id) ON DELETE CASCADE,
  is_excluded BOOLEAN NOT NULL DEFAULT FALSE, -- TRUE for excluded audiences, FALSE for included
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_template_audience_exclusion UNIQUE(template_id, audience_id, is_excluded)
);

-- Add indexes for performance
CREATE INDEX idx_template_audiences_template ON email_template_audiences(template_id);
CREATE INDEX idx_template_audiences_audience ON email_template_audiences(audience_id);
CREATE INDEX idx_template_audiences_excluded ON email_template_audiences(is_excluded);

-- Enable RLS on the new table
ALTER TABLE email_template_audiences ENABLE ROW LEVEL SECURITY;

-- Create policy for admin access to template audiences
CREATE POLICY "Admins can manage template audiences" ON email_template_audiences
FOR ALL USING (is_admin(auth.uid()));

-- Add comment for documentation
COMMENT ON TABLE email_template_audiences IS 'Junction table linking templates to their intended/default audiences. These can be overridden when creating campaigns from templates.';
COMMENT ON COLUMN email_template_audiences.is_excluded IS 'FALSE = included audience, TRUE = excluded audience for this template'; 