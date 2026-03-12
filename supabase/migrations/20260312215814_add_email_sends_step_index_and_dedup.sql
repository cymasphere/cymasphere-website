-- Add step_index to email_sends (only meaningful for automations; campaigns are always 0).
ALTER TABLE email_sends ADD COLUMN IF NOT EXISTS step_index INTEGER DEFAULT 0;

-- Campaigns: single email per audience. Dedup = one send per (subscriber, campaign).
CREATE UNIQUE INDEX IF NOT EXISTS idx_email_sends_campaign_dedup
  ON email_sends (subscriber_id, campaign_id)
  WHERE campaign_id IS NOT NULL AND status != 'failed';

-- Automations: multi-step flows. Dedup = one send per (subscriber, automation, step).
CREATE UNIQUE INDEX IF NOT EXISTS idx_email_sends_automation_dedup
  ON email_sends (subscriber_id, automation_id, step_index)
  WHERE automation_id IS NOT NULL AND status != 'failed';
