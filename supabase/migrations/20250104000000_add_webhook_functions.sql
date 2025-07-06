-- Functions to update campaign counts from webhooks

-- Function to increment campaign delivered count
CREATE OR REPLACE FUNCTION increment_campaign_delivered(campaign_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE email_campaigns 
  SET emails_delivered = COALESCE(emails_delivered, 0) + 1,
      updated_at = NOW()
  WHERE id = campaign_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment campaign bounced count
CREATE OR REPLACE FUNCTION increment_campaign_bounced(campaign_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE email_campaigns 
  SET emails_bounced = COALESCE(emails_bounced, 0) + 1,
      updated_at = NOW()
  WHERE id = campaign_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment campaign spam count
CREATE OR REPLACE FUNCTION increment_campaign_spam(campaign_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE email_campaigns 
  SET emails_spam = COALESCE(emails_spam, 0) + 1,
      updated_at = NOW()
  WHERE id = campaign_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add emails_spam column to email_campaigns table if it doesn't exist
ALTER TABLE email_campaigns 
ADD COLUMN IF NOT EXISTS emails_spam INTEGER DEFAULT 0;

-- Add message_id column to email_sends table if it doesn't exist
ALTER TABLE email_sends 
ADD COLUMN IF NOT EXISTS message_id VARCHAR(255);

-- Add index for message_id lookups
CREATE INDEX IF NOT EXISTS idx_email_sends_message_id ON email_sends(message_id);

-- Add bounce_reason column to subscribers table if it doesn't exist
ALTER TABLE subscribers 
ADD COLUMN IF NOT EXISTS bounce_reason TEXT,
ADD COLUMN IF NOT EXISTS bounced_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS complained_at TIMESTAMP WITH TIME ZONE;

-- Update subscriber status enum to include 'bounced' and 'complained'
ALTER TYPE subscriber_status ADD VALUE IF NOT EXISTS 'bounced';
ALTER TYPE subscriber_status ADD VALUE IF NOT EXISTS 'complained';

-- Create email_webhook_logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS email_webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider VARCHAR(100) NOT NULL,
  event_type VARCHAR(100) NOT NULL,
  webhook_data JSONB NOT NULL,
  processed BOOLEAN DEFAULT false,
  campaign_id UUID REFERENCES email_campaigns(id) ON DELETE SET NULL,
  subscriber_id UUID REFERENCES subscribers(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for webhook processing
CREATE INDEX IF NOT EXISTS idx_webhook_logs_unprocessed ON email_webhook_logs(created_at) WHERE processed = false;
CREATE INDEX IF NOT EXISTS idx_webhook_logs_provider_event ON email_webhook_logs(provider, event_type); 