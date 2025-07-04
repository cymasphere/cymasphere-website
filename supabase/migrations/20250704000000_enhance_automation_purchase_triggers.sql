-- Enhanced Purchase Triggers and Audience Management for Email Automations
-- Created: 2025-01-03
-- Description: Add purchase event triggers and audience management actions to automation system

-- =============================================
-- SUBSCRIPTION CHANGE TRIGGERS
-- =============================================

-- Function to create subscription change events
CREATE OR REPLACE FUNCTION process_subscription_change_trigger()
RETURNS TRIGGER AS $$
BEGIN
  -- Only trigger if subscription actually changed
  IF OLD.subscription IS DISTINCT FROM NEW.subscription OR 
     OLD.subscription_expiration IS DISTINCT FROM NEW.subscription_expiration THEN
    
    -- Find subscriber for this profile
    DECLARE
      subscriber_id_var UUID;
    BEGIN
      SELECT id INTO subscriber_id_var 
      FROM subscribers 
      WHERE user_id = NEW.id 
      LIMIT 1;
      
      IF subscriber_id_var IS NOT NULL THEN
        -- Create subscription change event
        PERFORM create_automation_event(
          'subscription_change',
          subscriber_id_var,
          jsonb_build_object(
            'old_subscription', OLD.subscription,
            'new_subscription', NEW.subscription,
            'old_expiration', OLD.subscription_expiration,
            'new_expiration', NEW.subscription_expiration,
            'customer_id', NEW.customer_id,
            'change_date', NOW()
          ),
          'profile_update'
        );
      END IF;
    END;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for subscription changes
DROP TRIGGER IF EXISTS automation_subscription_change_trigger ON profiles;
CREATE TRIGGER automation_subscription_change_trigger
  AFTER UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION process_subscription_change_trigger();

-- =============================================
-- AUDIENCE MANAGEMENT ACTIONS
-- =============================================

-- Enhanced automation step types to include audience management
DO $$ 
BEGIN
  -- Add new step types if they don't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'audience_add' 
    AND enumtypid = 'automation_step_type'::regtype
  ) THEN
    ALTER TYPE automation_step_type ADD VALUE 'audience_add';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'audience_remove' 
    AND enumtypid = 'automation_step_type'::regtype
  ) THEN
    ALTER TYPE automation_step_type ADD VALUE 'audience_remove';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'tag_add' 
    AND enumtypid = 'automation_step_type'::regtype
  ) THEN
    ALTER TYPE automation_step_type ADD VALUE 'tag_add';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'tag_remove' 
    AND enumtypid = 'automation_step_type'::regtype
  ) THEN
    ALTER TYPE automation_step_type ADD VALUE 'tag_remove';
  END IF;
END $$;

-- Enhanced automation trigger types to include purchase events
DO $$ 
BEGIN
  -- Add new trigger types if they don't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'purchase_refunded' 
    AND enumtypid = 'automation_trigger_type'::regtype
  ) THEN
    ALTER TYPE automation_trigger_type ADD VALUE 'purchase_refunded';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'subscription_change' 
    AND enumtypid = 'automation_trigger_type'::regtype
  ) THEN
    ALTER TYPE automation_trigger_type ADD VALUE 'subscription_change';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'subscription_cancelled' 
    AND enumtypid = 'automation_trigger_type'::regtype
  ) THEN
    ALTER TYPE automation_trigger_type ADD VALUE 'subscription_cancelled';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'segment_entry' 
    AND enumtypid = 'automation_trigger_type'::regtype
  ) THEN
    ALTER TYPE automation_trigger_type ADD VALUE 'segment_entry';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'segment_exit' 
    AND enumtypid = 'automation_trigger_type'::regtype
  ) THEN
    ALTER TYPE automation_trigger_type ADD VALUE 'segment_exit';
  END IF;
END $$;

