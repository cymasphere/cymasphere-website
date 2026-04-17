-- When auth email changes, move NFR / user_management rows keyed by the old email
-- so checkUserManagementPro(profile.email) keeps matching after email confirmation.

CREATE OR REPLACE FUNCTION public.sync_user_management_email_on_auth_user_email_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.email IS NOT NULL
     AND (OLD.email IS DISTINCT FROM NEW.email)
     AND OLD.email IS NOT NULL
  THEN
    BEGIN
      UPDATE public.user_management
      SET user_email = NEW.email
      WHERE user_email = OLD.email;
    EXCEPTION
      WHEN unique_violation THEN
        RAISE WARNING
          'user_management email sync skipped (duplicate user_email=%), user id=%',
          NEW.email,
          NEW.id;
    END;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_user_management_on_auth_user_email_update ON auth.users;

CREATE TRIGGER sync_user_management_on_auth_user_email_update
  AFTER UPDATE OF email ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_user_management_email_on_auth_user_email_update();
