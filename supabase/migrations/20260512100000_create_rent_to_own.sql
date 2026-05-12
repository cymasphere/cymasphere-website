-- Rent-to-own subscription support
-- - Adds subscription_type enum value `rent_to_own`
-- - Tracks user progress toward a lifetime threshold snapshot
-- - Records paid rent-to-own invoices in an idempotent ledger
-- - Extends affiliate commission product kinds

ALTER TYPE public.subscription_type ADD VALUE IF NOT EXISTS 'rent_to_own';

CREATE TABLE IF NOT EXISTS public.rent_to_own_progress (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),

  target_cents INT NOT NULL CHECK (target_cents > 0),
  paid_cents INT NOT NULL DEFAULT 0 CHECK (paid_cents >= 0),
  currency TEXT NOT NULL,

  active_subscription_id TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

COMMENT ON TABLE public.rent_to_own_progress IS 'Per-user rent-to-own progress snapshot. target_cents is fixed at enrollment and does not change when lifetime list price changes.';
COMMENT ON COLUMN public.rent_to_own_progress.paid_cents IS 'Cumulative successful rent-to-own invoice amounts. May exceed target_cents on final payment.';

CREATE TABLE IF NOT EXISTS public.rent_to_own_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),

  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  stripe_invoice_id TEXT NOT NULL UNIQUE,
  stripe_subscription_id TEXT,
  amount_cents INT NOT NULL CHECK (amount_cents > 0),
  currency TEXT NOT NULL
);

COMMENT ON TABLE public.rent_to_own_payments IS 'Idempotent ledger of paid rent-to-own invoices used to increment progress.';

CREATE INDEX IF NOT EXISTS idx_r2o_payments_user_id
  ON public.rent_to_own_payments(user_id);

CREATE INDEX IF NOT EXISTS idx_r2o_payments_subscription_id
  ON public.rent_to_own_payments(stripe_subscription_id)
  WHERE stripe_subscription_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.update_rent_to_own_progress_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_rent_to_own_progress_updated_at ON public.rent_to_own_progress;
CREATE TRIGGER set_rent_to_own_progress_updated_at
  BEFORE UPDATE ON public.rent_to_own_progress
  FOR EACH ROW EXECUTE FUNCTION public.update_rent_to_own_progress_updated_at();

ALTER TABLE public.rent_to_own_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rent_to_own_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own rent to own progress"
  ON public.rent_to_own_progress FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can manage rent to own progress"
  ON public.rent_to_own_progress FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.admins WHERE admins.user = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.admins WHERE admins.user = auth.uid()));

CREATE POLICY "Users can view own rent to own payments"
  ON public.rent_to_own_payments FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can manage rent to own payments"
  ON public.rent_to_own_payments FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.admins WHERE admins.user = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.admins WHERE admins.user = auth.uid()));

ALTER TABLE public.affiliate_commissions
  DROP CONSTRAINT IF EXISTS affiliate_commissions_product_kind_check;

ALTER TABLE public.affiliate_commissions
  ADD CONSTRAINT affiliate_commissions_product_kind_check
  CHECK (product_kind IN ('monthly', 'annual', 'lifetime', 'rent_to_own'));
