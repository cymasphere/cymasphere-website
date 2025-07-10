-- Upgrade subscribers table to robust version
-- Add missing columns, constraints, and related tables

-- First create the subscriber_status ENUM if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subscriber_status') THEN
    CREATE TYPE subscriber_status AS ENUM ('active', 'unsubscribed', 'bounced', 'pending');
  END IF;
END $$;

-- Add missing columns to subscribers table
ALTER TABLE subscribers 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS unsubscribe_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS source VARCHAR(100),
ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Update status column to use proper ENUM (need to do this carefully)
-- First add new status column
ALTER TABLE subscribers ADD COLUMN IF NOT EXISTS new_status subscriber_status DEFAULT 'active';

-- Migrate existing status values
UPDATE subscribers SET new_status = 
  CASE 
    WHEN status = 'subscribed' THEN 'active'::subscriber_status
    WHEN status = 'unsubscribed' THEN 'unsubscribed'::subscriber_status
    WHEN status = 'pending' THEN 'pending'::subscriber_status
    ELSE 'active'::subscriber_status
  END;

-- Drop old status column and rename new one
ALTER TABLE subscribers DROP COLUMN IF EXISTS status;
ALTER TABLE subscribers RENAME COLUMN new_status TO status;

-- Add email validation constraint
ALTER TABLE subscribers DROP CONSTRAINT IF EXISTS subscribers_email_check;
ALTER TABLE subscribers ADD CONSTRAINT subscribers_email_check 
  CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

-- Add business logic constraints
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'valid_unsubscribe_date') THEN
    ALTER TABLE subscribers ADD CONSTRAINT valid_unsubscribe_date 
      CHECK (unsubscribe_date IS NULL OR unsubscribe_date >= subscribe_date);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'valid_status_dates') THEN
    ALTER TABLE subscribers ADD CONSTRAINT valid_status_dates 
      CHECK (
        (status = 'unsubscribed' AND unsubscribe_date IS NOT NULL) OR 
        (status != 'unsubscribed' AND unsubscribe_date IS NULL)
      );
  END IF;
END $$;

-- Update user_id for existing subscribers by matching email
UPDATE subscribers 
SET user_id = auth_users.id
FROM auth.users AS auth_users
WHERE subscribers.email = auth_users.email 
AND subscribers.user_id IS NULL;

-- Create subscriber imports tracking table
CREATE TABLE IF NOT EXISTS subscriber_imports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename VARCHAR(255) NOT NULL,
  total_rows INTEGER NOT NULL,
  successful_imports INTEGER DEFAULT 0,
  failed_imports INTEGER DEFAULT 0,
  import_status VARCHAR(50) DEFAULT 'processing' CHECK (import_status IN ('processing', 'completed', 'failed')),
  error_log TEXT,
  imported_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create subscriber tags table
CREATE TABLE IF NOT EXISTS subscriber_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  color VARCHAR(7) DEFAULT '#007bff', -- Hex color code
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for subscribers updated_at
DROP TRIGGER IF EXISTS update_subscribers_updated_at ON subscribers;
CREATE TRIGGER update_subscribers_updated_at 
  BEFORE UPDATE ON subscribers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_subscribers_user_id ON subscribers(user_id);
CREATE INDEX IF NOT EXISTS idx_subscribers_status ON subscribers(status);
CREATE INDEX IF NOT EXISTS idx_subscribers_source ON subscribers(source);
CREATE INDEX IF NOT EXISTS idx_subscribers_created_at ON subscribers(created_at);

-- Enable RLS on new tables
ALTER TABLE subscriber_imports ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriber_tags ENABLE ROW LEVEL SECURITY;

-- Create basic RLS policies
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admin can manage subscriber imports' AND tablename = 'subscriber_imports') THEN
    CREATE POLICY "Admin can manage subscriber imports" ON subscriber_imports
      FOR ALL USING (
        EXISTS (SELECT 1 FROM admins WHERE admins.user = auth.uid())
      );
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admin can manage subscriber tags' AND tablename = 'subscriber_tags') THEN
    CREATE POLICY "Admin can manage subscriber tags" ON subscriber_tags
      FOR ALL USING (
        EXISTS (SELECT 1 FROM admins WHERE admins.user = auth.uid())
      );
  END IF;
END $$; 