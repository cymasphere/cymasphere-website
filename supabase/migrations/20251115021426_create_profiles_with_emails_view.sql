-- Drop the old profiles_with_emails view if it exists
DROP VIEW IF EXISTS profiles_with_emails CASCADE;

-- Add email column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email TEXT;

-- Populate email column from auth.users
UPDATE profiles p
SET email = au.email
FROM auth.users au
WHERE p.id = au.id AND p.email IS NULL;

-- Note: Email is synced from auth.users via the UPDATE statement above
-- The trigger approach has limitations accessing auth.users from public schema
-- Emails are now in the profiles table and can be queried directly for sorting/filtering

