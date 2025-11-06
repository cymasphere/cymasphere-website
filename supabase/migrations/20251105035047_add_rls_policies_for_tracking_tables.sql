-- Add RLS policies for email tracking tables
-- Note: Tracking pixels use the service role key to bypass RLS entirely
-- This allows them to insert tracking records and update campaign statistics
-- without authentication. The RLS policies below protect against direct access.

-- Ensure RLS is enabled on tracking tables
ALTER TABLE email_opens ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_clicks ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts for email tracking (fallback - tracking routes use service role key)
-- This is a safety net in case we need anonymous inserts, but the service role key is preferred
CREATE POLICY IF NOT EXISTS "Allow anonymous inserts for email opens" ON email_opens
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Allow anonymous inserts for email clicks" ON email_clicks
  FOR INSERT 
  WITH CHECK (true);

-- Allow admins to manage all tracking data
-- Note: These policies may already exist from previous migrations
DROP POLICY IF EXISTS "Admins can manage email opens" ON email_opens;
DROP POLICY IF EXISTS "Admins can read email opens" ON email_opens;
DROP POLICY IF EXISTS "Admins can manage email clicks" ON email_clicks;
DROP POLICY IF EXISTS "Admins can read email clicks" ON email_clicks;

CREATE POLICY "Admins can manage email opens" ON email_opens
  FOR ALL 
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can manage email clicks" ON email_clicks
  FOR ALL 
  USING (is_admin(auth.uid()));

-- Note: Tracking routes use the service role key to bypass RLS entirely
-- This is necessary because:
-- 1. Tracking pixels need to work without authentication
-- 2. They need to update email_campaigns statistics (requires admin access)
-- 3. They need to check for existing records (SELECT)
-- The anonymous insert policies are a fallback, but the service role key is the primary method
-- All reads are restricted to admins only to protect tracking data

