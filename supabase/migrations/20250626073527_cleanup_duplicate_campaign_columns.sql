-- Clean up duplicate columns in email_campaigns table
-- Remove old columns that were replaced by new ones

-- Only drop columns if they exist to avoid errors
DO $$ 
BEGIN
    -- Drop old columns if they exist
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'email_campaigns' AND column_name = 'from_name') THEN
        ALTER TABLE email_campaigns DROP COLUMN from_name;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'email_campaigns' AND column_name = 'from_email') THEN
        ALTER TABLE email_campaigns DROP COLUMN from_email;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'email_campaigns' AND column_name = 'reply_to') THEN
        ALTER TABLE email_campaigns DROP COLUMN reply_to;
    END IF;
END $$;

-- Ensure the new columns have the correct constraints
ALTER TABLE email_campaigns 
ALTER COLUMN sender_name TYPE VARCHAR(255),
ALTER COLUMN sender_email TYPE VARCHAR(255),
ALTER COLUMN reply_to_email TYPE VARCHAR(255);

-- Add comments to document the schema
COMMENT ON COLUMN email_campaigns.sender_name IS 'Campaign sender display name';
COMMENT ON COLUMN email_campaigns.sender_email IS 'Campaign sender email address';  
COMMENT ON COLUMN email_campaigns.reply_to_email IS 'Reply-to email address for campaign';
COMMENT ON COLUMN email_campaigns.preheader IS 'Email preheader text shown in inbox preview';
COMMENT ON COLUMN email_campaigns.html_content IS 'Campaign HTML content';
COMMENT ON COLUMN email_campaigns.text_content IS 'Campaign plain text content';
