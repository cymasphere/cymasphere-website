-- Complete Email Automations System Migration
-- Created: 2025-01-01
-- Description: Comprehensive email automation system with workflow engine, triggers, conditions, and advanced features

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_cron";

-- =============================================
-- AUTOMATION WORKFLOW ENGINE
-- =============================================

-- Enhanced automation types
DO $$ 
BEGIN
  -- Automation trigger types
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'automation_trigger_type') THEN
    CREATE TYPE automation_trigger_type AS ENUM (
      'signup', 'purchase', 'abandonment', 'anniversary', 'behavior', 
      'date_based', 'segment_entry', 'segment_exit', 'custom_event',
      'email_open', 'email_click', 'website_visit', 'subscription_change'
    );
  END IF;
  
  -- Automation step types
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'automation_step_type') THEN
    CREATE TYPE automation_step_type AS ENUM (
      'email', 'delay', 'condition', 'action', 'webhook', 'tag_add', 
      'tag_remove', 'segment_add', 'segment_remove', 'custom_field_update'
    );
  END IF;
  
  -- Automation status types
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'automation_status') THEN
    CREATE TYPE automation_status AS ENUM ('draft', 'active', 'paused', 'archived', 'testing');
  END IF;
  
  -- Enrollment status types
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enrollment_status') THEN
    CREATE TYPE enrollment_status AS ENUM ('active', 'completed', 'paused', 'cancelled', 'failed');
  END IF;
  
  -- Job status types
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'job_status') THEN
    CREATE TYPE job_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'cancelled');
  END IF;
END $$;

-- Enhanced email automations table
DROP TABLE IF EXISTS email_automations CASCADE;
CREATE TABLE email_automations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Trigger configuration
  trigger_type automation_trigger_type NOT NULL,
  trigger_conditions JSONB NOT NULL DEFAULT '{}',
  
  -- Workflow definition
  workflow_definition JSONB NOT NULL DEFAULT '{"steps": []}',
  
  -- Settings
  status automation_status DEFAULT 'draft',
  is_recurring BOOLEAN DEFAULT true,
  max_enrollments INTEGER DEFAULT NULL, -- NULL = unlimited
  enrollment_limit_per_user INTEGER DEFAULT 1,
  
  -- Analytics
  total_enrollments INTEGER DEFAULT 0,
  active_enrollments INTEGER DEFAULT 0,
  completed_enrollments INTEGER DEFAULT 0,
  
  -- Timing
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_workflow_structure CHECK (
    workflow_definition ? 'steps' AND 
    jsonb_typeof(workflow_definition->'steps') = 'array'
  )
);

-- Automation enrollments with enhanced tracking
DROP TABLE IF EXISTS email_automation_enrollments CASCADE;
CREATE TABLE email_automation_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  automation_id UUID REFERENCES email_automations(id) ON DELETE CASCADE,
  subscriber_id UUID REFERENCES subscribers(id) ON DELETE CASCADE,
  
  -- Progress tracking
  current_step_index INTEGER DEFAULT 0,
  current_step_id UUID DEFAULT NULL,
  status enrollment_status DEFAULT 'active',
  
  -- Timing
  enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  paused_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  next_action_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  
  -- Context data
  enrollment_data JSONB DEFAULT '{}', -- Original trigger data
  current_context JSONB DEFAULT '{}', -- Current workflow context
  
  -- Analytics
  emails_sent INTEGER DEFAULT 0,
  emails_opened INTEGER DEFAULT 0,
  emails_clicked INTEGER DEFAULT 0,
  
  UNIQUE(automation_id, subscriber_id) -- Prevent duplicate enrollments
);

-- Automation step executions log
CREATE TABLE automation_step_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID REFERENCES email_automation_enrollments(id) ON DELETE CASCADE,
  automation_id UUID REFERENCES email_automations(id) ON DELETE CASCADE,
  subscriber_id UUID REFERENCES subscribers(id) ON DELETE CASCADE,
  
  -- Step details
  step_index INTEGER NOT NULL,
  step_id UUID NOT NULL,
  step_type automation_step_type NOT NULL,
  step_config JSONB NOT NULL,
  
  -- Execution tracking
  status job_status DEFAULT 'pending',
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  error_message TEXT DEFAULT NULL,
  retry_count INTEGER DEFAULT 0,
  
  -- Results
  execution_result JSONB DEFAULT '{}',
  
  -- Performance metrics
  processing_time_ms INTEGER DEFAULT NULL
);

