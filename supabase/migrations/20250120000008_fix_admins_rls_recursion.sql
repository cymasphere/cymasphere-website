-- Fix infinite recursion in admins table RLS policy
-- The issue is that the policy references auth.uid() which causes recursion

-- Drop the problematic policy
DROP POLICY IF EXISTS "Admins can read admin table" ON admins;

-- Disable RLS temporarily to fix the issue
ALTER TABLE admins DISABLE ROW LEVEL SECURITY;

-- Re-enable RLS with a proper policy
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- Create a simple policy that allows reading admins table
-- This policy allows any authenticated user to read the admins table
-- The actual admin check is done in the application logic
CREATE POLICY "Allow authenticated users to read admins" ON admins
  FOR SELECT USING (auth.role() = 'authenticated');

-- Also allow service role to access
CREATE POLICY "Allow service role to access admins" ON admins
  FOR ALL USING (auth.role() = 'service_role');
