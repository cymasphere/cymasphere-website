-- Meta Conversions API Events Table
-- Stores all Meta conversion events for logging, debugging, and compliance

CREATE TABLE IF NOT EXISTS meta_conversion_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_name VARCHAR(100) NOT NULL,
  event_id VARCHAR(255),
  status VARCHAR(50) NOT NULL CHECK (status IN ('success', 'failed', 'test')),
  user_email VARCHAR(255),
  user_id VARCHAR(255),
  custom_data JSONB,
  error_message TEXT,
  client_ip INET,
  meta_response_id VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_meta_events_event_name ON meta_conversion_events(event_name);
CREATE INDEX IF NOT EXISTS idx_meta_events_status ON meta_conversion_events(status);
CREATE INDEX IF NOT EXISTS idx_meta_events_user_email ON meta_conversion_events(user_email);
CREATE INDEX IF NOT EXISTS idx_meta_events_user_id ON meta_conversion_events(user_id);
CREATE INDEX IF NOT EXISTS idx_meta_events_created_at ON meta_conversion_events(created_at DESC);

-- Enable RLS
ALTER TABLE meta_conversion_events ENABLE ROW LEVEL SECURITY;

-- Service role can insert (from API)
CREATE POLICY "Service role can insert meta events"
  ON meta_conversion_events
  FOR INSERT
  WITH CHECK (true);

-- Authenticated users can view
CREATE POLICY "Admins can view meta events"
  ON meta_conversion_events
  FOR SELECT
  USING (auth.jwt() ->> 'role' = 'authenticated');

-- Service role bypass (automatically applies)
GRANT ALL ON meta_conversion_events TO service_role;

