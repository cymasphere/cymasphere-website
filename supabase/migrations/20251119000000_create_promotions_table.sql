-- Create promotions table for managing sales and discount campaigns
CREATE TABLE IF NOT EXISTS public.promotions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  -- Basic info
  name TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  
  -- Status
  active BOOLEAN DEFAULT false NOT NULL,
  
  -- Date range
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  
  -- Applicable plans
  applicable_plans TEXT[] DEFAULT ARRAY['lifetime']::TEXT[],
  
  -- Pricing
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'amount')),
  discount_value NUMERIC NOT NULL CHECK (discount_value > 0),
  sale_price_monthly NUMERIC,
  sale_price_annual NUMERIC,
  sale_price_lifetime NUMERIC,
  
  -- Stripe integration
  stripe_coupon_code TEXT,
  stripe_coupon_id TEXT,
  stripe_coupon_created BOOLEAN DEFAULT false,
  
  -- Banner customization
  banner_theme JSONB DEFAULT '{"background": "linear-gradient(135deg, #FF6B6B, #FF0000)", "textColor": "#FFFFFF", "accentColor": "#FFD700"}'::jsonb,
  
  -- Tracking
  views INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  revenue NUMERIC DEFAULT 0,
  
  -- Priority (for multiple active promotions)
  priority INTEGER DEFAULT 0
);

-- Create index on active promotions
CREATE INDEX idx_promotions_active ON public.promotions(active) WHERE active = true;

-- Create index on date range
CREATE INDEX idx_promotions_dates ON public.promotions(start_date, end_date);

-- Create index on priority
CREATE INDEX idx_promotions_priority ON public.promotions(priority DESC);

-- Enable RLS
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read active promotions
CREATE POLICY "Anyone can view active promotions"
  ON public.promotions
  FOR SELECT
  USING (active = true);

-- Policy: Admins can view all promotions
CREATE POLICY "Admins can view all promotions"
  ON public.promotions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admins
      WHERE admins.user = auth.uid()
    )
  );

-- Policy: Admins can insert promotions
CREATE POLICY "Admins can insert promotions"
  ON public.promotions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admins
      WHERE admins.user = auth.uid()
    )
  );

-- Policy: Admins can update promotions
CREATE POLICY "Admins can update promotions"
  ON public.promotions
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admins
      WHERE admins.user = auth.uid()
    )
  );

-- Policy: Admins can delete promotions
CREATE POLICY "Admins can delete promotions"
  ON public.promotions
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admins
      WHERE admins.user = auth.uid()
    )
  );

-- Function to get active promotion for a plan
CREATE OR REPLACE FUNCTION get_active_promotion(plan_type TEXT)
RETURNS TABLE (
  id UUID,
  name TEXT,
  title TEXT,
  description TEXT,
  discount_type TEXT,
  discount_value NUMERIC,
  sale_price NUMERIC,
  stripe_coupon_code TEXT,
  banner_theme JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    p.title,
    p.description,
    p.discount_type,
    p.discount_value,
    CASE 
      WHEN plan_type = 'monthly' THEN p.sale_price_monthly
      WHEN plan_type = 'annual' THEN p.sale_price_annual
      WHEN plan_type = 'lifetime' THEN p.sale_price_lifetime
      ELSE NULL
    END as sale_price,
    p.stripe_coupon_code,
    p.banner_theme
  FROM public.promotions p
  WHERE p.active = true
    AND plan_type = ANY(p.applicable_plans)
    AND (p.start_date IS NULL OR p.start_date <= NOW())
    AND (p.end_date IS NULL OR p.end_date >= NOW())
  ORDER BY p.priority DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update promotion stats
CREATE OR REPLACE FUNCTION increment_promotion_view(promotion_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.promotions
  SET views = views + 1
  WHERE id = promotion_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION increment_promotion_conversion(
  promotion_id UUID,
  conversion_value NUMERIC DEFAULT 0
)
RETURNS VOID AS $$
BEGIN
  UPDATE public.promotions
  SET 
    conversions = conversions + 1,
    revenue = revenue + conversion_value
  WHERE id = promotion_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_promotions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_promotions_updated_at
  BEFORE UPDATE ON public.promotions
  FOR EACH ROW
  EXECUTE FUNCTION update_promotions_updated_at();

-- Insert default Black Friday promotion (inactive by default)
INSERT INTO public.promotions (
  name,
  title,
  description,
  active,
  start_date,
  end_date,
  applicable_plans,
  discount_type,
  discount_value,
  sale_price_lifetime,
  stripe_coupon_code,
  banner_theme,
  priority
) VALUES (
  'black_friday_2025',
  '🔥 Black Friday Sale',
  'Lifetime access for just $99 - Save $150!',
  false,  -- Inactive by default
  '2025-11-25 00:00:00+00',
  '2025-12-02 23:59:59+00',
  ARRAY['lifetime']::TEXT[],
  'amount',
  50,
  99,
  'BLACKFRIDAY2025',
  '{"background": "linear-gradient(135deg, #FF6B6B, #FF0000)", "textColor": "#FFFFFF", "accentColor": "#FFD700"}'::jsonb,
  100
) ON CONFLICT (name) DO NOTHING;

COMMENT ON TABLE public.promotions IS 'Promotional sales and discount campaigns';
COMMENT ON COLUMN public.promotions.discount_type IS 'Type of discount: percentage or amount (off normal price)';
COMMENT ON COLUMN public.promotions.discount_value IS 'Discount value (percentage or dollar amount)';
COMMENT ON COLUMN public.promotions.stripe_coupon_code IS 'Stripe coupon code to auto-apply';
COMMENT ON COLUMN public.promotions.stripe_coupon_created IS 'Whether the Stripe coupon has been created';
COMMENT ON COLUMN public.promotions.priority IS 'Higher priority promotions take precedence when multiple are active';

