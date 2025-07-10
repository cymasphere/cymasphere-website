-- Fix campaign schema to match frontend expectations
-- Add missing fields to email_campaigns table
ALTER TABLE email_campaigns 
ADD COLUMN IF NOT EXISTS preheader TEXT,
ADD COLUMN IF NOT EXISTS html_content TEXT,
ADD COLUMN IF NOT EXISTS text_content TEXT,
ADD COLUMN IF NOT EXISTS sender_name TEXT,
ADD COLUMN IF NOT EXISTS sender_email TEXT,
ADD COLUMN IF NOT EXISTS reply_to_email TEXT;

-- Copy data from old columns to new columns (if they exist)
UPDATE email_campaigns 
SET 
  sender_name = from_name,
  sender_email = from_email,
  reply_to_email = reply_to
WHERE sender_name IS NULL OR sender_email IS NULL OR reply_to_email IS NULL;

-- Create junction table for campaign-audience relationships (many-to-many)
CREATE TABLE IF NOT EXISTS email_campaign_audiences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES email_campaigns(id) ON DELETE CASCADE,
  audience_id UUID REFERENCES email_audiences(id) ON DELETE CASCADE,
  is_excluded BOOLEAN DEFAULT FALSE, -- TRUE for excluded audiences, FALSE for included
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(campaign_id, audience_id, is_excluded)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_campaign_audiences_campaign ON email_campaign_audiences(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_audiences_audience ON email_campaign_audiences(audience_id);
CREATE INDEX IF NOT EXISTS idx_campaign_audiences_excluded ON email_campaign_audiences(is_excluded);

-- Enable RLS on the new table
ALTER TABLE email_campaign_audiences ENABLE ROW LEVEL SECURITY;

-- Create policy for admin access to campaign audiences
CREATE POLICY "Admins can manage campaign audiences" ON email_campaign_audiences
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM admins 
    WHERE admins.user = auth.uid()
  )
);
