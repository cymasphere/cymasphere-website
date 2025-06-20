-- Add test audience for development
INSERT INTO email_audiences (name, description, filters, created_by, subscriber_count) 
VALUES (
  'Test Audience', 
  'A test audience for development', 
  '{"age_range": "18-35", "interests": ["music", "production"]}',
  '36b8b0f3-79b4-4adb-b805-0807c7268972', 
  150
);

INSERT INTO email_audiences (name, description, filters, created_by, subscriber_count) 
VALUES (
  'Music Producers', 
  'Professional music producers and beatmakers', 
  '{"interests": ["music production", "audio software"], "experience": "professional"}',
  '36b8b0f3-79b4-4adb-b805-0807c7268972', 
  2340
);

INSERT INTO email_audiences (name, description, filters, created_by, subscriber_count) 
VALUES (
  'New Users', 
  'Users who signed up in the last 30 days', 
  '{"signup_date": "last_30_days", "status": "new"}',
  '36b8b0f3-79b4-4adb-b805-0807c7268972', 
  567
); 