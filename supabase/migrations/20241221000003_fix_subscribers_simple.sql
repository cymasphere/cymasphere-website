-- Simple Subscribers Table Creation
-- This creates just the essential subscribers table and trigger

-- Enable extensions if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create subscriber status enum
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subscriber_status') THEN
    CREATE TYPE subscriber_status AS ENUM ('active', 'unsubscribed', 'bounced', 'pending');
  END IF;
END $$;

-- Create subscribers table
CREATE TABLE IF NOT EXISTS subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  email VARCHAR(255) UNIQUE NOT NULL CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  status subscriber_status DEFAULT 'active',
  subscribe_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  unsubscribe_date TIMESTAMP WITH TIME ZONE,
  source VARCHAR(100) DEFAULT 'signup',
  metadata JSONB DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_subscribers_updated_at ON subscribers;
CREATE TRIGGER update_subscribers_updated_at 
  BEFORE UPDATE ON subscribers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to automatically create subscribers for new users
CREATE OR REPLACE FUNCTION create_subscriber_for_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create subscriber if user has a valid email
  IF NEW.email IS NOT NULL AND NEW.email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
    INSERT INTO subscribers (user_id, email, source, subscribe_date, status)
    VALUES (NEW.id, NEW.email, 'signup', NEW.created_at, 'active')
    ON CONFLICT (email) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic subscriber creation
DROP TRIGGER IF EXISTS create_subscriber_on_user_creation ON auth.users;
CREATE TRIGGER create_subscriber_on_user_creation
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_subscriber_for_new_user();

-- Backfill existing users as subscribers
INSERT INTO subscribers (user_id, email, source, subscribe_date, status)
SELECT 
  u.id,
  u.email,
  'backfill' as source,
  u.created_at as subscribe_date,
  'active' as status
FROM auth.users u
LEFT JOIN subscribers s ON u.id = s.user_id
WHERE u.deleted_at IS NULL 
  AND u.email IS NOT NULL 
  AND u.email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
  AND s.user_id IS NULL
ON CONFLICT (email) DO NOTHING;

-- Show results
DO $$
DECLARE
  user_count INTEGER;
  subscriber_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO user_count FROM auth.users WHERE deleted_at IS NULL;
  SELECT COUNT(*) INTO subscriber_count FROM subscribers;
  
  RAISE NOTICE 'Migration Complete:';
  RAISE NOTICE 'Total Users: %', user_count;
  RAISE NOTICE 'Total Subscribers: %', subscriber_count;
END $$; 