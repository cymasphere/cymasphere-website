-- Create function to create subscribers table
CREATE OR REPLACE FUNCTION create_subscribers_table()
RETURNS boolean
LANGUAGE plpgsql
AS $$
BEGIN
  -- Create subscribers table if it doesn't exist
  CREATE TABLE IF NOT EXISTS subscribers (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email text NOT NULL UNIQUE,
    subscribe_date timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
    unsubscribe_date timestamptz,
    status text DEFAULT 'subscribed' CHECK (status IN ('subscribed', 'unsubscribed', 'bounced', 'complained')),
    tags text[] DEFAULT '{}',
    metadata jsonb DEFAULT '{}',
    created_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL
  );

  -- Create index on email for faster lookups
  CREATE INDEX IF NOT EXISTS subscribers_email_idx ON subscribers(email);
  
  -- Create index on status for filtering
  CREATE INDEX IF NOT EXISTS subscribers_status_idx ON subscribers(status);
  
  -- Create index on tags for tag-based queries
  CREATE INDEX IF NOT EXISTS subscribers_tags_idx ON subscribers USING GIN(tags);
  
  -- Enable RLS
  ALTER TABLE subscribers ENABLE ROW LEVEL SECURITY;
  
  -- Create policies
  CREATE POLICY "Allow authenticated users to manage subscribers" ON subscribers
    FOR ALL USING (auth.role() = 'authenticated');
    
  CREATE POLICY "Allow service role full access" ON subscribers
    FOR ALL USING (auth.role() = 'service_role');

  RETURN true;
END;
$$;

-- Create the subscribers table
SELECT create_subscribers_table(); 