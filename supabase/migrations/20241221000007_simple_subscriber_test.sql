-- Simple test to insert one subscriber manually
-- This will help us see what's failing

INSERT INTO public.subscribers (
    id,
    email,
    subscribe_date,
    status,
    tags,
    metadata
) VALUES (
    '00000000-0000-0000-0000-000000000001',
    'test@example.com',
    NOW(),
    'subscribed',
    ARRAY['test'],
    '{"test": true}'::jsonb
) ON CONFLICT (id) DO NOTHING; 