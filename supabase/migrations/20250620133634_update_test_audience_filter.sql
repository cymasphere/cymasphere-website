-- Update the test audience filter to use a more common filter that will return results
-- Change from subscription=lifetime (no matches) to status=active (many matches)

UPDATE email_audiences 
SET filters = '{"status": "active"}'::jsonb 
WHERE id = '713c5ad9-f284-4fe1-a32f-f172412e9171';

-- Also update any audience that has the problematic lifetime filter
UPDATE email_audiences 
SET filters = '{"status": "active"}'::jsonb 
WHERE filters->>'subscription' = 'lifetime';
