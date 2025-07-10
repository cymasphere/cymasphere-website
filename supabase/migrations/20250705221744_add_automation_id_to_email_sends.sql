-- Add automation_id to email_sends table for tracking automation emails
ALTER TABLE email_sends 
ADD COLUMN IF NOT EXISTS automation_id UUID REFERENCES email_automations(id) ON DELETE SET NULL;

-- Add message_id column if it doesn't exist (for SES message tracking)
ALTER TABLE email_sends 
ADD COLUMN IF NOT EXISTS message_id VARCHAR(255);

-- Add index for automation email tracking
CREATE INDEX IF NOT EXISTS idx_email_sends_automation_id ON email_sends(automation_id) WHERE automation_id IS NOT NULL;

-- Add index for message_id tracking
CREATE INDEX IF NOT EXISTS idx_email_sends_message_id ON email_sends(message_id) WHERE message_id IS NOT NULL;
