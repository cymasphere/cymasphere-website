-- Backfill Subscribers for Existing Supabase Users
-- One-time migration to create subscriber records for all existing auth.users

-- Create subscribers for all users who don't have them
INSERT INTO subscribers (user_id, email, source, subscribe_date)
SELECT 
  u.id,
  u.email,
  'backfill' as source,
  u.created_at as subscribe_date
FROM auth.users u
LEFT JOIN subscribers s ON u.id = s.user_id
WHERE u.deleted_at IS NULL 
  AND u.email IS NOT NULL 
  AND u.email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
  AND s.user_id IS NULL
ON CONFLICT (email) DO NOTHING;

-- Show results
DO $$
DECLARE
  user_count INTEGER;
  subscriber_count INTEGER;
  missing_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO user_count FROM auth.users WHERE deleted_at IS NULL;
  SELECT COUNT(*) INTO subscriber_count FROM subscribers;
  
  SELECT COUNT(*) INTO missing_count 
  FROM auth.users u 
  LEFT JOIN subscribers s ON u.id = s.user_id 
  WHERE u.deleted_at IS NULL AND s.user_id IS NULL;
  
  RAISE NOTICE 'Backfill Complete:';
  RAISE NOTICE 'Total Users: %', user_count;
  RAISE NOTICE 'Total Subscribers: %', subscriber_count;
  RAISE NOTICE 'Users still missing subscribers: %', missing_count;
END $$; 