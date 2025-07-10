-- Add usage_count field to email_templates table
ALTER TABLE email_templates ADD COLUMN IF NOT EXISTS usage_count INTEGER DEFAULT 0;

-- Create an index on usage_count for better performance when sorting by usage
CREATE INDEX IF NOT EXISTS idx_email_templates_usage_count ON email_templates(usage_count); 