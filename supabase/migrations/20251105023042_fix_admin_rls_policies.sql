-- Fix and ensure proper RLS policies for admins table
-- This ensures the admins table has proper policies that work with the is_admin() function

-- Ensure RLS is enabled on admins table
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate them properly
DROP POLICY IF EXISTS "Allow authenticated users to read admins" ON admins;
DROP POLICY IF EXISTS "Allow service role to access admins" ON admins;
DROP POLICY IF EXISTS "Admins can read admin table" ON admins;

-- Allow authenticated users to read admins table (needed for is_admin() function checks)
CREATE POLICY "Allow authenticated users to read admins" ON admins
  FOR SELECT 
  USING (auth.role() = 'authenticated');

-- Allow service role to access admins table (for background jobs if needed)
CREATE POLICY "Allow service role to access admins" ON admins
  FOR ALL 
  USING (auth.role() = 'service_role');

-- Note: Admins should not be able to insert/update/delete themselves through RLS
-- Admin management should be done through direct database access or service role
-- This prevents privilege escalation through RLS

