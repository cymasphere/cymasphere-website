-- Create a debug function to see what's happening
CREATE OR REPLACE FUNCTION debug_is_admin(user_id UUID)
RETURNS JSON AS $$
DECLARE
  user_text TEXT;
  admin_exists BOOLEAN;
  admin_count INTEGER;
BEGIN
  -- Convert UUID to text explicitly
  user_text := user_id::text;
  
  -- Count admins with this user
  SELECT COUNT(*) INTO admin_count FROM admins WHERE "user" = user_text;
  
  -- Check if user exists in admins table
  admin_exists := EXISTS (
    SELECT 1 FROM admins 
    WHERE "user" = user_text
  );
  
  -- Return debug info
  RETURN json_build_object(
    'input_uuid', user_id,
    'converted_text', user_text,
    'admin_count', admin_count,
    'admin_exists', admin_exists,
    'all_admins', (SELECT json_agg("user") FROM admins)
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 