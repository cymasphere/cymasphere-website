-- Fix subscribers table RLS policies
-- Allow authenticated users and admins to access subscribers

-- Drop existing policies if any
DROP POLICY IF EXISTS "Admin can manage subscribers" ON subscribers;
DROP POLICY IF EXISTS "Users can view all subscribers" ON subscribers;

-- Create proper policies for subscribers table
CREATE POLICY "Admin can manage subscribers" ON subscribers
  FOR ALL USING (
    EXISTS (SELECT 1 FROM admins WHERE admins.user = auth.uid())
  );

-- Allow authenticated users to view subscribers (for email campaigns)
CREATE POLICY "Authenticated users can view subscribers" ON subscribers
  FOR SELECT USING (auth.role() = 'authenticated');

-- Allow service role full access (for migrations and admin operations)
CREATE POLICY "Service role can manage subscribers" ON subscribers
  FOR ALL USING (auth.role() = 'service_role'); 