-- Function to add subscriber to audience
CREATE OR REPLACE FUNCTION add_subscriber_to_audience(
  p_subscriber_id UUID,
  p_audience_id UUID
) RETURNS BOOLEAN AS $$
BEGIN
  -- Check if audience exists and is static
  IF NOT EXISTS (
    SELECT 1 FROM email_audiences 
    WHERE id = p_audience_id 
    AND (filters->>'audience_type' = 'static' OR filters IS NULL)
  ) THEN
    RAISE EXCEPTION 'Audience not found or not static: %', p_audience_id;
  END IF;
  
  -- Add subscriber to audience (ignore if already exists)
  INSERT INTO email_audience_subscribers (audience_id, subscriber_id, added_at)
  VALUES (p_audience_id, p_subscriber_id, NOW())
  ON CONFLICT (audience_id, subscriber_id) DO NOTHING;
  
  -- Update audience subscriber count
  UPDATE email_audiences 
  SET subscriber_count = (
    SELECT COUNT(*) 
    FROM email_audience_subscribers 
    WHERE audience_id = p_audience_id
  ),
  updated_at = NOW()
  WHERE id = p_audience_id;
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to remove subscriber from audience
CREATE OR REPLACE FUNCTION remove_subscriber_from_audience(
  p_subscriber_id UUID,
  p_audience_id UUID
) RETURNS BOOLEAN AS $$
BEGIN
  -- Remove subscriber from audience
  DELETE FROM email_audience_subscribers 
  WHERE audience_id = p_audience_id 
  AND subscriber_id = p_subscriber_id;
  
  -- Update audience subscriber count
  UPDATE email_audiences 
  SET subscriber_count = (
    SELECT COUNT(*) 
    FROM email_audience_subscribers 
    WHERE audience_id = p_audience_id
  ),
  updated_at = NOW()
  WHERE id = p_audience_id;
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create audience entry/exit events
CREATE OR REPLACE FUNCTION process_audience_membership_trigger()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Create segment entry event
    PERFORM create_automation_event(
      'segment_entry',
      NEW.subscriber_id,
      jsonb_build_object(
        'audience_id', NEW.audience_id,
        'added_at', NEW.added_at
      ),
      'audience_management'
    );
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Create segment exit event
    PERFORM create_automation_event(
      'segment_exit',
      OLD.subscriber_id,
      jsonb_build_object(
        'audience_id', OLD.audience_id,
        'removed_at', NOW()
      ),
      'audience_management'
    );
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for audience membership changes
DROP TRIGGER IF EXISTS automation_audience_membership_trigger ON email_audience_subscribers;
CREATE TRIGGER automation_audience_membership_trigger
  AFTER INSERT OR DELETE ON email_audience_subscribers
  FOR EACH ROW EXECUTE FUNCTION process_audience_membership_trigger();

-- =============================================
-- ENHANCED AUTOMATION PROCESSING
-- =============================================

-- Update the automation job processing to handle new step types
CREATE OR REPLACE FUNCTION execute_automation_step(
  p_enrollment_id UUID,
  p_step_config JSONB
) RETURNS JSONB AS $$
DECLARE
  step_type TEXT;
  step_result JSONB := '{"success": false}';
  subscriber_id_var UUID;
  audience_id_var UUID;
BEGIN
  -- Get subscriber ID for this enrollment
  SELECT subscriber_id INTO subscriber_id_var
  FROM email_automation_enrollments
  WHERE id = p_enrollment_id;
  
  step_type := p_step_config->>'type';
  
  CASE step_type
    WHEN 'audience_add' THEN
      audience_id_var := (p_step_config->>'audience_id')::UUID;
      IF add_subscriber_to_audience(subscriber_id_var, audience_id_var) THEN
        step_result := jsonb_build_object(
          'success', true,
          'action', 'audience_add',
          'audience_id', audience_id_var,
          'subscriber_id', subscriber_id_var
        );
      END IF;
      
    WHEN 'audience_remove' THEN
      audience_id_var := (p_step_config->>'audience_id')::UUID;
      IF remove_subscriber_from_audience(subscriber_id_var, audience_id_var) THEN
        step_result := jsonb_build_object(
          'success', true,
          'action', 'audience_remove',
          'audience_id', audience_id_var,
          'subscriber_id', subscriber_id_var
        );
      END IF;
      
    WHEN 'tag_add' THEN
      -- Add tag to subscriber
      UPDATE subscribers 
      SET tags = CASE 
        WHEN tags IS NULL THEN ARRAY[p_step_config->>'tag_name']
        WHEN NOT (tags @> ARRAY[p_step_config->>'tag_name']) THEN array_append(tags, p_step_config->>'tag_name')
        ELSE tags
      END,
      updated_at = NOW()
      WHERE id = subscriber_id_var;
      
      step_result := jsonb_build_object(
        'success', true,
        'action', 'tag_add',
        'tag_name', p_step_config->>'tag_name'
      );
      
    WHEN 'tag_remove' THEN
      -- Remove tag from subscriber
      UPDATE subscribers 
      SET tags = array_remove(tags, p_step_config->>'tag_name'),
          updated_at = NOW()
      WHERE id = subscriber_id_var;
      
      step_result := jsonb_build_object(
        'success', true,
        'action', 'tag_remove',
        'tag_name', p_step_config->>'tag_name'
      );
      
    ELSE
      step_result := jsonb_build_object(
        'success', false,
        'error', 'Unknown step type: ' || step_type
      );
  END CASE;
  
  RETURN step_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- PURCHASE-SPECIFIC AUTOMATION CONDITIONS
