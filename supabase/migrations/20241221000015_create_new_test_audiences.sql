-- Create new test audiences for legitimate admin users
-- This replaces the audiences created by the unauthorized user

-- Delete old audiences created by unauthorized user
DELETE FROM email_audiences WHERE created_by = '36b8b0f3-79b4-4adb-b805-0807c7268972';

-- Create new test audiences with legitimate admin users
-- Using garrett@cymasphere.com (user ID: dd2b5feb-5dfd-419c-b05f-2a6bb42b705b)
INSERT INTO email_audiences (id, name, description, filters, subscriber_count, created_by, created_at, updated_at)
VALUES 
  (
    'a1b5e282-df51-4670-a8a8-4bc9e8b0e081',
    'Test Audience',
    'A test audience for development and testing',
    '{"age_range": "18-35", "interests": ["music", "production"]}',
    150,
    'dd2b5feb-5dfd-419c-b05f-2a6bb42b705b',
    NOW(),
    NOW()
  ),
  (
    'b5303bb2-7d4c-431a-b417-4069cc41b437',
    'Music Producers',
    'Professional music producers and beatmakers',
    '{"interests": ["music production", "audio software"], "experience": "professional"}',
    2340,
    'dd2b5feb-5dfd-419c-b05f-2a6bb42b705b',
    NOW(),
    NOW()
  ),
  (
    '3f1408a8-fe01-4917-8b44-7aa26f415c70',
    'New Users',
    'Users who signed up in the last 30 days',
    '{"status": "new", "signup_date": "last_30_days"}',
    567,
    'dd2b5feb-5dfd-419c-b05f-2a6bb42b705b',
    NOW(),
    NOW()
  ); 