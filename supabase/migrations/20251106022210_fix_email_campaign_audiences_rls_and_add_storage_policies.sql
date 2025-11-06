-- Fix email_campaign_audiences RLS policy to use is_admin() function
-- This ensures consistency with other email campaign table policies

-- Ensure RLS is enabled
ALTER TABLE email_campaign_audiences ENABLE ROW LEVEL SECURITY;

-- Drop old policy if it exists
DROP POLICY IF EXISTS "Admins can manage campaign audiences" ON email_campaign_audiences;

-- Create new policy using is_admin() function for consistency
CREATE POLICY "Admins can manage campaign audiences" ON email_campaign_audiences
  FOR ALL 
  USING (is_admin(auth.uid()));

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

