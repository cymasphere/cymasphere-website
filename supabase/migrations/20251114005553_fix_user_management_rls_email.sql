-- Fix user_management RLS policy to use JWT email instead of querying auth.users
-- This avoids permission issues with accessing auth.users table directly

-- Drop the existing user policy
DROP POLICY IF EXISTS "Users can view their own user_management" ON user_management;

-- Recreate the user policy using JWT email
CREATE POLICY "Users can view their own user_management" ON user_management
  FOR SELECT
  USING (
    auth.role() = 'authenticated' 
    AND user_email = (auth.jwt() ->> 'email')
  );

