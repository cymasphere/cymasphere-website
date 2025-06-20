-- Update the test audience filter to use subscription 'none' which has actual users
-- Currently the audience is filtering for 'lifetime' subscription which has 0 users
-- This changes it to 'none' subscription which has 999 users and will actually return results

UPDATE email_audiences 
SET filters = '{
  "rules": [
    {
      "field": "subscription", 
      "operator": "equals", 
      "value": "none", 
      "timeframe": "all_time"
    }
  ]
}'::jsonb 
WHERE id = '713c5ad9-f284-4fe1-a32f-f172412e9171';

-- Also update any other audiences that have the problematic lifetime filter
UPDATE email_audiences 
SET filters = '{
  "rules": [
    {
      "field": "subscription", 
      "operator": "equals", 
      "value": "none", 
      "timeframe": "all_time"
    }
  ]
}'::jsonb 
WHERE filters->>'subscription' = 'lifetime' 
   OR filters->'rules' @> '[{"value": "lifetime"}]';
