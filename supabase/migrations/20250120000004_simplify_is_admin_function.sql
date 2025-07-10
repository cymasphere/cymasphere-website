-- Replace the function without dropping (to avoid dependency issues)
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_text TEXT;
BEGIN
  -- Convert UUID to text explicitly
  user_text := user_id::text;
  
  -- Check if user exists in admins table
  RETURN EXISTS (
    SELECT 1 FROM admins 
    WHERE "user" = user_text
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 