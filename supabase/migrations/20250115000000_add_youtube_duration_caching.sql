-- Add YouTube duration caching to tutorial_videos table
-- This migration adds fields to cache YouTube video durations and track when they were last updated

-- Add duration caching fields to tutorial_videos table
ALTER TABLE tutorial_videos 
ADD COLUMN IF NOT EXISTS youtube_duration_cached INTEGER DEFAULT NULL,
ADD COLUMN IF NOT EXISTS youtube_duration_last_updated TIMESTAMP WITH TIME ZONE DEFAULT NULL,
ADD COLUMN IF NOT EXISTS youtube_duration_cache_version INTEGER DEFAULT 1;

-- Add index for efficient duration lookups
CREATE INDEX IF NOT EXISTS idx_tutorial_videos_youtube_duration_cached 
ON tutorial_videos(youtube_duration_cached) 
WHERE youtube_duration_cached IS NOT NULL;

-- Add index for cache invalidation queries
CREATE INDEX IF NOT EXISTS idx_tutorial_videos_youtube_duration_last_updated 
ON tutorial_videos(youtube_duration_last_updated) 
WHERE youtube_duration_last_updated IS NOT NULL;

-- Add comment explaining the caching system
COMMENT ON COLUMN tutorial_videos.youtube_duration_cached IS 'Cached YouTube video duration in seconds. NULL means not cached yet.';
COMMENT ON COLUMN tutorial_videos.youtube_duration_last_updated IS 'When the YouTube duration was last fetched and cached. Used for cache invalidation.';
COMMENT ON COLUMN tutorial_videos.youtube_duration_cache_version IS 'Version number for cache invalidation. Increment when video metadata changes.';

-- Create function to invalidate duration cache when video metadata changes
CREATE OR REPLACE FUNCTION invalidate_youtube_duration_cache()
RETURNS TRIGGER AS $$
BEGIN
  -- If youtube_video_id changed, invalidate the cache
  IF OLD.youtube_video_id IS DISTINCT FROM NEW.youtube_video_id THEN
    NEW.youtube_duration_cached := NULL;
    NEW.youtube_duration_last_updated := NULL;
    NEW.youtube_duration_cache_version := COALESCE(OLD.youtube_duration_cache_version, 1) + 1;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically invalidate cache when video metadata changes
DROP TRIGGER IF EXISTS trigger_invalidate_youtube_duration_cache ON tutorial_videos;
CREATE TRIGGER trigger_invalidate_youtube_duration_cache
  BEFORE UPDATE ON tutorial_videos
  FOR EACH ROW
  EXECUTE FUNCTION invalidate_youtube_duration_cache();

-- Create function to get videos that need duration caching
CREATE OR REPLACE FUNCTION get_videos_needing_duration_cache(
  max_age_hours INTEGER DEFAULT 24,
  limit_count INTEGER DEFAULT 100
)
RETURNS TABLE (
  id UUID,
  youtube_video_id TEXT,
  youtube_duration_cached INTEGER,
  youtube_duration_last_updated TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    tv.id,
    tv.youtube_video_id,
    tv.youtube_duration_cached,
    tv.youtube_duration_last_updated
  FROM tutorial_videos tv
  WHERE tv.youtube_video_id IS NOT NULL
    AND (
      tv.youtube_duration_cached IS NULL 
      OR tv.youtube_duration_last_updated IS NULL
      OR tv.youtube_duration_last_updated < NOW() - INTERVAL '1 hour' * max_age_hours
    )
  ORDER BY 
    CASE 
      WHEN tv.youtube_duration_cached IS NULL THEN 1
      WHEN tv.youtube_duration_last_updated IS NULL THEN 2
      ELSE 3
    END,
    tv.youtube_duration_last_updated ASC NULLS FIRST
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Create function to update cached duration
CREATE OR REPLACE FUNCTION update_youtube_duration_cache(
  video_id UUID,
  duration_seconds INTEGER
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE tutorial_videos 
  SET 
    youtube_duration_cached = duration_seconds,
    youtube_duration_last_updated = NOW(),
    updated_at = NOW()
  WHERE id = video_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;







