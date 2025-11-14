-- Migration to create user_management table
-- This table allows granting pro status to users based on their email
-- Can be integrated with Supabase invite feature in the future

-- Create user_management table
CREATE TABLE IF NOT EXISTS user_management (
  user_email TEXT PRIMARY KEY,
  pro BOOLEAN NOT NULL DEFAULT FALSE,
  notes TEXT
);

-- Add comment to the table for documentation
COMMENT ON TABLE user_management IS 'Manages user pro status and notes based on email address';

-- Add comments to columns for documentation
COMMENT ON COLUMN user_management.user_email IS 'User email address (primary key)';
COMMENT ON COLUMN user_management.pro IS 'Whether the user has pro status';
COMMENT ON COLUMN user_management.notes IS 'Additional notes about the user';

-- Create index on pro status for faster queries
CREATE INDEX IF NOT EXISTS idx_user_management_pro ON user_management(pro);

-- Enable Row Level Security
ALTER TABLE user_management ENABLE ROW LEVEL SECURITY;

-- Admin policy: Admins can access everything
CREATE POLICY "Admins can manage user_management" ON user_management
  FOR ALL
  USING (is_admin(auth.uid()));

-- User policy: Authenticated users can select their own row
CREATE POLICY "Users can view their own user_management" ON user_management
  FOR SELECT
  USING (
    auth.role() = 'authenticated' 
    AND user_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

