-- Allow authenticated users to revoke Cymasphere app sessions for a specific device (user_agent).

CREATE OR REPLACE FUNCTION public.revoke_cymasphere_device_sessions(p_user_agent text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count integer;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF p_user_agent IS NULL OR p_user_agent NOT ILIKE 'cymasphere:%' THEN
    RAISE EXCEPTION 'Invalid Cymasphere device session';
  END IF;

  DELETE FROM auth.sessions
  WHERE user_id = auth.uid()
    AND user_agent = p_user_agent;

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

REVOKE ALL ON FUNCTION public.revoke_cymasphere_device_sessions(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.revoke_cymasphere_device_sessions(text) TO authenticated;
