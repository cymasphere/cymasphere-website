-- Dedupe table for subscription-related welcome/notification emails.
-- Ensures at most one send per (user_id, email_kind) across all instances.
-- Application inserts before sending; unique violation means already sent → skip.

CREATE TABLE IF NOT EXISTS public.subscription_emails_sent (
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  email_kind text NOT NULL,
  sent_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, email_kind)
);

COMMENT ON TABLE public.subscription_emails_sent IS 'Tracks subscription emails sent per user to prevent duplicates (e.g. Free Trial Started).';
COMMENT ON COLUMN public.subscription_emails_sent.email_kind IS 'Stable key for the email type: free_trial_started, monthly_activated, annual_activated, lifetime_activated, etc.';

-- Only service role should write; enable RLS with no policies so app uses service role to insert.
ALTER TABLE public.subscription_emails_sent ENABLE ROW LEVEL SECURITY;

-- No policies: only service role (bypasses RLS) can insert/select. Regular auth users cannot access.
