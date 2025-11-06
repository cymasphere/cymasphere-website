-- Combined RLS policies migration
-- This migration combines multiple RLS policy migrations:
-- - Tutorial tables RLS policies
-- - Email campaign tables RLS policies
-- - Email tracking tables RLS policies
-- - Email campaign audiences fix and storage policies

-- =============================================
-- Tutorial Tables RLS Policies
-- =============================================
-- Enable RLS on tutorial_videos
ALTER TABLE tutorial_videos ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read tutorial videos
CREATE POLICY "Allow authenticated users to read tutorial videos" ON tutorial_videos
  FOR SELECT 
  USING (auth.role() = 'authenticated');

-- Allow admins to insert tutorial videos
CREATE POLICY "Allow admins to insert tutorial videos" ON tutorial_videos
  FOR INSERT 
  WITH CHECK (is_admin(auth.uid()));

-- Allow admins to update tutorial videos
CREATE POLICY "Allow admins to update tutorial videos" ON tutorial_videos
  FOR UPDATE 
  USING (is_admin(auth.uid()));

-- Allow admins to delete tutorial videos
CREATE POLICY "Allow admins to delete tutorial videos" ON tutorial_videos
  FOR DELETE 
  USING (is_admin(auth.uid()));

-- Enable RLS on tutorial_playlists
ALTER TABLE tutorial_playlists ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read tutorial playlists
CREATE POLICY "Allow authenticated users to read tutorial playlists" ON tutorial_playlists
  FOR SELECT 
  USING (auth.role() = 'authenticated');

-- Allow admins to insert tutorial playlists
CREATE POLICY "Allow admins to insert tutorial playlists" ON tutorial_playlists
  FOR INSERT 
  WITH CHECK (is_admin(auth.uid()));

-- Allow admins to update tutorial playlists
CREATE POLICY "Allow admins to update tutorial playlists" ON tutorial_playlists
  FOR UPDATE 
  USING (is_admin(auth.uid()));

-- Allow admins to delete tutorial playlists
CREATE POLICY "Allow admins to delete tutorial playlists" ON tutorial_playlists
  FOR DELETE 
  USING (is_admin(auth.uid()));

-- Enable RLS on playlist_videos (junction table)
ALTER TABLE playlist_videos ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read playlist_videos
CREATE POLICY "Allow authenticated users to read playlist_videos" ON playlist_videos
  FOR SELECT 
  USING (auth.role() = 'authenticated');

-- Allow admins to insert playlist_videos
CREATE POLICY "Allow admins to insert playlist_videos" ON playlist_videos
  FOR INSERT 
  WITH CHECK (is_admin(auth.uid()));

-- Allow admins to update playlist_videos
CREATE POLICY "Allow admins to update playlist_videos" ON playlist_videos
  FOR UPDATE 
  USING (is_admin(auth.uid()));

-- Allow admins to delete playlist_videos
CREATE POLICY "Allow admins to delete playlist_videos" ON playlist_videos
  FOR DELETE 
  USING (is_admin(auth.uid()));

-- Enable RLS on user_tutorial_paths
ALTER TABLE user_tutorial_paths ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own tutorial paths
CREATE POLICY "Allow users to read their own tutorial paths" ON user_tutorial_paths
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Allow users to insert their own tutorial paths
CREATE POLICY "Allow users to insert their own tutorial paths" ON user_tutorial_paths
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own tutorial paths
CREATE POLICY "Allow users to update their own tutorial paths" ON user_tutorial_paths
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Allow admins to read all tutorial paths
CREATE POLICY "Allow admins to read all tutorial paths" ON user_tutorial_paths
  FOR SELECT 
  USING (is_admin(auth.uid()));

-- =============================================
-- Email Campaign Tables RLS Policies
-- =============================================
-- Ensure RLS is enabled on all email campaign tables
ALTER TABLE email_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_audiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_audience_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_campaign_audiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_sends ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_opens ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_automations ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_ab_tests ENABLE ROW LEVEL SECURITY;

-- Email campaigns policies (admins can manage all)
DROP POLICY IF EXISTS "Admins can manage campaigns" ON email_campaigns;
CREATE POLICY "Admins can manage campaigns" ON email_campaigns
  FOR ALL 
  USING (is_admin(auth.uid()));

