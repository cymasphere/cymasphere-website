-- Re-enable RLS on email_campaigns table
ALTER TABLE email_campaigns ENABLE ROW LEVEL SECURITY;

-- Recreate the is_admin function to ensure it works properly
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admins 
    WHERE "user" = user_id::text
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a proper admin policy using the is_admin function
CREATE POLICY "Admins can manage campaigns" ON email_campaigns
  FOR ALL USING (is_admin(auth.uid())); 