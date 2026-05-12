-- Affiliate Marketing & Revenue Sharing System
--
-- Invite-only affiliate program where each affiliate's code doubles as a
-- Stripe Promotion Code (customer discount). Attribution is enforced by
-- Stripe: when a checkout records an applied promotion code, the webhook
-- creates a commission tied to the matching affiliate.
--
-- Tables:
--   - affiliates: one row per invited affiliate, with their Stripe coupon/promo IDs
--   - affiliate_commissions: ledger of pending/approved/paid/refunded commissions
--   - affiliate_payouts: batched payout records (Stripe Connect transfers)
--   - affiliate_balance_adjustments: post-payout debits/credits (refund clawbacks)

-- =========================================================================
-- affiliates
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.affiliates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  code TEXT NOT NULL UNIQUE,

  stripe_coupon_id TEXT NOT NULL,
  stripe_promotion_code_id TEXT NOT NULL UNIQUE,

  customer_discount_percent NUMERIC(5,2) NOT NULL DEFAULT 20.00
    CHECK (customer_discount_percent > 0 AND customer_discount_percent <= 100),
  commission_rate_subscription NUMERIC(5,4) NOT NULL DEFAULT 0.2000
    CHECK (commission_rate_subscription > 0 AND commission_rate_subscription <= 1),
  commission_rate_lifetime NUMERIC(5,4) NOT NULL DEFAULT 0.2000
    CHECK (commission_rate_lifetime > 0 AND commission_rate_lifetime <= 1),
  recurring_months INT NOT NULL DEFAULT 12 CHECK (recurring_months > 0),
  payout_minimum_cents INT NOT NULL DEFAULT 5000 CHECK (payout_minimum_cents >= 0),

  stripe_connect_account_id TEXT,
  connect_payouts_enabled BOOLEAN NOT NULL DEFAULT false,
  connect_onboarded_at TIMESTAMPTZ,

  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
  notes TEXT,

  tos_accepted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_affiliates_user_id ON public.affiliates(user_id);
CREATE INDEX IF NOT EXISTS idx_affiliates_code ON public.affiliates(code);
CREATE INDEX IF NOT EXISTS idx_affiliates_promotion_code ON public.affiliates(stripe_promotion_code_id);
CREATE INDEX IF NOT EXISTS idx_affiliates_status ON public.affiliates(status);

COMMENT ON TABLE public.affiliates IS 'Invite-only affiliates. Each row has a Stripe Coupon + Promotion Code that doubles as the customer-facing discount and the attribution token.';
COMMENT ON COLUMN public.affiliates.code IS 'Customer-facing string (UPPERCASE). Identical to the Stripe Promotion Code "code" field.';
COMMENT ON COLUMN public.affiliates.customer_discount_percent IS 'Discount the customer receives when using this code.';
COMMENT ON COLUMN public.affiliates.commission_rate_subscription IS 'Fraction of net subscription revenue the affiliate earns (0.20 = 20%).';
COMMENT ON COLUMN public.affiliates.commission_rate_lifetime IS 'Fraction of net lifetime purchase revenue the affiliate earns.';
COMMENT ON COLUMN public.affiliates.recurring_months IS 'How many paid subscription invoices count toward the affiliate. Should match the Stripe coupon duration_in_months.';
COMMENT ON COLUMN public.affiliates.payout_minimum_cents IS 'Minimum balance (in cents) before a payout can be triggered.';

-- =========================================================================
-- affiliate_commissions
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.affiliate_commissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,

  affiliate_id UUID NOT NULL REFERENCES public.affiliates(id) ON DELETE RESTRICT,

  referred_customer_id TEXT NOT NULL,
  referred_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,

  stripe_promotion_code_id TEXT NOT NULL,
  stripe_invoice_id TEXT,
  stripe_charge_id TEXT,
  stripe_payment_intent_id TEXT,
  stripe_subscription_id TEXT,

  product_kind TEXT NOT NULL CHECK (product_kind IN ('monthly', 'annual', 'lifetime')),
  recurring_month_index INT,

  gross_amount_cents INT NOT NULL CHECK (gross_amount_cents >= 0),
  commission_amount_cents INT NOT NULL CHECK (commission_amount_cents >= 0),
  currency TEXT NOT NULL,

  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'paid', 'refunded', 'void')),
  approve_at TIMESTAMPTZ NOT NULL,
  paid_at TIMESTAMPTZ,
  refunded_at TIMESTAMPTZ,

  payout_id UUID
);

