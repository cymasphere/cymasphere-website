-- Migration: Add iOS subscription tracking
-- This allows us to track iOS StoreKit purchases alongside Stripe subscriptions

-- Create table to track iOS subscriptions
CREATE TABLE IF NOT EXISTS ios_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- StoreKit transaction details
  transaction_id TEXT NOT NULL UNIQUE,
  original_transaction_id TEXT, -- For subscription renewals
  product_id TEXT NOT NULL,
  
  -- Subscription details
  subscription_type subscription_type NOT NULL DEFAULT 'none',
  purchase_date TIMESTAMPTZ NOT NULL,
  expires_date TIMESTAMPTZ NOT NULL,
  
  -- Receipt validation
  receipt_data TEXT NOT NULL, -- Base64 encoded receipt
  receipt_validated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  validation_status TEXT NOT NULL DEFAULT 'valid', -- 'valid', 'expired', 'revoked', 'invalid'
  
  -- Apple receipt validation response
  apple_validation_response JSONB,
  
  -- Status tracking
  is_active BOOLEAN NOT NULL DEFAULT true,
  auto_renew_status BOOLEAN DEFAULT true,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_subscription_type CHECK (subscription_type IN ('none', 'monthly', 'annual', 'lifetime')),
  CONSTRAINT valid_expires_date CHECK (expires_date > purchase_date)
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_ios_subscriptions_user_id ON ios_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_ios_subscriptions_profile_id ON ios_subscriptions(profile_id);
CREATE INDEX IF NOT EXISTS idx_ios_subscriptions_transaction_id ON ios_subscriptions(transaction_id);
CREATE INDEX IF NOT EXISTS idx_ios_subscriptions_original_transaction_id ON ios_subscriptions(original_transaction_id);
CREATE INDEX IF NOT EXISTS idx_ios_subscriptions_is_active ON ios_subscriptions(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_ios_subscriptions_expires_date ON ios_subscriptions(expires_date);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_ios_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER update_ios_subscriptions_updated_at
  BEFORE UPDATE ON ios_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_ios_subscriptions_updated_at();

-- Create function to get active iOS subscription for a user
CREATE OR REPLACE FUNCTION get_active_ios_subscription(p_user_id UUID)
RETURNS TABLE (
  subscription_type subscription_type,
  expires_date TIMESTAMPTZ,
  transaction_id TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ios.subscription_type,
    ios.expires_date,
    ios.transaction_id
  FROM ios_subscriptions ios
  WHERE ios.user_id = p_user_id
    AND ios.is_active = true
    AND ios.validation_status = 'valid'
    AND ios.expires_date > NOW()
  ORDER BY ios.expires_date DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add RLS policies
ALTER TABLE ios_subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can view their own iOS subscriptions
CREATE POLICY "Users can view own iOS subscriptions"
  ON ios_subscriptions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Service role can do everything (for API endpoints)
CREATE POLICY "Service role can manage iOS subscriptions"
  ON ios_subscriptions
  FOR ALL
  USING (auth.role() = 'service_role');

-- Add comment
COMMENT ON TABLE ios_subscriptions IS 'Tracks iOS StoreKit subscription purchases and their validation status';
COMMENT ON COLUMN ios_subscriptions.transaction_id IS 'Unique transaction ID from StoreKit';
COMMENT ON COLUMN ios_subscriptions.original_transaction_id IS 'Original transaction ID for subscription renewals';
COMMENT ON COLUMN ios_subscriptions.product_id IS 'Product ID from App Store Connect (e.g., com.NNAudio.Cymasphere.monthly.plan)';
COMMENT ON COLUMN ios_subscriptions.receipt_data IS 'Base64 encoded receipt data for validation';
COMMENT ON COLUMN ios_subscriptions.validation_status IS 'Status of receipt validation: valid, expired, revoked, invalid';


