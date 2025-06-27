-- Fix RLS policy for email_templates table to match working campaigns policy
-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Admins can manage templates" ON email_templates;

-- Create a proper admin policy using the is_admin function (same as campaigns)
CREATE POLICY "Admins can manage templates" ON email_templates
  FOR ALL USING (is_admin(auth.uid())); 