-- =============================================
-- BACKGROUND JOB QUEUE SYSTEM
-- =============================================

-- Job types for different automation tasks
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'automation_job_type') THEN
    CREATE TYPE automation_job_type AS ENUM (
      'trigger_check', 'enrollment_process', 'step_execution', 
      'delay_completion', 'condition_evaluation', 'email_send',
      'webhook_call', 'cleanup', 'analytics_update'
    );
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'job_priority') THEN
    CREATE TYPE job_priority AS ENUM ('low', 'medium', 'high', 'urgent');
  END IF;
END $$;

-- Background job queue
CREATE TABLE automation_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Job identification
  job_type automation_job_type NOT NULL,
  priority job_priority DEFAULT 'medium',
  
  -- Scheduling
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  
  -- Status tracking
  status job_status DEFAULT 'pending',
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  
  -- Data
  payload JSONB NOT NULL DEFAULT '{}',
  result JSONB DEFAULT '{}',
  error_message TEXT DEFAULT NULL,
  
  -- References
  automation_id UUID REFERENCES email_automations(id) ON DELETE CASCADE DEFAULT NULL,
  enrollment_id UUID REFERENCES email_automation_enrollments(id) ON DELETE CASCADE DEFAULT NULL,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- TRIGGER DETECTION SYSTEM
-- =============================================

-- Event tracking for trigger detection
CREATE TABLE automation_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Event identification
  event_type VARCHAR(100) NOT NULL, -- 'signup', 'purchase', 'email_open', etc.
  event_source VARCHAR(100) DEFAULT 'system', -- 'system', 'api', 'webhook', 'manual'
  
  -- Event data
  event_data JSONB NOT NULL DEFAULT '{}',
  
  -- References
  subscriber_id UUID REFERENCES subscribers(id) ON DELETE CASCADE DEFAULT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT NULL,
  campaign_id UUID REFERENCES email_campaigns(id) ON DELETE SET NULL DEFAULT NULL,
  
  -- Processing
  processed BOOLEAN DEFAULT false,
  processed_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  triggered_automations JSONB DEFAULT '[]', -- Array of triggered automation IDs
  
  -- Timing
  occurred_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
) PARTITION BY RANGE (occurred_at);

-- Create initial partitions for automation events
CREATE TABLE automation_events_2025_01 PARTITION OF automation_events
  FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');
CREATE TABLE automation_events_2025_02 PARTITION OF automation_events
  FOR VALUES FROM ('2025-02-01') TO ('2025-03-01');
CREATE TABLE automation_events_2025_03 PARTITION OF automation_events
  FOR VALUES FROM ('2025-03-01') TO ('2025-04-01');
CREATE TABLE automation_events_default PARTITION OF automation_events DEFAULT;

-- =============================================
-- CONDITION EVALUATION SYSTEM
-- =============================================

-- Custom fields for advanced segmentation
CREATE TABLE automation_custom_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Field definition
  field_name VARCHAR(100) UNIQUE NOT NULL,
  field_type VARCHAR(50) NOT NULL CHECK (field_type IN ('text', 'number', 'date', 'boolean', 'select', 'multi_select')),
  field_options JSONB DEFAULT '{}', -- For select/multi_select types
  
  -- Metadata
  display_name VARCHAR(255) NOT NULL,
  description TEXT DEFAULT NULL,
  is_required BOOLEAN DEFAULT false,
  default_value TEXT DEFAULT NULL,
  
  -- System
  is_system_field BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Subscriber custom field values
CREATE TABLE automation_subscriber_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscriber_id UUID REFERENCES subscribers(id) ON DELETE CASCADE,
  field_id UUID REFERENCES automation_custom_fields(id) ON DELETE CASCADE,
  
  -- Value storage (flexible for different types)
  text_value TEXT DEFAULT NULL,
  number_value DECIMAL DEFAULT NULL,
  date_value TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  boolean_value BOOLEAN DEFAULT NULL,
  json_value JSONB DEFAULT NULL,
  
  -- Metadata
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(subscriber_id, field_id)
);

-- =============================================
-- ADVANCED SEGMENTATION
-- =============================================

