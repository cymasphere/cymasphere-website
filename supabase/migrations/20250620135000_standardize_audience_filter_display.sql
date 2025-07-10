-- Standardize audience filter display by converting simple key-value filters to rules format
-- This ensures consistent UI display of all filter conditions

DO $$
DECLARE
    audience_record RECORD;
    new_filters JSONB;
    rules_array JSONB;
BEGIN
    RAISE NOTICE 'Starting audience filter standardization...';
    
    -- Process each audience
    FOR audience_record IN 
        SELECT id, name, filters 
        FROM email_audiences 
        WHERE filters IS NOT NULL
    LOOP
        RAISE NOTICE 'Processing audience: %', audience_record.name;
        
        -- Initialize new filter structure
        new_filters := COALESCE(audience_record.filters, '{}'::jsonb);
        rules_array := '[]'::jsonb;
        
        -- Convert simple key-value filters to rules format for consistent display
        -- Only convert if not already in rules format
        IF NOT (new_filters ? 'rules') THEN
            RAISE NOTICE '  Converting % from simple to rules format', audience_record.name;
            
            -- Add status rule if present
            IF new_filters ? 'status' THEN
                rules_array := rules_array || jsonb_build_array(
                    jsonb_build_object(
                        'id', '1',
                        'field', 'status',
                        'operator', 'equals',
                        'value', new_filters->>'status',
                        'timeframe', 'all_time'
                    )
                );
            END IF;
            
            -- Add subscription rule if present and not 'none'
            IF new_filters ? 'subscription' AND new_filters->>'subscription' != 'none' THEN
                rules_array := rules_array || jsonb_build_array(
                    jsonb_build_object(
                        'id', '2',
                        'field', 'subscription', 
                        'operator', 'equals',
                        'value', new_filters->>'subscription',
                        'timeframe', 'all_time'
                    )
                );
            END IF;
            
            -- Handle complex filters like signup_date, last_email_open
            IF new_filters ? 'signup_date' AND jsonb_typeof(new_filters->'signup_date') = 'object' THEN
                rules_array := rules_array || jsonb_build_array(
                    jsonb_build_object(
                        'id', '3',
                        'field', 'signup_date',
                        'operator', COALESCE(new_filters->'signup_date'->>'operator', 'within'),
                        'value', COALESCE(new_filters->'signup_date'->>'value', '7_days'),
                        'timeframe', 'all_time'
                    )
                );
            END IF;
            
            IF new_filters ? 'last_email_open' AND jsonb_typeof(new_filters->'last_email_open') = 'object' THEN
                rules_array := rules_array || jsonb_build_array(
                    jsonb_build_object(
                        'id', '4',
                        'field', 'last_email_open',
                        'operator', COALESCE(new_filters->'last_email_open'->>'operator', 'older_than'),
                        'value', COALESCE(new_filters->'last_email_open'->>'value', '60_days'),
                        'timeframe', 'all_time'
                    )
                );
            END IF;
            
            -- Only add rules if we have any, otherwise keep simple format
            IF jsonb_array_length(rules_array) > 0 THEN
                -- Create new filter structure with rules
                new_filters := jsonb_build_object(
                    'rules', rules_array,
                    'audience_type', COALESCE(new_filters->>'audience_type', 'dynamic')
                );
                
                -- Update the audience
                UPDATE email_audiences 
                SET filters = new_filters,
                    updated_at = NOW()
                WHERE id = audience_record.id;
                
                RAISE NOTICE '  ✅ Updated % with % rules', audience_record.name, jsonb_array_length(rules_array);
            ELSE
                RAISE NOTICE '  ℹ️  Skipped % (no meaningful filters to convert)', audience_record.name;
            END IF;
        ELSE
            RAISE NOTICE '  ℹ️  Skipped % (already in rules format)', audience_record.name;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Audience filter standardization completed!';
END $$; 