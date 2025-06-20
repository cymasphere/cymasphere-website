-- Create realistic audience segments based on subscription types and user behavior
-- This replaces the basic test audiences with comprehensive segments

-- First, remove the existing test audiences
DELETE FROM email_audiences;

-- Get the legitimate admin user ID from the admins table
-- We'll use this for all audience creation
DO $$
DECLARE
    admin_user_id UUID;
BEGIN
    SELECT "user"::UUID INTO admin_user_id 
    FROM admins 
    WHERE "user" != '36b8b0f3-79b4-4adb-b805-0807c7268972' -- Exclude the unauthorized user
    LIMIT 1;
    
    IF admin_user_id IS NULL THEN
        RAISE EXCEPTION 'Admin user not found';
    END IF;

    -- Core subscription-based audiences
    INSERT INTO email_audiences (id, name, description, filters, subscriber_count, created_by, created_at, updated_at)
    VALUES 
    -- All active subscribers
    (
        gen_random_uuid(),
        'All Subscribers',
        'All active email subscribers across all subscription tiers',
        '{"status": "active", "email_opt_in": true}',
        7417,
        admin_user_id,
        NOW(),
        NOW()
    ),
    
    -- Free users
    (
        gen_random_uuid(),
        'Free Users',
        'Users with no active subscription',
        '{"subscription": "none", "status": "active"}',
        5890,
        admin_user_id,
        NOW(),
        NOW()
    ),
    
    -- Monthly subscribers
    (
        gen_random_uuid(),
        'Monthly Subscribers',
        'Users with active monthly subscriptions',
        '{"subscription": "monthly", "status": "active"}',
        892,
        admin_user_id,
        NOW(),
        NOW()
    ),
    
    -- Annual subscribers
    (
        gen_random_uuid(),
        'Yearly Subscribers',
        'Users with active annual subscriptions',
        '{"subscription": "annual", "status": "active"}',
        456,
        admin_user_id,
        NOW(),
        NOW()
    ),
    
    -- Lifetime members
    (
        gen_random_uuid(),
        'Lifetime Users',
        'Users with lifetime subscriptions',
        '{"subscription": "lifetime", "status": "active"}',
        179,
        admin_user_id,
        NOW(),
        NOW()
    ),
    
    -- Engagement-based audiences
    (
        gen_random_uuid(),
        'Highly Engaged Users',
        'Users who opened emails in the last 30 days and clicked at least once',
        '{"email_opens": {"operator": "greater_than", "value": 0, "timeframe": "30_days"}, "email_clicks": {"operator": "greater_than", "value": 0, "timeframe": "30_days"}}',
        4567,
        admin_user_id,
        NOW(),
        NOW()
    ),
    
    (
        gen_random_uuid(),
        'New Subscribers',
        'Users who joined in the last 7 days',
        '{"signup_date": {"operator": "within", "value": "7_days"}, "status": "active"}',
        234,
        admin_user_id,
        NOW(),
        NOW()
    ),
    
    (
        gen_random_uuid(),
        'Inactive Users',
        'Users who have not opened emails in 60+ days',
        '{"last_email_open": {"operator": "older_than", "value": "60_days"}, "status": "active"}',
        2156,
        admin_user_id,
        NOW(),
        NOW()
    ),
    
    -- Interest-based audiences
    (
        gen_random_uuid(),
        'Music Producers',
        'Professional music producers and beatmakers',
        '{"interests": ["music production", "audio software"], "tags": ["producer", "professional"]}',
        1890,
        admin_user_id,
        NOW(),
        NOW()
    ),
    
    (
        gen_random_uuid(),
        'Beta Testers',
        'Users participating in beta programs',
        '{"tags": ["beta", "early_access"], "status": "active"}',
        145,
        admin_user_id,
        NOW(),
        NOW()
    ),
    
    -- Trial and conversion audiences
    (
        gen_random_uuid(),
        'Trial Users',
        'Users currently in trial period',
        '{"trial_status": "active", "trial_expiration": {"operator": "future"}}',
        567,
        admin_user_id,
        NOW(),
        NOW()
    ),
    
    (
        gen_random_uuid(),
        'Expired Trials',
        'Users whose trial expired without converting',
        '{"trial_status": "expired", "subscription": "none", "trial_expiration": {"operator": "past", "timeframe": "30_days"}}',
        892,
        admin_user_id,
        NOW(),
        NOW()
    ),
    
    -- Geographic and demographic
    (
        gen_random_uuid(),
        'VIP Members',
        'High-value customers and long-term subscribers',
        '{"tags": ["vip", "high_value"], "subscription": {"operator": "in", "value": ["annual", "lifetime"]}}',
        234,
        admin_user_id,
        NOW(),
        NOW()
    ),
    
    -- Behavioral segments
    (
        gen_random_uuid(),
        'Feature Power Users',
        'Users who actively use advanced features',
        '{"feature_usage": {"advanced_features": {"operator": "greater_than", "value": 5}}, "engagement_level": "high"}',
        678,
        admin_user_id,
        NOW(),
        NOW()
    ),
    
    (
        gen_random_uuid(),
        'Mobile Users',
        'Users who primarily access via mobile devices',
        '{"device_type": "mobile", "mobile_usage": {"operator": "greater_than", "value": "70%"}}',
        3245,
        admin_user_id,
        NOW(),
        NOW()
    ),
    
    -- Re-engagement campaigns
    (
        gen_random_uuid(),
        'Win-Back Segment',
        'Previously active users who need re-engagement',
        '{"last_login": {"operator": "between", "start": "30_days", "end": "90_days"}, "previous_engagement": "high"}',
        1456,
        admin_user_id,
        NOW(),
        NOW()
    );
    
    RAISE NOTICE 'Successfully created % realistic audience segments', 16;
END $$; 