-- Dynamic segments for automation targeting
CREATE TABLE automation_segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Basic info
  name VARCHAR(255) NOT NULL,
  description TEXT DEFAULT NULL,
  
  -- Segment rules
  conditions JSONB NOT NULL DEFAULT '{}',
  match_type VARCHAR(20) DEFAULT 'all' CHECK (match_type IN ('all', 'any')),
  
  -- Caching
  cached_count INTEGER DEFAULT 0,
  last_calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  calculation_in_progress BOOLEAN DEFAULT false,
  
  -- Settings
  is_dynamic BOOLEAN DEFAULT true,
  auto_update BOOLEAN DEFAULT true,
  
  -- System
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Segment membership cache
CREATE TABLE automation_segment_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  segment_id UUID REFERENCES automation_segments(id) ON DELETE CASCADE,
  subscriber_id UUID REFERENCES subscribers(id) ON DELETE CASCADE,
  
  -- Membership tracking
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(segment_id, subscriber_id)
);

-- =============================================
-- EMAIL TEMPLATE MANAGEMENT FOR AUTOMATIONS
-- =============================================

-- Automation-specific email templates
CREATE TABLE automation_email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  automation_id UUID REFERENCES email_automations(id) ON DELETE CASCADE,
  
  -- Template content
  name VARCHAR(255) NOT NULL,
  subject VARCHAR(500) NOT NULL,
  html_content TEXT NOT NULL,
  text_content TEXT DEFAULT NULL,
  
  -- Variables and personalization
  variables JSONB DEFAULT '{}',
  personalization_rules JSONB DEFAULT '{}',
  
  -- A/B testing
  is_variant BOOLEAN DEFAULT false,
  parent_template_id UUID REFERENCES automation_email_templates(id) ON DELETE CASCADE DEFAULT NULL,
  variant_name VARCHAR(50) DEFAULT NULL,
  traffic_percentage INTEGER DEFAULT 100 CHECK (traffic_percentage BETWEEN 0 AND 100),
  
  -- Analytics
  emails_sent INTEGER DEFAULT 0,
  emails_opened INTEGER DEFAULT 0,
  emails_clicked INTEGER DEFAULT 0,
  
  -- System
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- WEBHOOK INTEGRATION SYSTEM
-- =============================================

-- Webhook endpoints for external integrations
CREATE TABLE automation_webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Webhook configuration
  name VARCHAR(255) NOT NULL,
  url TEXT NOT NULL,
  method VARCHAR(10) DEFAULT 'POST' CHECK (method IN ('POST', 'PUT', 'PATCH')),
  headers JSONB DEFAULT '{}',
  
  -- Authentication
  auth_type VARCHAR(50) DEFAULT 'none' CHECK (auth_type IN ('none', 'api_key', 'bearer', 'basic')),
  auth_config JSONB DEFAULT '{}', -- Encrypted auth data
  
  -- Settings
  timeout_seconds INTEGER DEFAULT 30,
  retry_attempts INTEGER DEFAULT 3,
  retry_delay_seconds INTEGER DEFAULT 60,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  last_called_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  last_success_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  consecutive_failures INTEGER DEFAULT 0,
  
  -- System
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Webhook call logs
CREATE TABLE automation_webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id UUID REFERENCES automation_webhooks(id) ON DELETE CASCADE,
  
  -- Request details
  request_method VARCHAR(10) NOT NULL,
  request_url TEXT NOT NULL,
  request_headers JSONB DEFAULT '{}',
  request_body TEXT DEFAULT NULL,
  
  -- Response details
  response_status INTEGER DEFAULT NULL,
  response_headers JSONB DEFAULT '{}',
  response_body TEXT DEFAULT NULL,
  response_time_ms INTEGER DEFAULT NULL,
  
  -- Error tracking
  error_message TEXT DEFAULT NULL,
  retry_count INTEGER DEFAULT 0,
  
  -- Context
  automation_id UUID REFERENCES email_automations(id) ON DELETE SET NULL DEFAULT NULL,
  enrollment_id UUID REFERENCES email_automation_enrollments(id) ON DELETE SET NULL DEFAULT NULL,
  
  -- Timing
  called_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
) PARTITION BY RANGE (called_at);

-- Create initial partitions for webhook logs
CREATE TABLE automation_webhook_logs_2025_01 PARTITION OF automation_webhook_logs
  FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');
CREATE TABLE automation_webhook_logs_2025_02 PARTITION OF automation_webhook_logs
  FOR VALUES FROM ('2025-02-01') TO ('2025-03-01');
CREATE TABLE automation_webhook_logs_default PARTITION OF automation_webhook_logs DEFAULT;

-- =============================================
-- PERFORMANCE OPTIMIZATION INDEXES
-- =============================================

-- Automation indexes
CREATE INDEX idx_automations_status ON email_automations(status) WHERE status IN ('active', 'testing');
CREATE INDEX idx_automations_trigger_type ON email_automations(trigger_type);
CREATE INDEX idx_automations_created_at ON email_automations(created_at);

