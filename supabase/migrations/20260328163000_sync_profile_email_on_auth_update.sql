-- Keep public.profiles.email aligned with auth.users.email when the auth email changes
-- (subscribers.email is already synced via sync_subscriber_on_user_email_update).

CREATE OR REPLACE FUNCTION public.sync_profile_email_on_auth_user_email_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.email IS NOT NULL AND (OLD.email IS DISTINCT FROM NEW.email) THEN
    UPDATE public.profiles
    SET
      email = NEW.email,
      updated_at = NOW()
    WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_profile_on_auth_user_email_update ON auth.users;

CREATE TRIGGER sync_profile_on_auth_user_email_update
  AFTER UPDATE OF email ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_profile_email_on_auth_user_email_update();
