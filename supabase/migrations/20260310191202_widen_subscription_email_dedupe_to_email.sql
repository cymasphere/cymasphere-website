-- Widen subscription email dedupe from per-user to per-email.
-- Ensures a given email address only ever receives one copy of a logical
-- subscription email kind (e.g. `free_trial_started`), even if multiple user
-- accounts are created for the same address or workflows change.

DO $$
BEGIN
  -- Add email column if it does not exist
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'subscription_emails_sent'
      AND column_name = 'email'
  ) THEN
    ALTER TABLE public.subscription_emails_sent
      ADD COLUMN email text;
  END IF;
END $$;

-- Backfill email from profiles based on user_id where possible
UPDATE public.subscription_emails_sent ses
SET email = p.email
FROM public.profiles p
WHERE ses.user_id = p.id
  AND ses.email IS NULL;

-- For any remaining rows with NULL email (should be rare in dev), fall back to
-- empty string to satisfy NOT NULL constraint before changing keys.
UPDATE public.subscription_emails_sent
SET email = ''
WHERE email IS NULL;

-- Drop old primary key on (user_id, email_kind) if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.subscription_emails_sent'::regclass
      AND contype = 'p'
  ) THEN
    ALTER TABLE public.subscription_emails_sent
      DROP CONSTRAINT subscription_emails_sent_pkey;
  END IF;
END $$;

-- Enforce NOT NULL on email now that it is populated
ALTER TABLE public.subscription_emails_sent
  ALTER COLUMN email SET NOT NULL;

-- New primary key: one row per (email, email_kind)
ALTER TABLE public.subscription_emails_sent
  ADD CONSTRAINT subscription_emails_sent_pkey
  PRIMARY KEY (email, email_kind);

-- Optional index on user_id to keep lookups by user efficient
CREATE INDEX IF NOT EXISTS idx_subscription_emails_sent_user_id
  ON public.subscription_emails_sent (user_id);

