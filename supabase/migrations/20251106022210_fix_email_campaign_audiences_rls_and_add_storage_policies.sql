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
-- We need to create the bucket and set up policies via SQL

-- Create the email-assets bucket if it doesn't exist
-- Note: file_size_limit is in bytes (104857600 = 100MB for videos)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'email-assets',
  'email-assets',
  true, -- Public bucket for email client access
  104857600, -- 100MB limit for videos (larger than 10MB for images)
  ARRAY[
    'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
    'video/mp4', 'video/webm', 'video/ogg'
  ]
)
ON CONFLICT (id) DO UPDATE
SET 
  public = true,
  file_size_limit = 104857600,
  allowed_mime_types = ARRAY[
    'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
    'video/mp4', 'video/webm', 'video/ogg'
  ];

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