-- Idempotency: each Stripe invoice / payment_intent can produce at most one
-- commission for a given affiliate. Lets the webhook safely retry.
CREATE UNIQUE INDEX IF NOT EXISTS uniq_commission_invoice_affiliate
  ON public.affiliate_commissions(stripe_invoice_id, affiliate_id)
  WHERE stripe_invoice_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uniq_commission_pi_affiliate
  ON public.affiliate_commissions(stripe_payment_intent_id, affiliate_id)
  WHERE stripe_payment_intent_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_commissions_affiliate ON public.affiliate_commissions(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_commissions_status ON public.affiliate_commissions(status);
CREATE INDEX IF NOT EXISTS idx_commissions_approve_at ON public.affiliate_commissions(approve_at) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_commissions_charge ON public.affiliate_commissions(stripe_charge_id) WHERE stripe_charge_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_commissions_subscription ON public.affiliate_commissions(stripe_subscription_id) WHERE stripe_subscription_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_commissions_payout ON public.affiliate_commissions(payout_id) WHERE payout_id IS NOT NULL;

COMMENT ON TABLE public.affiliate_commissions IS 'One row per attributable Stripe charge (subscription invoice or lifetime PI).';
COMMENT ON COLUMN public.affiliate_commissions.recurring_month_index IS 'Zero-based index for subscription commissions, NULL for lifetime. Caps at affiliates.recurring_months - 1.';
COMMENT ON COLUMN public.affiliate_commissions.gross_amount_cents IS 'Net of any discount: what Stripe actually charged (amount_paid / amount_received).';
COMMENT ON COLUMN public.affiliate_commissions.approve_at IS 'Once this timestamp passes and no refund has voided the row, the nightly cron flips status to approved.';

-- =========================================================================
-- affiliate_payouts
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.affiliate_payouts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  affiliate_id UUID NOT NULL REFERENCES public.affiliates(id) ON DELETE RESTRICT,
  amount_cents INT NOT NULL CHECK (amount_cents > 0),
  currency TEXT NOT NULL,

  stripe_transfer_id TEXT UNIQUE,
  stripe_transfer_group TEXT,

  commission_count INT NOT NULL DEFAULT 0 CHECK (commission_count >= 0),
  adjustment_total_cents INT NOT NULL DEFAULT 0,

  status TEXT NOT NULL DEFAULT 'processing'
    CHECK (status IN ('processing', 'paid', 'failed')),
  failure_reason TEXT
);

CREATE INDEX IF NOT EXISTS idx_payouts_affiliate ON public.affiliate_payouts(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_payouts_status ON public.affiliate_payouts(status);

COMMENT ON TABLE public.affiliate_payouts IS 'One row per batched Stripe Connect transfer to an affiliate.';
COMMENT ON COLUMN public.affiliate_payouts.stripe_transfer_group IS 'Stripe transfer_group for idempotency: typically affiliate_<id>_<payout_id>.';
COMMENT ON COLUMN public.affiliate_payouts.adjustment_total_cents IS 'Sum of balance adjustments (debits/credits) applied to this payout. Can be negative.';

-- Backfill payout FK on commissions
ALTER TABLE public.affiliate_commissions
  ADD CONSTRAINT affiliate_commissions_payout_id_fkey
  FOREIGN KEY (payout_id) REFERENCES public.affiliate_payouts(id) ON DELETE SET NULL;

-- =========================================================================
-- affiliate_balance_adjustments
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.affiliate_balance_adjustments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  affiliate_id UUID NOT NULL REFERENCES public.affiliates(id) ON DELETE RESTRICT,
  amount_cents INT NOT NULL,
  reason TEXT NOT NULL,
  related_commission_id UUID REFERENCES public.affiliate_commissions(id) ON DELETE SET NULL,

  applied_to_payout_id UUID REFERENCES public.affiliate_payouts(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_adjustments_affiliate ON public.affiliate_balance_adjustments(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_adjustments_unapplied
  ON public.affiliate_balance_adjustments(affiliate_id)
  WHERE applied_to_payout_id IS NULL;

COMMENT ON TABLE public.affiliate_balance_adjustments IS 'Ledger for post-payout debits (refund clawbacks) and credits (manual adjustments). Negative amounts reduce future payouts.';

-- =========================================================================
-- updated_at triggers
-- =========================================================================
CREATE OR REPLACE FUNCTION public.update_affiliates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_affiliates_updated_at ON public.affiliates;
CREATE TRIGGER set_affiliates_updated_at
  BEFORE UPDATE ON public.affiliates
  FOR EACH ROW EXECUTE FUNCTION public.update_affiliates_updated_at();

DROP TRIGGER IF EXISTS set_commissions_updated_at ON public.affiliate_commissions;
CREATE TRIGGER set_commissions_updated_at
  BEFORE UPDATE ON public.affiliate_commissions
  FOR EACH ROW EXECUTE FUNCTION public.update_affiliates_updated_at();

DROP TRIGGER IF EXISTS set_payouts_updated_at ON public.affiliate_payouts;
CREATE TRIGGER set_payouts_updated_at
  BEFORE UPDATE ON public.affiliate_payouts
  FOR EACH ROW EXECUTE FUNCTION public.update_affiliates_updated_at();

-- =========================================================================
-- RLS Policies
-- =========================================================================
ALTER TABLE public.affiliates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_balance_adjustments ENABLE ROW LEVEL SECURITY;

-- affiliates: owner can read; admins full access; writes via service_role
CREATE POLICY "Affiliates can view own row"
  ON public.affiliates FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Affiliates can update own TOS acceptance"
  ON public.affiliates FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all affiliates"
  ON public.affiliates FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.admins WHERE admins.user = auth.uid()));

CREATE POLICY "Admins can insert affiliates"
  ON public.affiliates FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.admins WHERE admins.user = auth.uid()));

