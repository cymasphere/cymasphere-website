-- Add RLS policies for tutorial tables
-- This migration enables Row Level Security and creates policies for:
-- - tutorial_videos: All authenticated users can read, admins can manage
-- - tutorial_playlists: All authenticated users can read, admins can manage  
-- - playlist_videos: All authenticated users can read, admins can manage
-- - user_tutorial_paths: Users can read/write their own, admins can read all

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

