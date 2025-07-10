-- Create the subscribers table that actually doesn't exist
-- This is why all insertions were failing

CREATE TABLE IF NOT EXISTS public.subscribers (
    id UUID PRIMARY KEY,
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

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_subscribers_email ON public.subscribers(email);
CREATE INDEX IF NOT EXISTS idx_subscribers_status ON public.subscribers(status); 