-- Email audiences policies (admins can manage all)
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

-- Email campaign audiences policies (admins can manage all)
-- Note: This will be fixed/ensured in the later section
DROP POLICY IF EXISTS "Admins can manage campaign audiences" ON email_campaign_audiences;
CREATE POLICY "Admins can manage campaign audiences" ON email_campaign_audiences
  FOR ALL 
  USING (is_admin(auth.uid()));

-- Email sends policies (admins can manage all, needed for tracking)
CREATE POLICY "Admins can manage email sends" ON email_sends
  FOR ALL 
  USING (is_admin(auth.uid()));

-- Email templates policies (admins can manage all)
DROP POLICY IF EXISTS "Admins can manage templates" ON email_templates;
CREATE POLICY "Admins can manage templates" ON email_templates
  FOR ALL 
  USING (is_admin(auth.uid()));

-- Subscribers table policies (ensure admins can manage all)
DROP POLICY IF EXISTS "Admins can manage all subscribers" ON subscribers;
DROP POLICY IF EXISTS "Admin can manage subscribers" ON subscribers;
CREATE POLICY "Admins can manage all subscribers" ON subscribers
  FOR ALL 
  USING (is_admin(auth.uid()));

-- Email automations policies (admins can manage all)
DROP POLICY IF EXISTS "Admins can manage automations" ON email_automations;
CREATE POLICY "Admins can manage automations" ON email_automations
  FOR ALL 
  USING (is_admin(auth.uid()));

-- A/B tests policies (admins can manage all)
DROP POLICY IF EXISTS "Admins can manage ab tests" ON email_ab_tests;
CREATE POLICY "Admins can manage ab tests" ON email_ab_tests
  FOR ALL 
  USING (is_admin(auth.uid()));

-- =============================================
-- Email Tracking Tables RLS Policies
-- =============================================
-- Note: Tracking pixels use the service role key to bypass RLS entirely
-- This allows them to insert tracking records and update campaign statistics
-- without authentication. The RLS policies below protect against direct access.

-- Allow anonymous inserts for email tracking (fallback - tracking routes use service role key)
-- This is a safety net in case we need anonymous inserts, but the service role key is preferred
DROP POLICY IF EXISTS "Allow anonymous inserts for email opens" ON email_opens;
CREATE POLICY "Allow anonymous inserts for email opens" ON email_opens
  FOR INSERT 
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anonymous inserts for email clicks" ON email_clicks;
CREATE POLICY "Allow anonymous inserts for email clicks" ON email_clicks
  FOR INSERT 
  WITH CHECK (true);

-- Allow admins to manage all tracking data
DROP POLICY IF EXISTS "Admins can manage email opens" ON email_opens;
DROP POLICY IF EXISTS "Admins can read email opens" ON email_opens;
CREATE POLICY "Admins can manage email opens" ON email_opens
  FOR ALL 
  USING (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can manage email clicks" ON email_clicks;
DROP POLICY IF EXISTS "Admins can read email clicks" ON email_clicks;
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

-- =============================================
-- Storage Bucket Policies for email-assets
-- =============================================
-- Note: Supabase storage uses bucket-level policies, not RLS
-- This migration assumes the email-assets bucket already exists
-- Bucket creation should be done manually via Supabase dashboard or CLI

-- Create storage policies for email-assets bucket
-- Admins can upload, update, and delete files
CREATE POLICY "Admins can upload to email-assets" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'email-assets' AND
    is_admin(auth.uid())
  );

CREATE POLICY "Admins can update email-assets" ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'email-assets' AND
    is_admin(auth.uid())
  )
  WITH CHECK (
    bucket_id = 'email-assets' AND
    is_admin(auth.uid())
  );

CREATE POLICY "Admins can delete from email-assets" ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'email-assets' AND
    is_admin(auth.uid())
  );

-- Public read access for email-assets (needed for email clients to display images)
CREATE POLICY "Public can read email-assets" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'email-assets');

-- Admins can list files in email-assets bucket
CREATE POLICY "Admins can list email-assets" ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'email-assets' AND
    is_admin(auth.uid())
  );
