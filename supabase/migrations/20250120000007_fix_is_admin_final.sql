-- Final fix for is_admin function - handle both UUID and text types
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Try UUID comparison first (in case column is UUID type)
  RETURN EXISTS (
    SELECT 1 FROM admins 
    WHERE "user"::uuid = user_id
  );
EXCEPTION
  WHEN OTHERS THEN
    -- Fallback to text comparison (in case column is text type)
    BEGIN
      RETURN EXISTS (
        SELECT 1 FROM admins 
        WHERE "user" = user_id::text
      );
    EXCEPTION
      WHEN OTHERS THEN
        RETURN FALSE;
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 