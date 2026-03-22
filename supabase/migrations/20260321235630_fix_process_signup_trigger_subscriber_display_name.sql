-- @fileoverview Replaces process_signup_trigger so signup automation events do not read NEW.name.
-- @module supabase/migrations
-- @note subscribers has no name column. Display name matches app registration:
--       metadata.name (same as auth user_metadata.name), else trim(first_name || last_name),
--       else email local-part (see utils/registration-display-name.ts).

CREATE OR REPLACE FUNCTION process_signup_trigger()
RETURNS TRIGGER AS $$
DECLARE
  display_name text;
  v_first text;
  v_last text;
BEGIN
  display_name := NULLIF(TRIM(COALESCE(NEW.metadata->>'name', '')), '');
  IF display_name IS NULL THEN
    v_first := NULLIF(TRIM(COALESCE(NEW.metadata->>'first_name', '')), '');
    v_last := NULLIF(TRIM(COALESCE(NEW.metadata->>'last_name', '')), '');
    display_name := NULLIF(TRIM(CONCAT_WS(' ', v_first, v_last)), '');
  END IF;
  IF display_name IS NULL THEN
    display_name := split_part(NEW.email, '@', 1);
  END IF;

  PERFORM create_automation_event(
    'signup',
    NEW.id,
    jsonb_build_object(
      'email', NEW.email,
      'name', display_name,
      'signup_date', NEW.created_at
    ),
    'system',
    NULL
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