CREATE POLICY "Admins can update affiliates"
  ON public.affiliates FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.admins WHERE admins.user = auth.uid()));

CREATE POLICY "Admins can delete affiliates"
  ON public.affiliates FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.admins WHERE admins.user = auth.uid()));

-- commissions: affiliate sees own; admins see all
CREATE POLICY "Affiliates can view own commissions"
  ON public.affiliate_commissions FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.affiliates a
      WHERE a.id = affiliate_commissions.affiliate_id
        AND a.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all commissions"
  ON public.affiliate_commissions FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.admins WHERE admins.user = auth.uid()));

CREATE POLICY "Admins can update commissions"
  ON public.affiliate_commissions FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.admins WHERE admins.user = auth.uid()));

-- payouts: affiliate sees own; admins see all
CREATE POLICY "Affiliates can view own payouts"
  ON public.affiliate_payouts FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.affiliates a
      WHERE a.id = affiliate_payouts.affiliate_id
        AND a.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all payouts"
  ON public.affiliate_payouts FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.admins WHERE admins.user = auth.uid()));

CREATE POLICY "Admins can manage payouts"
  ON public.affiliate_payouts FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.admins WHERE admins.user = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.admins WHERE admins.user = auth.uid()));

-- balance adjustments: affiliate sees own; admins full access
CREATE POLICY "Affiliates can view own adjustments"
  ON public.affiliate_balance_adjustments FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.affiliates a
      WHERE a.id = affiliate_balance_adjustments.affiliate_id
        AND a.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage adjustments"
  ON public.affiliate_balance_adjustments FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.admins WHERE admins.user = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.admins WHERE admins.user = auth.uid()));

-- =========================================================================
-- Helper functions
-- =========================================================================

-- Count how many paid invoices already exist for a given affiliate+subscription.
-- Used by the webhook to enforce the recurring_months cap.
CREATE OR REPLACE FUNCTION public.count_paid_commissions_for_subscription(
  p_affiliate_id UUID,
  p_subscription_id TEXT
) RETURNS INT AS $$
  SELECT COUNT(*)::INT
  FROM public.affiliate_commissions
  WHERE affiliate_id = p_affiliate_id
    AND stripe_subscription_id = p_subscription_id
    AND status IN ('pending', 'approved', 'paid');
$$ LANGUAGE sql SECURITY DEFINER;

-- Available (approved, unpaid, minus unapplied adjustments) balance for an affiliate.
CREATE OR REPLACE FUNCTION public.get_affiliate_available_balance_cents(
  p_affiliate_id UUID
) RETURNS INT AS $$
  SELECT COALESCE(
    (SELECT SUM(commission_amount_cents)::INT
     FROM public.affiliate_commissions
     WHERE affiliate_id = p_affiliate_id AND status = 'approved'),
    0
  ) + COALESCE(
    (SELECT SUM(amount_cents)::INT
     FROM public.affiliate_balance_adjustments
     WHERE affiliate_id = p_affiliate_id AND applied_to_payout_id IS NULL),
    0
  );
$$ LANGUAGE sql SECURITY DEFINER;
