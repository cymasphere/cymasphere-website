-- Fix invalid status values in email_audiences filters
-- This migration fixes audiences that have invalid subscriber_status enum values

-- Update direct status filters (legacy format)
UPDATE email_audiences 
SET filters = jsonb_set(
  filters, 
  '{status}', 
  '"unsubscribed"'::jsonb
)
WHERE filters->>'status' = 'inactive';

UPDATE email_audiences 
SET filters = jsonb_set(
  filters, 
  '{status}', 
  '"active"'::jsonb
)
WHERE filters->>'status' = 'subscribed';

-- Update structured rules format (new format)
UPDATE email_audiences 
SET filters = jsonb_set(
  filters,
  '{rules}',
  (
    SELECT jsonb_agg(
      CASE 
        WHEN rule->>'field' = 'status' AND rule->>'value' = 'inactive' THEN
          jsonb_set(rule, '{value}', '"unsubscribed"'::jsonb)
        WHEN rule->>'field' = 'status' AND rule->>'value' = 'subscribed' THEN
          jsonb_set(rule, '{value}', '"active"'::jsonb)
        ELSE rule
      END
    )
    FROM jsonb_array_elements(filters->'rules') AS rule
  )
)
WHERE filters->'rules' IS NOT NULL 
AND EXISTS (
  SELECT 1 
  FROM jsonb_array_elements(filters->'rules') AS rule
  WHERE rule->>'field' = 'status' 
  AND rule->>'value' IN ('inactive', 'subscribed')
);

-- Log the changes made
DO $$
DECLARE
  affected_count INTEGER;
BEGIN
  GET DIAGNOSTICS affected_count = ROW_COUNT;
  RAISE NOTICE 'Fixed % audience records with invalid status filters', affected_count;
END $$;
