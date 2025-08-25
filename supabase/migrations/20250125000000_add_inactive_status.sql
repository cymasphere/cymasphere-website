-- Migration to add INACTIVE status to subscriber_status enum
-- This allows us to properly track unsubscribed subscribers

-- Add INACTIVE status to the enum
ALTER TYPE subscriber_status ADD VALUE IF NOT EXISTS 'INACTIVE';

-- Add comment to the enum type for documentation
COMMENT ON TYPE subscriber_status IS 'Subscriber status: active, INACTIVE, bounced, pending';