-- =============================================

-- Function to check purchase-related conditions using Stripe data
CREATE OR REPLACE FUNCTION evaluate_purchase_conditions(
  p_subscriber_id UUID,
  p_conditions JSONB
) RETURNS BOOLEAN AS $$
DECLARE
  condition_met BOOLEAN := true;
  condition JSONB;
  field_name TEXT;
  operator TEXT;
  expected_value TEXT;
  amount_threshold DECIMAL;
  purchase_count INTEGER;
  customer_id_var TEXT;
BEGIN
  -- Get customer ID for this subscriber
  SELECT p.customer_id INTO customer_id_var
  FROM subscribers s
  JOIN profiles p ON p.id = s.user_id
  WHERE s.id = p_subscriber_id;
  
  IF customer_id_var IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Loop through each condition
  FOR condition IN SELECT * FROM jsonb_array_elements(p_conditions->'rules')
  LOOP
    field_name := condition->>'field';
    operator := condition->>'operator';
    expected_value := condition->>'value';
    
    CASE field_name
      WHEN 'purchase_amount' THEN
        -- Get total purchase amount from Stripe payment intents
        SELECT COALESCE(SUM((pi.amount::DECIMAL / 100)), 0) INTO amount_threshold
        FROM stripe_tables.stripe_payment_intents pi
        WHERE pi.customer = customer_id_var
        AND (pi.attrs->>'status') = 'succeeded';
        
        CASE operator
          WHEN 'greater_than' THEN
            condition_met := amount_threshold > expected_value::DECIMAL;
          WHEN 'less_than' THEN
            condition_met := amount_threshold < expected_value::DECIMAL;
          WHEN 'equals' THEN
            condition_met := amount_threshold = expected_value::DECIMAL;
          ELSE
            condition_met := FALSE;
        END CASE;
        
      WHEN 'purchase_count' THEN
        -- Get total purchase count from Stripe payment intents
        SELECT COUNT(*) INTO purchase_count
        FROM stripe_tables.stripe_payment_intents pi
        WHERE pi.customer = customer_id_var
        AND (pi.attrs->>'status') = 'succeeded';
        
        CASE operator
          WHEN 'greater_than' THEN
            condition_met := purchase_count > expected_value::INTEGER;
          WHEN 'less_than' THEN
            condition_met := purchase_count < expected_value::INTEGER;
          WHEN 'equals' THEN
            condition_met := purchase_count = expected_value::INTEGER;
          ELSE
            condition_met := FALSE;
        END CASE;
        
      WHEN 'subscription_status' THEN
        -- Check current subscription status from profiles
        SELECT EXISTS(
          SELECT 1 FROM profiles p
          WHERE p.customer_id = customer_id_var
          AND p.subscription = expected_value
        ) INTO condition_met;
        
      ELSE
        -- Unknown field, condition not met
        condition_met := FALSE;
    END CASE;
    
    -- If any condition fails, exit early
    IF NOT condition_met THEN
      EXIT;
    END IF;
  END LOOP;
  
  RETURN condition_met;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- SAMPLE AUTOMATION TEMPLATES
-- =============================================

-- Insert sample purchase-based automation templates
INSERT INTO automation_custom_fields (name, field_type, description, options) VALUES
  ('purchase_amount', 'number', 'Total purchase amount', '[]'),
  ('purchase_count', 'number', 'Total number of purchases', '[]'),
  ('last_purchase_date', 'date', 'Date of last purchase', '[]'),
  ('subscription_status', 'text', 'Current subscription status', '[]'),
  ('customer_lifetime_value', 'number', 'Total customer value', '[]')
ON CONFLICT (name) DO NOTHING;

-- Add indexes for performance on profiles table
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_change 
ON profiles(subscription, subscription_expiration);

CREATE INDEX IF NOT EXISTS idx_profiles_customer_id 
ON profiles(customer_id) WHERE customer_id IS NOT NULL;

-- Add helpful comments
COMMENT ON FUNCTION process_subscription_change_trigger() IS 'Creates automation events when subscription status changes';
COMMENT ON FUNCTION add_subscriber_to_audience(UUID, UUID) IS 'Adds a subscriber to a static audience and updates counts';
COMMENT ON FUNCTION remove_subscriber_from_audience(UUID, UUID) IS 'Removes a subscriber from an audience and updates counts';
COMMENT ON FUNCTION execute_automation_step(UUID, JSONB) IS 'Executes automation steps including audience management actions';
COMMENT ON FUNCTION evaluate_purchase_conditions(UUID, JSONB) IS 'Evaluates purchase-related conditions for automation triggers using Stripe data'; 