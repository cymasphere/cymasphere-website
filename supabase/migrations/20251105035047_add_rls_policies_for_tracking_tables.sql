-- Add RLS policies for email tracking tables
-- These tables need to allow anonymous inserts (for email tracking pixels)
-- but restrict reads to admins only

-- Ensure RLS is enabled on tracking tables
ALTER TABLE email_opens ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_clicks ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts for email tracking (for tracking pixels in emails)
CREATE POLICY "Allow anonymous inserts for email opens" ON email_opens
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Allow anonymous inserts for email clicks" ON email_clicks
  FOR INSERT 
  WITH CHECK (true);

-- Allow admins to read all tracking data
-- Note: These policies may already exist from previous migrations
DROP POLICY IF EXISTS "Admins can manage email opens" ON email_opens;
DROP POLICY IF EXISTS "Admins can read email opens" ON email_opens;
DROP POLICY IF EXISTS "Admins can manage email clicks" ON email_clicks;
DROP POLICY IF EXISTS "Admins can read email clicks" ON email_clicks;

CREATE POLICY "Admins can read email opens" ON email_opens
  FOR SELECT 
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can read email clicks" ON email_clicks
  FOR SELECT 
  USING (is_admin(auth.uid()));

-- Note: Anonymous inserts are allowed for tracking, but reads are restricted to admins only
-- This allows email tracking pixels to work without authentication while protecting data

