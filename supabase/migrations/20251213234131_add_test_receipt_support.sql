-- Migration: Add test receipt support to iOS subscriptions
-- This migration updates the validation_status column documentation and function
-- to support test receipts (validation_status = 'test')

-- Update the comment on validation_status column to include 'test' as a valid value
COMMENT ON COLUMN ios_subscriptions.validation_status IS 'Status of receipt validation: valid (production), test (test receipt, expires in 6 hours), expired, revoked, invalid';

-- Update the get_active_ios_subscription function to include test receipts
-- Test receipts are valid for 6 hours and should be included in active subscription queries
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
    AND ios.validation_status IN ('valid', 'test')  -- Include both production and test receipts
    AND ios.expires_date > NOW()
  ORDER BY ios.expires_date DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
