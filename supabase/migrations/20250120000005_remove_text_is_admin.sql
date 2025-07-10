-- Remove the TEXT version of is_admin to resolve overloading
DROP FUNCTION IF EXISTS is_admin(TEXT); 