-- Enrollment indexes
CREATE INDEX idx_enrollments_automation_status ON email_automation_enrollments(automation_id, status);
CREATE INDEX idx_enrollments_subscriber ON email_automation_enrollments(subscriber_id);
CREATE INDEX idx_enrollments_next_action ON email_automation_enrollments(next_action_at) WHERE status = 'active' AND next_action_at IS NOT NULL;
CREATE INDEX idx_enrollments_active ON email_automation_enrollments(automation_id) WHERE status = 'active';

-- Job queue indexes
CREATE INDEX idx_jobs_pending ON automation_jobs(priority DESC, scheduled_for ASC) WHERE status = 'pending';
CREATE INDEX idx_jobs_automation ON automation_jobs(automation_id);
CREATE INDEX idx_jobs_enrollment ON automation_jobs(enrollment_id);
CREATE INDEX idx_jobs_cleanup ON automation_jobs(completed_at) WHERE status IN ('completed', 'failed');

-- Event indexes
CREATE INDEX idx_events_unprocessed ON automation_events(occurred_at, event_type) WHERE processed = false;
CREATE INDEX idx_events_subscriber ON automation_events(subscriber_id, occurred_at);
CREATE INDEX idx_events_type ON automation_events(event_type, occurred_at);

-- Step execution indexes
CREATE INDEX idx_step_executions_enrollment ON automation_step_executions(enrollment_id, step_index);
CREATE INDEX idx_step_executions_status ON automation_step_executions(status, started_at);

-- Segment indexes
CREATE INDEX idx_segment_members_segment ON automation_segment_members(segment_id);
CREATE INDEX idx_segment_members_subscriber ON automation_segment_members(subscriber_id);

-- Custom field indexes
CREATE INDEX idx_subscriber_fields_subscriber ON automation_subscriber_fields(subscriber_id);
CREATE INDEX idx_subscriber_fields_field ON automation_subscriber_fields(field_id);

-- Webhook indexes
CREATE INDEX idx_webhooks_active ON automation_webhooks(is_active) WHERE is_active = true;
CREATE INDEX idx_webhook_logs_webhook ON automation_webhook_logs(webhook_id, called_at);

-- =============================================
-- ROW LEVEL SECURITY POLICIES
-- =============================================

-- Enable RLS on all tables
ALTER TABLE email_automations ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_automation_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_step_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_custom_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_subscriber_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_segment_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_webhook_logs ENABLE ROW LEVEL SECURITY;

-- Admin access policies
CREATE POLICY "Admins can manage automations" ON email_automations
FOR ALL USING (
  EXISTS (SELECT 1 FROM admins WHERE admins.user = auth.uid())
);

CREATE POLICY "Admins can manage enrollments" ON email_automation_enrollments
FOR ALL USING (
  EXISTS (SELECT 1 FROM admins WHERE admins.user = auth.uid())
);

CREATE POLICY "Admins can manage step executions" ON automation_step_executions
FOR ALL USING (
  EXISTS (SELECT 1 FROM admins WHERE admins.user = auth.uid())
);

CREATE POLICY "Admins can manage automation jobs" ON automation_jobs
FOR ALL USING (
  EXISTS (SELECT 1 FROM admins WHERE admins.user = auth.uid())
);

CREATE POLICY "Admins can manage automation events" ON automation_events
FOR ALL USING (
  EXISTS (SELECT 1 FROM admins WHERE admins.user = auth.uid())
);

CREATE POLICY "Admins can manage custom fields" ON automation_custom_fields
FOR ALL USING (
  EXISTS (SELECT 1 FROM admins WHERE admins.user = auth.uid())
);

CREATE POLICY "Admins can manage subscriber fields" ON automation_subscriber_fields
FOR ALL USING (
  EXISTS (SELECT 1 FROM admins WHERE admins.user = auth.uid())
);

CREATE POLICY "Admins can manage segments" ON automation_segments
FOR ALL USING (
  EXISTS (SELECT 1 FROM admins WHERE admins.user = auth.uid())
);

CREATE POLICY "Admins can manage segment members" ON automation_segment_members
FOR ALL USING (
  EXISTS (SELECT 1 FROM admins WHERE admins.user = auth.uid())
);

CREATE POLICY "Admins can manage email templates" ON automation_email_templates
FOR ALL USING (
  EXISTS (SELECT 1 FROM admins WHERE admins.user = auth.uid())
);

