-- Add 'admin' to the subscription_type enum
-- This allows users to have admin privileges in the application

-- First, let's add the new enum value
ALTER TYPE public.subscription_type ADD VALUE IF NOT EXISTS 'admin';
 
-- The enum should now support: 'none', 'monthly', 'annual', 'lifetime', 'admin'
-- No need to modify the profiles table as it already uses this enum type 