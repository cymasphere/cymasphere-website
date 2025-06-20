-- Backfill subscribers from profiles table
-- The profiles table has the actual user data, not auth.users

-- First check what we have
DO $$
DECLARE
  profile_count INTEGER;
  subscriber_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO profile_count FROM profiles;
  SELECT COUNT(*) INTO subscriber_count FROM subscribers;
  
  RAISE NOTICE 'BEFORE BACKFILL - Profiles: %, Subscribers: %', profile_count, subscriber_count;
END $$;

-- Backfill subscribers from profiles table
INSERT INTO subscribers (user_id, email, source, subscribe_date, status, tags)
SELECT 
  p.id as user_id,
  COALESCE(p.email, p.first_name || '@example.com') as email,
  'backfill' as source,
  p.created_at as subscribe_date,
  'active' as status,
  CASE 
    WHEN p.subscription = 'admin' THEN ARRAY['backfill', 'admin']
    WHEN p.subscription = 'monthly' THEN ARRAY['backfill', 'monthly-subscriber'] 
    WHEN p.subscription = 'annual' THEN ARRAY['backfill', 'annual-subscriber']
    WHEN p.subscription = 'lifetime' THEN ARRAY['backfill', 'lifetime-member']
    ELSE ARRAY['backfill', 'free-user']
  END as tags
FROM profiles p
LEFT JOIN subscribers s ON p.id = s.user_id
WHERE s.user_id IS NULL
  AND p.id IS NOT NULL
ON CONFLICT (email) DO UPDATE SET
  user_id = EXCLUDED.user_id,
  tags = EXCLUDED.tags,
  updated_at = NOW();

-- Show results
DO $$
DECLARE
  profile_count INTEGER;
  subscriber_count INTEGER;
  backfill_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO profile_count FROM profiles;
  SELECT COUNT(*) INTO subscriber_count FROM subscribers;
  SELECT COUNT(*) INTO backfill_count FROM subscribers WHERE source = 'backfill';
  
  RAISE NOTICE 'AFTER BACKFILL - Profiles: %, Subscribers: %, Backfilled: %', 
    profile_count, subscriber_count, backfill_count;
END $$; 