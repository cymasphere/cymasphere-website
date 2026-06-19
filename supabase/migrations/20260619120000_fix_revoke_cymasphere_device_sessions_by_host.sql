-- Match Cymasphere device revocation by stable host suffix, not exact user agent.
-- OS version segments can change across app updates while the host suffix stays the same.

CREATE OR REPLACE FUNCTION public.cymasphere_device_host(p_user_agent text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT COALESCE(
    NULLIF(
      trim(
        regexp_replace(
          regexp_replace(p_user_agent, '^cymasphere:\s*', '', 'i'),
          '^(Windows \d+|Mac OSX [\d.]+|iOS [\d.]+)\s+',
          ''
        )
      ),
      ''
    ),
    trim(regexp_replace(p_user_agent, '^cymasphere:\s*', '', 'i'))
  );
$$;

CREATE OR REPLACE FUNCTION public.revoke_cymasphere_device_sessions(p_user_agent text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count integer;
  target_host text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF p_user_agent IS NULL OR p_user_agent NOT ILIKE 'cymasphere:%' THEN
    RAISE EXCEPTION 'Invalid Cymasphere device session';
  END IF;

  target_host := public.cymasphere_device_host(p_user_agent);

  IF target_host IS NULL OR target_host = '' THEN
    RAISE EXCEPTION 'Invalid Cymasphere device session';
  END IF;

  UPDATE auth.refresh_tokens rt
  SET revoked = true,
      updated_at = now()
  FROM auth.sessions s
  WHERE rt.session_id = s.id
    AND s.user_id = auth.uid()
    AND s.user_agent ILIKE 'cymasphere:%'
    AND public.cymasphere_device_host(s.user_agent) = target_host;

  DELETE FROM auth.sessions s
  WHERE s.user_id = auth.uid()
    AND s.user_agent ILIKE 'cymasphere:%'
    AND public.cymasphere_device_host(s.user_agent) = target_host;

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

REVOKE ALL ON FUNCTION public.cymasphere_device_host(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cymasphere_device_host(text) TO authenticated;

REVOKE ALL ON FUNCTION public.revoke_cymasphere_device_sessions(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.revoke_cymasphere_device_sessions(text) TO authenticated;
