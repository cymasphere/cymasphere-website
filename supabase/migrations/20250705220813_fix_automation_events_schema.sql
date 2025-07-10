-- Fix automation_events table schema
-- Add event_source column if it doesn't exist
ALTER TABLE automation_events ADD COLUMN IF NOT EXISTS event_source VARCHAR(100) DEFAULT 'system';

-- Update any existing events without event_source
UPDATE automation_events 
SET event_source = 'system' 
WHERE event_source IS NULL;
