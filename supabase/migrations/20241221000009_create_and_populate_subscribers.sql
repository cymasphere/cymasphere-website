-- Create subscribers table and backfill with existing users
-- The table doesn't exist, that's why all insertions were failing

-- Create the subscribers table
CREATE TABLE IF NOT EXISTS public.subscribers (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    subscribe_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status TEXT DEFAULT 'subscribed' CHECK (status IN ('subscribed', 'unsubscribed', 'pending')),
    tags TEXT[] DEFAULT '{}',
    metadata JSONB DEFAULT '{}'
);

-- Enable RLS
ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own subscriber record" ON public.subscribers
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own subscriber record" ON public.subscribers
    FOR UPDATE USING (auth.uid() = id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_subscribers_email ON public.subscribers(email);
CREATE INDEX IF NOT EXISTS idx_subscribers_status ON public.subscribers(status);

-- Backfill subscribers from auth.users
INSERT INTO public.subscribers (id, email, subscribe_date, status, tags, metadata)
SELECT 
    u.id,
    u.email,
    u.created_at,
    'subscribed',
    CASE 
        WHEN p.subscription = 'none' THEN ARRAY['free-user']
        WHEN p.subscription = 'monthly' THEN ARRAY['monthly-subscriber']
        WHEN p.subscription = 'annual' THEN ARRAY['annual-subscriber']
        WHEN p.subscription = 'lifetime' THEN ARRAY['lifetime-subscriber']
        ELSE ARRAY['unknown']
    END,
    jsonb_build_object(
        'first_name', p.first_name,
        'last_name', p.last_name,
        'subscription', p.subscription,
        'auth_created_at', u.created_at,
        'profile_updated_at', p.updated_at
    )
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE u.email IS NOT NULL
ON CONFLICT (id) DO NOTHING; 