-- Create the missing admins table
CREATE TABLE IF NOT EXISTS admins (
  id SERIAL PRIMARY KEY,
  "user" TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add the current user as admin (only if not exists)
INSERT INTO admins ("user") 
SELECT '900f11b8-c901-49fd-bfab-5fafe984ce72'
WHERE NOT EXISTS (
  SELECT 1 FROM admins WHERE "user" = '900f11b8-c901-49fd-bfab-5fafe984ce72'
);

-- Enable RLS on admins table
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- Allow admins to read admin table
CREATE POLICY "Admins can read admin table" ON admins
  FOR SELECT USING (user = auth.uid()::text); 