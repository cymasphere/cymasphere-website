-- Clean up automation trigger types
-- The current system uses automation_trigger enum with basic types
-- Add subscription_change trigger type and remove unwanted functions

-- First, remove any unwanted trigger functions and triggers if they exist
DROP TRIGGER IF EXISTS automation_email_open_trigger ON email_opens;
DROP FUNCTION IF EXISTS process_email_open_trigger();

DROP TRIGGER IF EXISTS automation_email_click_trigger ON email_clicks;
DROP FUNCTION IF EXISTS process_email_click_trigger();

-- Add subscription_change to the existing automation_trigger enum
ALTER TYPE automation_trigger ADD VALUE IF NOT EXISTS 'subscription_change';

-- Update the automation_trigger enum comment
COMMENT ON TYPE automation_trigger IS 'Available automation trigger types: signup, purchase, abandonment, anniversary, behavior, custom, subscription_change';

-- Ensure any test automations with invalid trigger types are cleaned up
DELETE FROM email_automations 
WHERE trigger_type::text IN ('email_open', 'email_click', 'segment_entry');
