-- Add RLS policies for email campaign tables
-- This migration ensures all email campaign tables have proper RLS policies
-- All access is restricted to admins only

-- Ensure RLS is enabled on all email campaign tables
ALTER TABLE email_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_audiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_audience_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_sends ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_opens ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;

-- Email campaigns policies (admins can manage all)
DROP POLICY IF EXISTS "Admins can manage campaigns" ON email_campaigns;
CREATE POLICY "Admins can manage campaigns" ON email_campaigns
  FOR ALL 
  USING (is_admin(auth.uid()));

-- Email audiences policies (admins can manage all)
-- Note: These may already exist from previous migrations, but we ensure they're correct
DROP POLICY IF EXISTS "Admins can view all audiences" ON email_audiences;
DROP POLICY IF EXISTS "Admins can insert audiences" ON email_audiences;
DROP POLICY IF EXISTS "Admins can update audiences" ON email_audiences;
DROP POLICY IF EXISTS "Admins can delete audiences" ON email_audiences;
DROP POLICY IF EXISTS "Admins can manage audiences" ON email_audiences;

CREATE POLICY "Admins can manage audiences" ON email_audiences
  FOR ALL 
  USING (is_admin(auth.uid()));

-- Email audience subscribers policies (admins can manage all)
CREATE POLICY "Admins can manage audience subscribers" ON email_audience_subscribers
  FOR ALL 
  USING (is_admin(auth.uid()));

-- Email sends policies (admins can read all, needed for tracking)
CREATE POLICY "Admins can manage email sends" ON email_sends
  FOR ALL 
  USING (is_admin(auth.uid()));

-- Email opens policies (admins can read all, needed for analytics)
CREATE POLICY "Admins can manage email opens" ON email_opens
  FOR ALL 
  USING (is_admin(auth.uid()));

-- Email clicks policies (admins can read all, needed for analytics)
CREATE POLICY "Admins can manage email clicks" ON email_clicks
  FOR ALL 
  USING (is_admin(auth.uid()));

-- Email templates policies (admins can manage all)
-- Note: May already exist from previous migrations
DROP POLICY IF EXISTS "Admins can manage templates" ON email_templates;
CREATE POLICY "Admins can manage templates" ON email_templates
  FOR ALL 
  USING (is_admin(auth.uid()));

-- Subscribers table policies (ensure admins can manage all)
-- Note: These may already exist, but we ensure they're correct
DROP POLICY IF EXISTS "Admins can manage all subscribers" ON subscribers;
DROP POLICY IF EXISTS "Admin can manage subscribers" ON subscribers;
CREATE POLICY "Admins can manage all subscribers" ON subscribers
  FOR ALL 
  USING (is_admin(auth.uid()));