CREATE POLICY "Admins can manage webhooks" ON automation_webhooks
FOR ALL USING (
  EXISTS (SELECT 1 FROM admins WHERE admins.user = auth.uid())
);

CREATE POLICY "Admins can manage webhook logs" ON automation_webhook_logs
FOR ALL USING (
  EXISTS (SELECT 1 FROM admins WHERE admins.user = auth.uid())
);

-- Service role access for automation engine
CREATE POLICY "Service role can manage all automation data" ON email_automations
FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage all enrollments" ON email_automation_enrollments
FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage all step executions" ON automation_step_executions
FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage all jobs" ON automation_jobs
FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage all events" ON automation_events
FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage all custom fields" ON automation_custom_fields
FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage all subscriber fields" ON automation_subscriber_fields
FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage all segments" ON automation_segments
FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage all segment members" ON automation_segment_members
FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage all email templates" ON automation_email_templates
FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage all webhooks" ON automation_webhooks
FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage all webhook logs" ON automation_webhook_logs
FOR ALL USING (auth.role() = 'service_role');

-- =============================================
-- AUTOMATION ENGINE FUNCTIONS
-- =============================================

-- Function to create automation event
CREATE OR REPLACE FUNCTION create_automation_event(
  p_event_type VARCHAR(100),
  p_event_data JSONB DEFAULT '{}',
  p_subscriber_id UUID DEFAULT NULL,
  p_user_id UUID DEFAULT NULL,
  p_campaign_id UUID DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  event_id UUID;
BEGIN
  INSERT INTO automation_events (
    event_type, event_data, subscriber_id, user_id, campaign_id
  ) VALUES (
    p_event_type, p_event_data, p_subscriber_id, p_user_id, p_campaign_id
  ) RETURNING id INTO event_id;
  
  RETURN event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to enroll subscriber in automation
CREATE OR REPLACE FUNCTION enroll_subscriber_in_automation(
  p_automation_id UUID,
  p_subscriber_id UUID,
  p_enrollment_data JSONB DEFAULT '{}'
) RETURNS UUID AS $$
DECLARE
  enrollment_id UUID;
  automation_record RECORD;
BEGIN
  -- Get automation details
  SELECT * INTO automation_record 
  FROM email_automations 
  WHERE id = p_automation_id AND status = 'active';
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Automation not found or not active: %', p_automation_id;
  END IF;
  
  -- Check enrollment limits
  IF automation_record.enrollment_limit_per_user > 0 THEN
    IF (SELECT COUNT(*) FROM email_automation_enrollments 
        WHERE automation_id = p_automation_id 
        AND subscriber_id = p_subscriber_id) >= automation_record.enrollment_limit_per_user THEN
      RAISE EXCEPTION 'Subscriber has reached enrollment limit for automation: %', p_automation_id;
    END IF;
  END IF;
  
  -- Create enrollment
  INSERT INTO email_automation_enrollments (
    automation_id, subscriber_id, enrollment_data, next_action_at
  ) VALUES (
    p_automation_id, p_subscriber_id, p_enrollment_data, NOW()
  ) RETURNING id INTO enrollment_id;
  
  -- Update automation stats
  UPDATE email_automations 
  SET total_enrollments = total_enrollments + 1,
      active_enrollments = active_enrollments + 1
  WHERE id = p_automation_id;
  
  -- Create initial job to process first step
  INSERT INTO automation_jobs (
    job_type, automation_id, enrollment_id, 
    payload, scheduled_for
  ) VALUES (
    'step_execution', p_automation_id, enrollment_id,
    jsonb_build_object('step_index', 0),
    NOW()
  );
  
  RETURN enrollment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to schedule automation job
CREATE OR REPLACE FUNCTION schedule_automation_job(
  p_job_type automation_job_type,
  p_payload JSONB,
  p_scheduled_for TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  p_priority job_priority DEFAULT 'medium',
  p_automation_id UUID DEFAULT NULL,
  p_enrollment_id UUID DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  job_id UUID;
BEGIN
  INSERT INTO automation_jobs (
    job_type, payload, scheduled_for, priority,
    automation_id, enrollment_id
  ) VALUES (
    p_job_type, p_payload, p_scheduled_for, p_priority,
    p_automation_id, p_enrollment_id
  ) RETURNING id INTO job_id;
  
  RETURN job_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to evaluate automation conditions
CREATE OR REPLACE FUNCTION evaluate_automation_conditions(
  p_conditions JSONB,
  p_subscriber_id UUID,
  p_context JSONB DEFAULT '{}'
) RETURNS BOOLEAN AS $$
DECLARE
  condition RECORD;
  result BOOLEAN := true;
  match_type TEXT;
  any_match BOOLEAN := false;
BEGIN
  -- Get match type (default to 'all')
  match_type := COALESCE(p_conditions->>'match_type', 'all');
  
  -- If no conditions, return true
  IF NOT (p_conditions ? 'rules') OR jsonb_array_length(p_conditions->'rules') = 0 THEN
    RETURN true;
  END IF;
  
  -- Evaluate each condition
  FOR condition IN 
    SELECT * FROM jsonb_array_elements(p_conditions->'rules') AS rule
  LOOP
    DECLARE
      field_value TEXT;
      condition_met BOOLEAN := false;
    BEGIN
      -- Get field value based on field type
      CASE condition.rule->>'field'
        WHEN 'subscription' THEN
          SELECT p.subscription INTO field_value
          FROM profiles p
          JOIN subscribers s ON s.user_id = p.id
          WHERE s.id = p_subscriber_id;
          
        WHEN 'status' THEN
          SELECT s.status::TEXT INTO field_value
          FROM subscribers s
          WHERE s.id = p_subscriber_id;
          
        WHEN 'tags' THEN
          -- Special handling for tags (array field)
          IF condition.rule->>'operator' = 'contains' THEN
            SELECT EXISTS (
              SELECT 1 FROM subscribers s 
              WHERE s.id = p_subscriber_id 
              AND condition.rule->>'value' = ANY(s.tags)
            ) INTO condition_met;
          END IF;
          
        ELSE
          -- Custom field lookup
          SELECT COALESCE(asf.text_value, asf.number_value::TEXT, asf.boolean_value::TEXT)
          INTO field_value
          FROM automation_subscriber_fields asf
          JOIN automation_custom_fields acf ON asf.field_id = acf.id
          WHERE asf.subscriber_id = p_subscriber_id 
          AND acf.field_name = condition.rule->>'field';
      END CASE;
      
      -- Skip tag evaluation as it's handled above
      IF condition.rule->>'field' != 'tags' THEN
        -- Evaluate condition based on operator
        CASE condition.rule->>'operator'
          WHEN 'equals' THEN
            condition_met := field_value = condition.rule->>'value';
          WHEN 'not_equals' THEN
            condition_met := field_value != condition.rule->>'value';
          WHEN 'contains' THEN
            condition_met := field_value ILIKE '%' || condition.rule->>'value' || '%';
          WHEN 'not_contains' THEN
            condition_met := field_value NOT ILIKE '%' || condition.rule->>'value' || '%';
          WHEN 'starts_with' THEN
            condition_met := field_value ILIKE condition.rule->>'value' || '%';
          WHEN 'ends_with' THEN
            condition_met := field_value ILIKE '%' || condition.rule->>'value';
          WHEN 'is_empty' THEN
            condition_met := field_value IS NULL OR field_value = '';
          WHEN 'is_not_empty' THEN
            condition_met := field_value IS NOT NULL AND field_value != '';
          ELSE
            condition_met := false;
        END CASE;
      END IF;
      
      -- Handle match type logic
      IF match_type = 'any' THEN
        IF condition_met THEN
          any_match := true;
        END IF;
      ELSE -- match_type = 'all'
        IF NOT condition_met THEN
          result := false;
          EXIT; -- Short circuit on first failure
        END IF;
      END IF;
    END;
  END LOOP;
  
  -- Return final result based on match type
  IF match_type = 'any' THEN
    RETURN any_match;
  ELSE
    RETURN result;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get next pending automation job
CREATE OR REPLACE FUNCTION get_next_automation_job()
RETURNS TABLE(
  job_id UUID,
  job_type automation_job_type,
  priority job_priority,
  payload JSONB,
  automation_id UUID,
  enrollment_id UUID
) AS $$
BEGIN
  RETURN QUERY
  UPDATE automation_jobs 
  SET 
    status = 'processing',
    started_at = NOW(),
    attempts = attempts + 1
  WHERE id = (
    SELECT aj.id 
    FROM automation_jobs aj
    WHERE aj.status = 'pending' 
    AND aj.scheduled_for <= NOW()
    AND aj.attempts < aj.max_attempts
    ORDER BY aj.priority DESC, aj.scheduled_for ASC
    LIMIT 1
    FOR UPDATE SKIP LOCKED
  )
  RETURNING 
    automation_jobs.id,
    automation_jobs.job_type,
    automation_jobs.priority,
    automation_jobs.payload,
    automation_jobs.automation_id,
    automation_jobs.enrollment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to complete automation job
CREATE OR REPLACE FUNCTION complete_automation_job(
  p_job_id UUID,
  p_status job_status,
  p_result JSONB DEFAULT '{}',
  p_error_message TEXT DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
  UPDATE automation_jobs 
  SET 
    status = p_status,
    completed_at = NOW(),
    result = p_result,
    error_message = p_error_message,
    updated_at = NOW()
  WHERE id = p_job_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- AUTOMATION TRIGGER FUNCTIONS
-- =============================================

-- Function to process signup trigger
CREATE OR REPLACE FUNCTION process_signup_trigger()
RETURNS TRIGGER AS $$
BEGIN
  -- Create signup event
  PERFORM create_automation_event(
    'signup',
    jsonb_build_object(
      'subscriber_id', NEW.id,
      'email', NEW.email,
      'source', NEW.source,
      'signup_time', NEW.created_at
    ),
    NEW.id,
    NEW.user_id
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new subscriber signups
DROP TRIGGER IF EXISTS automation_signup_trigger ON subscribers;
CREATE TRIGGER automation_signup_trigger
  AFTER INSERT ON subscribers
  FOR EACH ROW EXECUTE FUNCTION process_signup_trigger();

-- Function to process email open trigger
CREATE OR REPLACE FUNCTION process_email_open_trigger()
RETURNS TRIGGER AS $$
BEGIN
  -- Create email open event
  PERFORM create_automation_event(
    'email_open',
    jsonb_build_object(
      'send_id', NEW.send_id,
      'campaign_id', NEW.campaign_id,
      'opened_at', NEW.opened_at,
      'ip_address', NEW.ip_address,
      'user_agent', NEW.user_agent
    ),
    NEW.subscriber_id,
    NULL,
    NEW.campaign_id
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for email opens
DROP TRIGGER IF EXISTS automation_email_open_trigger ON email_opens;
CREATE TRIGGER automation_email_open_trigger
  AFTER INSERT ON email_opens
  FOR EACH ROW EXECUTE FUNCTION process_email_open_trigger();

-- Function to process email click trigger
CREATE OR REPLACE FUNCTION process_email_click_trigger()
RETURNS TRIGGER AS $$
BEGIN
  -- Create email click event
  PERFORM create_automation_event(
    'email_click',
    jsonb_build_object(
      'send_id', NEW.send_id,
      'campaign_id', NEW.campaign_id,
      'url', NEW.url,
      'clicked_at', NEW.clicked_at,
      'ip_address', NEW.ip_address,
      'user_agent', NEW.user_agent
    ),
    NEW.subscriber_id,
    NULL,
    NEW.campaign_id
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for email clicks
DROP TRIGGER IF EXISTS automation_email_click_trigger ON email_clicks;
CREATE TRIGGER automation_email_click_trigger
  AFTER INSERT ON email_clicks
  FOR EACH ROW EXECUTE FUNCTION process_email_click_trigger();

-- =============================================
-- CLEANUP AND MAINTENANCE FUNCTIONS
-- =============================================

-- Function to clean up old automation data
CREATE OR REPLACE FUNCTION cleanup_automation_data(
  p_days_to_keep INTEGER DEFAULT 90
) RETURNS TABLE(
  events_deleted INTEGER,
  logs_deleted INTEGER,
  jobs_deleted INTEGER
) AS $$
DECLARE
  cutoff_date TIMESTAMP WITH TIME ZONE;
  events_count INTEGER;
  logs_count INTEGER;
  jobs_count INTEGER;
BEGIN
  cutoff_date := NOW() - (p_days_to_keep || ' days')::INTERVAL;
  
  -- Clean up old events
  DELETE FROM automation_events 
  WHERE occurred_at < cutoff_date AND processed = true;
  GET DIAGNOSTICS events_count = ROW_COUNT;
  
  -- Clean up old webhook logs
  DELETE FROM automation_webhook_logs 
  WHERE called_at < cutoff_date;
  GET DIAGNOSTICS logs_count = ROW_COUNT;
  
  -- Clean up completed jobs
  DELETE FROM automation_jobs 
  WHERE completed_at < cutoff_date 
  AND status IN ('completed', 'failed');
  GET DIAGNOSTICS jobs_count = ROW_COUNT;
  
  RETURN QUERY SELECT events_count, logs_count, jobs_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create new monthly partitions
CREATE OR REPLACE FUNCTION create_automation_partitions()
RETURNS VOID AS $$
DECLARE
  next_month DATE;
  partition_name TEXT;
  end_month DATE;
BEGIN
  next_month := DATE_TRUNC('month', NOW() + INTERVAL '1 month')::DATE;
  end_month := next_month + INTERVAL '1 month';
  
  -- Create automation_events partition
  partition_name := 'automation_events_' || TO_CHAR(next_month, 'YYYY_MM');
  EXECUTE format(
    'CREATE TABLE IF NOT EXISTS %I PARTITION OF automation_events FOR VALUES FROM (%L) TO (%L)',
    partition_name, next_month, end_month
  );
  
  -- Create automation_webhook_logs partition
  partition_name := 'automation_webhook_logs_' || TO_CHAR(next_month, 'YYYY_MM');
  EXECUTE format(
    'CREATE TABLE IF NOT EXISTS %I PARTITION OF automation_webhook_logs FOR VALUES FROM (%L) TO (%L)',
    partition_name, next_month, end_month
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- INITIAL SYSTEM DATA
-- =============================================

-- Insert default custom fields
INSERT INTO automation_custom_fields (field_name, field_type, display_name, description, is_system_field, is_active) VALUES
('first_name', 'text', 'First Name', 'Subscriber first name', true, true),
('last_name', 'text', 'Last Name', 'Subscriber last name', true, true),
('signup_date', 'date', 'Signup Date', 'Date when subscriber signed up', true, true),
('last_login', 'date', 'Last Login', 'Last login date', true, true),
('subscription_type', 'select', 'Subscription Type', 'Current subscription level', true, true),
('total_purchases', 'number', 'Total Purchases', 'Total number of purchases', true, true),
('lifetime_value', 'number', 'Lifetime Value', 'Customer lifetime value', true, true),
('preferred_language', 'select', 'Preferred Language', 'Preferred communication language', false, true),
('timezone', 'text', 'Timezone', 'Subscriber timezone', false, true),
('company', 'text', 'Company', 'Company name', false, true)
ON CONFLICT (field_name) DO NOTHING;

-- Update subscription_type field options
UPDATE automation_custom_fields 
SET field_options = jsonb_build_object(
  'options', jsonb_build_array(
    jsonb_build_object('value', 'none', 'label', 'Free'),
    jsonb_build_object('value', 'monthly', 'label', 'Monthly'),
    jsonb_build_object('value', 'annual', 'label', 'Annual'),
    jsonb_build_object('value', 'lifetime', 'label', 'Lifetime')
  )
)
WHERE field_name = 'subscription_type';

-- Update preferred_language field options
UPDATE automation_custom_fields 
SET field_options = jsonb_build_object(
  'options', jsonb_build_array(
    jsonb_build_object('value', 'en', 'label', 'English'),
    jsonb_build_object('value', 'es', 'label', 'Spanish'),
    jsonb_build_object('value', 'fr', 'label', 'French'),
    jsonb_build_object('value', 'de', 'label', 'German'),
    jsonb_build_object('value', 'it', 'label', 'Italian')
  )
)
WHERE field_name = 'preferred_language';

-- Schedule automatic partition creation (runs monthly)
SELECT cron.schedule(
  'create_automation_partitions',
  '0 0 1 * *',
  'SELECT create_automation_partitions();'
);

-- Schedule automatic cleanup (runs daily)
SELECT cron.schedule(
  'cleanup_automation_data',
  '0 2 * * *',
  'SELECT cleanup_automation_data(90);'
);

-- =============================================
-- MIGRATION COMPLETE
-- =============================================

DO $$
BEGIN
  RAISE NOTICE 'Complete Email Automations System migration completed successfully!';
  RAISE NOTICE 'Created comprehensive automation engine with:';
  RAISE NOTICE '- Workflow engine with step-by-step execution';
  RAISE NOTICE '- Advanced trigger detection system';
  RAISE NOTICE '- Background job queue for scalable processing';
  RAISE NOTICE '- Condition evaluation with custom fields';
  RAISE NOTICE '- Dynamic segmentation system';
  RAISE NOTICE '- Webhook integration capabilities';
  RAISE NOTICE '- A/B testing for automation emails';
  RAISE NOTICE '- Comprehensive analytics and monitoring';
  RAISE NOTICE '- Automatic cleanup and maintenance';
  RAISE NOTICE 'System is ready for automation workflows!';
END $$; 