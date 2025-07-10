-- Complete Email Automations System Migration
-- Created: 2025-07-03
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
DO $$
BEGIN
  -- Check if table exists and add missing columns
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'email_automations') THEN
    -- Add missing columns if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'email_automations' AND column_name = 'trigger_type') THEN
      ALTER TABLE email_automations ADD COLUMN trigger_type automation_trigger_type;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'email_automations' AND column_name = 'trigger_conditions') THEN
      ALTER TABLE email_automations ADD COLUMN trigger_conditions JSONB NOT NULL DEFAULT '{}';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'email_automations' AND column_name = 'workflow_definition') THEN
      ALTER TABLE email_automations ADD COLUMN workflow_definition JSONB NOT NULL DEFAULT '{"steps": []}';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'email_automations' AND column_name = 'status') THEN
      ALTER TABLE email_automations ADD COLUMN status automation_status DEFAULT 'draft';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'email_automations' AND column_name = 'is_recurring') THEN
      ALTER TABLE email_automations ADD COLUMN is_recurring BOOLEAN DEFAULT true;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'email_automations' AND column_name = 'max_enrollments') THEN
      ALTER TABLE email_automations ADD COLUMN max_enrollments INTEGER DEFAULT NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'email_automations' AND column_name = 'enrollment_limit_per_user') THEN
      ALTER TABLE email_automations ADD COLUMN enrollment_limit_per_user INTEGER DEFAULT 1;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'email_automations' AND column_name = 'total_enrollments') THEN
      ALTER TABLE email_automations ADD COLUMN total_enrollments INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'email_automations' AND column_name = 'active_enrollments') THEN
      ALTER TABLE email_automations ADD COLUMN active_enrollments INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'email_automations' AND column_name = 'completed_enrollments') THEN
      ALTER TABLE email_automations ADD COLUMN completed_enrollments INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'email_automations' AND column_name = 'created_by') THEN
      ALTER TABLE email_automations ADD COLUMN created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
    END IF;
  ELSE
    -- Create the table if it doesn't exist
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
  END IF;
END $$;

-- Automation enrollments with enhanced tracking
CREATE TABLE IF NOT EXISTS email_automation_enrollments (
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
CREATE TABLE IF NOT EXISTS automation_step_executions (
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
CREATE TABLE IF NOT EXISTS automation_jobs (
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

-- Event tracking for trigger detection (partitioned by date for performance)
CREATE TABLE IF NOT EXISTS automation_events (
  id UUID DEFAULT gen_random_uuid(),
  
  -- Event identification
  event_type VARCHAR(50) NOT NULL,
  subscriber_id UUID REFERENCES subscribers(id) ON DELETE CASCADE,
  
  -- Event data
  event_data JSONB NOT NULL DEFAULT '{}',
  
  -- Processing
  processed BOOLEAN DEFAULT false,
  processed_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  
  -- Timing
  occurred_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Metadata
  source VARCHAR(100) DEFAULT NULL,
  session_id VARCHAR(255) DEFAULT NULL,
  
  -- Composite primary key including partition column
  PRIMARY KEY (id, occurred_at)
) PARTITION BY RANGE (occurred_at);

-- Create initial partitions (current month and next month)
CREATE TABLE IF NOT EXISTS automation_events_default PARTITION OF automation_events DEFAULT;

-- =============================================
-- ADVANCED SEGMENTATION SYSTEM
-- =============================================

-- Custom fields for advanced segmentation
CREATE TABLE IF NOT EXISTS automation_custom_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  field_type VARCHAR(20) NOT NULL CHECK (field_type IN ('text', 'number', 'date', 'boolean', 'select')),
  description TEXT,
  options JSONB DEFAULT '[]', -- For select fields
  is_required BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Subscriber field values
CREATE TABLE IF NOT EXISTS automation_subscriber_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscriber_id UUID REFERENCES subscribers(id) ON DELETE CASCADE,
  field_id UUID REFERENCES automation_custom_fields(id) ON DELETE CASCADE,
  value TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(subscriber_id, field_id)
);

-- Dynamic segments
CREATE TABLE IF NOT EXISTS automation_segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  conditions JSONB NOT NULL DEFAULT '{}',
  
  -- Caching
  member_count INTEGER DEFAULT 0,
  last_calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  
  -- Settings
  is_dynamic BOOLEAN DEFAULT true,
  auto_update BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Segment membership cache
CREATE TABLE IF NOT EXISTS automation_segment_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  segment_id UUID REFERENCES automation_segments(id) ON DELETE CASCADE,
  subscriber_id UUID REFERENCES subscribers(id) ON DELETE CASCADE,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(segment_id, subscriber_id)
);

-- =============================================
-- EMAIL TEMPLATE SYSTEM
-- =============================================

-- Automation-specific email templates
CREATE TABLE IF NOT EXISTS automation_email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  html_content TEXT NOT NULL,
  text_content TEXT DEFAULT NULL,
  
  -- Template metadata
  template_type VARCHAR(50) DEFAULT 'automation',
  category VARCHAR(100) DEFAULT NULL,
  
  -- A/B testing
  is_variant BOOLEAN DEFAULT false,
  parent_template_id UUID REFERENCES automation_email_templates(id) ON DELETE CASCADE DEFAULT NULL,
  variant_name VARCHAR(100) DEFAULT NULL,
  
  -- Analytics
  usage_count INTEGER DEFAULT 0,
  
  -- Timing
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- WEBHOOK INTEGRATION SYSTEM
-- =============================================

-- Webhook endpoints for external integrations
CREATE TABLE IF NOT EXISTS automation_webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  url VARCHAR(500) NOT NULL,
  method VARCHAR(10) DEFAULT 'POST' CHECK (method IN ('GET', 'POST', 'PUT', 'PATCH', 'DELETE')),
  
  -- Authentication
  headers JSONB DEFAULT '{}',
  auth_type VARCHAR(20) DEFAULT 'none' CHECK (auth_type IN ('none', 'basic', 'bearer', 'api_key')),
  auth_config JSONB DEFAULT '{}',
  
  -- Settings
  timeout_seconds INTEGER DEFAULT 30,
  retry_attempts INTEGER DEFAULT 3,
  is_active BOOLEAN DEFAULT true,
  
  -- Analytics
  total_calls INTEGER DEFAULT 0,
  successful_calls INTEGER DEFAULT 0,
  failed_calls INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Webhook call logs (partitioned by date)
CREATE TABLE IF NOT EXISTS automation_webhook_logs (
  id UUID DEFAULT gen_random_uuid(),
  webhook_id UUID REFERENCES automation_webhooks(id) ON DELETE CASCADE,
  
  -- Request details
  request_payload JSONB NOT NULL,
  request_headers JSONB DEFAULT '{}',
  
  -- Response details
  response_status INTEGER DEFAULT NULL,
  response_body TEXT DEFAULT NULL,
  response_headers JSONB DEFAULT '{}',
  
  -- Timing
  called_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  response_time_ms INTEGER DEFAULT NULL,
  
  -- Status
  success BOOLEAN DEFAULT false,
  error_message TEXT DEFAULT NULL,
  
  -- Context
  automation_id UUID REFERENCES email_automations(id) ON DELETE CASCADE DEFAULT NULL,
  enrollment_id UUID REFERENCES email_automation_enrollments(id) ON DELETE CASCADE DEFAULT NULL,
  
  -- Composite primary key including partition column
  PRIMARY KEY (id, called_at)
) PARTITION BY RANGE (called_at);

-- Create initial partitions
CREATE TABLE IF NOT EXISTS automation_webhook_logs_default PARTITION OF automation_webhook_logs DEFAULT;

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

-- Email automations indexes
CREATE INDEX IF NOT EXISTS idx_automations_status ON email_automations(status) WHERE status IN ('active', 'testing');
CREATE INDEX IF NOT EXISTS idx_automations_trigger_type ON email_automations(trigger_type);
CREATE INDEX IF NOT EXISTS idx_automations_created_at ON email_automations(created_at);

-- Enrollment indexes
CREATE INDEX IF NOT EXISTS idx_enrollments_automation_status ON email_automation_enrollments(automation_id, status);
CREATE INDEX IF NOT EXISTS idx_enrollments_subscriber ON email_automation_enrollments(subscriber_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_next_action ON email_automation_enrollments(next_action_at) WHERE status = 'active' AND next_action_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_enrollments_active ON email_automation_enrollments(automation_id) WHERE status = 'active';

-- Job queue indexes
CREATE INDEX IF NOT EXISTS idx_jobs_pending ON automation_jobs(priority DESC, scheduled_for ASC) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_jobs_automation ON automation_jobs(automation_id);
CREATE INDEX IF NOT EXISTS idx_jobs_enrollment ON automation_jobs(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_jobs_cleanup ON automation_jobs(completed_at) WHERE status IN ('completed', 'failed');

-- Event indexes
CREATE INDEX IF NOT EXISTS idx_events_unprocessed ON automation_events(occurred_at, event_type) WHERE processed = false;
CREATE INDEX IF NOT EXISTS idx_events_subscriber ON automation_events(subscriber_id, occurred_at);
CREATE INDEX IF NOT EXISTS idx_events_type ON automation_events(event_type, occurred_at);

-- Step execution indexes
CREATE INDEX IF NOT EXISTS idx_step_executions_enrollment ON automation_step_executions(enrollment_id, step_index);
CREATE INDEX IF NOT EXISTS idx_step_executions_status ON automation_step_executions(status, started_at);

-- Segment indexes
CREATE INDEX IF NOT EXISTS idx_segment_members_segment ON automation_segment_members(segment_id);
CREATE INDEX IF NOT EXISTS idx_segment_members_subscriber ON automation_segment_members(subscriber_id);

-- Custom field indexes
CREATE INDEX IF NOT EXISTS idx_subscriber_fields_subscriber ON automation_subscriber_fields(subscriber_id);
CREATE INDEX IF NOT EXISTS idx_subscriber_fields_field ON automation_subscriber_fields(field_id);

-- Webhook indexes
CREATE INDEX IF NOT EXISTS idx_webhooks_active ON automation_webhooks(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_webhook_logs_webhook ON automation_webhook_logs(webhook_id, called_at);

-- =============================================
-- ROW LEVEL SECURITY
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

-- Admin policies for all tables
CREATE POLICY "Admins can manage all automation data" ON email_automations
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM admins 
    WHERE admins.user = auth.uid()
  )
);

CREATE POLICY "Admins can manage all enrollments" ON email_automation_enrollments
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM admins 
    WHERE admins.user = auth.uid()
  )
);

CREATE POLICY "Admins can manage all step executions" ON automation_step_executions
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM admins 
    WHERE admins.user = auth.uid()
  )
);

CREATE POLICY "Admins can manage all jobs" ON automation_jobs
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM admins 
    WHERE admins.user = auth.uid()
  )
);

CREATE POLICY "Admins can manage all events" ON automation_events
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM admins 
    WHERE admins.user = auth.uid()
  )
);

CREATE POLICY "Admins can manage all custom fields" ON automation_custom_fields
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM admins 
    WHERE admins.user = auth.uid()
  )
);

CREATE POLICY "Admins can manage all subscriber fields" ON automation_subscriber_fields
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM admins 
    WHERE admins.user = auth.uid()
  )
);

CREATE POLICY "Admins can manage all segments" ON automation_segments
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM admins 
    WHERE admins.user = auth.uid()
  )
);

CREATE POLICY "Admins can manage all segment members" ON automation_segment_members
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM admins 
    WHERE admins.user = auth.uid()
  )
);

CREATE POLICY "Admins can manage all email templates" ON automation_email_templates
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM admins 
    WHERE admins.user = auth.uid()
  )
);

CREATE POLICY "Admins can manage all webhooks" ON automation_webhooks
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM admins 
    WHERE admins.user = auth.uid()
  )
);

CREATE POLICY "Admins can manage all webhook logs" ON automation_webhook_logs
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM admins 
    WHERE admins.user = auth.uid()
  )
);

-- Service role policies (for API and background jobs)
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
-- AUTOMATION PROCESSING FUNCTIONS
-- =============================================

-- Function to create automation events
CREATE OR REPLACE FUNCTION create_automation_event(
  p_event_type VARCHAR(50),
  p_subscriber_id UUID,
  p_event_data JSONB DEFAULT '{}',
  p_source VARCHAR(100) DEFAULT NULL,
  p_session_id VARCHAR(255) DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_event_id UUID;
BEGIN
  INSERT INTO automation_events (event_type, subscriber_id, event_data, source, session_id)
  VALUES (p_event_type, p_subscriber_id, p_event_data, p_source, p_session_id)
  RETURNING id INTO v_event_id;
  
  RETURN v_event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to enroll subscriber in automation
CREATE OR REPLACE FUNCTION enroll_subscriber_in_automation(
  p_automation_id UUID,
  p_subscriber_id UUID,
  p_enrollment_data JSONB DEFAULT '{}'
) RETURNS UUID AS $$
DECLARE
  v_enrollment_id UUID;
  v_automation_record RECORD;
  v_existing_count INTEGER;
BEGIN
  -- Get automation details
  SELECT * INTO v_automation_record 
  FROM email_automations 
  WHERE id = p_automation_id AND status = 'active';
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Automation not found or not active';
  END IF;
  
  -- Check enrollment limits
  SELECT COUNT(*) INTO v_existing_count
  FROM email_automation_enrollments
  WHERE automation_id = p_automation_id AND subscriber_id = p_subscriber_id;
  
  IF v_existing_count >= v_automation_record.enrollment_limit_per_user THEN
    RAISE EXCEPTION 'Enrollment limit exceeded for this subscriber';
  END IF;
  
  -- Check global enrollment limit
  IF v_automation_record.max_enrollments IS NOT NULL THEN
    SELECT COUNT(*) INTO v_existing_count
    FROM email_automation_enrollments
    WHERE automation_id = p_automation_id;
    
    IF v_existing_count >= v_automation_record.max_enrollments THEN
      RAISE EXCEPTION 'Global enrollment limit exceeded';
    END IF;
  END IF;
  
  -- Create enrollment
  INSERT INTO email_automation_enrollments (
    automation_id, subscriber_id, enrollment_data, next_action_at
  ) VALUES (
    p_automation_id, p_subscriber_id, p_enrollment_data, NOW()
  ) RETURNING id INTO v_enrollment_id;
  
  -- Update automation stats
  UPDATE email_automations 
  SET 
    total_enrollments = total_enrollments + 1,
    active_enrollments = active_enrollments + 1
  WHERE id = p_automation_id;
  
  -- Schedule first step
  PERFORM schedule_automation_job(
    'step_execution',
    jsonb_build_object(
      'enrollment_id', v_enrollment_id,
      'step_index', 0
    ),
    'medium',
    NOW()
  );
  
  RETURN v_enrollment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to schedule automation jobs
CREATE OR REPLACE FUNCTION schedule_automation_job(
  p_job_type automation_job_type,
  p_payload JSONB,
  p_priority job_priority DEFAULT 'medium',
  p_scheduled_for TIMESTAMP WITH TIME ZONE DEFAULT NOW()
) RETURNS UUID AS $$
DECLARE
  v_job_id UUID;
BEGIN
  INSERT INTO automation_jobs (
    job_type, payload, priority, scheduled_for,
    automation_id, enrollment_id
  ) VALUES (
    p_job_type, p_payload, p_priority, p_scheduled_for,
    (p_payload->>'automation_id')::UUID,
    (p_payload->>'enrollment_id')::UUID
  ) RETURNING id INTO v_job_id;
  
  RETURN v_job_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to evaluate automation conditions
CREATE OR REPLACE FUNCTION evaluate_automation_conditions(
  p_conditions JSONB,
  p_subscriber_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  v_condition JSONB;
  v_operator TEXT;
  v_field TEXT;
  v_value TEXT;
  v_subscriber_value TEXT;
  v_result BOOLEAN := TRUE;
BEGIN
  -- Handle empty conditions
  IF p_conditions IS NULL OR jsonb_array_length(p_conditions) = 0 THEN
    RETURN TRUE;
  END IF;
  
  -- Get operator (default to 'and')
  v_operator := COALESCE(p_conditions->>'operator', 'and');
  
  -- Process each condition
  FOR v_condition IN SELECT * FROM jsonb_array_elements(p_conditions->'conditions')
  LOOP
    v_field := v_condition->>'field';
    v_value := v_condition->>'value';
    
    -- Get subscriber field value
    CASE v_field
      WHEN 'email' THEN
        SELECT email INTO v_subscriber_value FROM subscribers WHERE id = p_subscriber_id;
      WHEN 'name' THEN
        SELECT name INTO v_subscriber_value FROM subscribers WHERE id = p_subscriber_id;
      WHEN 'created_at' THEN
        SELECT created_at::TEXT INTO v_subscriber_value FROM subscribers WHERE id = p_subscriber_id;
      ELSE
        -- Custom field
        SELECT value INTO v_subscriber_value 
        FROM automation_subscriber_fields asf
        JOIN automation_custom_fields acf ON asf.field_id = acf.id
        WHERE asf.subscriber_id = p_subscriber_id AND acf.name = v_field;
    END CASE;
    
    -- Evaluate condition based on operator
    CASE v_condition->>'operator'
      WHEN 'equals' THEN
        IF v_operator = 'and' THEN
          v_result := v_result AND (v_subscriber_value = v_value);
        ELSE
          v_result := v_result OR (v_subscriber_value = v_value);
        END IF;
      WHEN 'not_equals' THEN
        IF v_operator = 'and' THEN
          v_result := v_result AND (v_subscriber_value != v_value);
        ELSE
          v_result := v_result OR (v_subscriber_value != v_value);
        END IF;
      WHEN 'contains' THEN
        IF v_operator = 'and' THEN
          v_result := v_result AND (v_subscriber_value ILIKE '%' || v_value || '%');
        ELSE
          v_result := v_result OR (v_subscriber_value ILIKE '%' || v_value || '%');
        END IF;
      WHEN 'not_contains' THEN
        IF v_operator = 'and' THEN
          v_result := v_result AND (v_subscriber_value NOT ILIKE '%' || v_value || '%');
        ELSE
          v_result := v_result OR (v_subscriber_value NOT ILIKE '%' || v_value || '%');
        END IF;
      ELSE
        -- Default to equals
        IF v_operator = 'and' THEN
          v_result := v_result AND (v_subscriber_value = v_value);
        ELSE
          v_result := v_result OR (v_subscriber_value = v_value);
        END IF;
    END CASE;
    
    -- Early exit for AND operations
    IF v_operator = 'and' AND v_result = FALSE THEN
      RETURN FALSE;
    END IF;
    
    -- Early exit for OR operations
    IF v_operator = 'or' AND v_result = TRUE THEN
      RETURN TRUE;
    END IF;
  END LOOP;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get next job from queue
CREATE OR REPLACE FUNCTION get_next_automation_job()
RETURNS TABLE(
  job_id UUID,
  job_type automation_job_type,
  payload JSONB,
  automation_id UUID,
  enrollment_id UUID
) AS $$
DECLARE
  v_job_record RECORD;
BEGIN
  -- Get and lock the next pending job
  SELECT * INTO v_job_record
  FROM automation_jobs
  WHERE status = 'pending' 
    AND scheduled_for <= NOW()
    AND attempts < max_attempts
  ORDER BY priority DESC, scheduled_for ASC
  LIMIT 1
  FOR UPDATE SKIP LOCKED;
  
  IF FOUND THEN
    -- Update job status to processing
    UPDATE automation_jobs 
    SET 
      status = 'processing',
      started_at = NOW(),
      attempts = attempts + 1
    WHERE id = v_job_record.id;
    
    -- Return job details
    RETURN QUERY SELECT 
      v_job_record.id,
      v_job_record.job_type,
      v_job_record.payload,
      v_job_record.automation_id,
      v_job_record.enrollment_id;
  END IF;
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
-- TRIGGER FUNCTIONS
-- =============================================

-- Trigger function for new signups
CREATE OR REPLACE FUNCTION process_signup_trigger()
RETURNS TRIGGER AS $$
BEGIN
  -- Create signup event
  PERFORM create_automation_event(
    'signup',
    NEW.id,
    jsonb_build_object(
      'email', NEW.email,
      'name', NEW.name,
      'signup_date', NEW.created_at
    ),
    'system',
    NULL
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for signup events
DROP TRIGGER IF EXISTS automation_signup_trigger ON subscribers;
CREATE TRIGGER automation_signup_trigger
  AFTER INSERT ON subscribers
  FOR EACH ROW EXECUTE FUNCTION process_signup_trigger();

-- Trigger function for email opens
CREATE OR REPLACE FUNCTION process_email_open_trigger()
RETURNS TRIGGER AS $$
BEGIN
  -- Create email open event
  PERFORM create_automation_event(
    'email_open',
    NEW.subscriber_id,
    jsonb_build_object(
      'campaign_id', NEW.campaign_id,
      'email_id', NEW.email_id,
      'opened_at', NEW.opened_at
    ),
    'email_tracking',
    NULL
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for email open events
DROP TRIGGER IF EXISTS automation_email_open_trigger ON email_opens;
CREATE TRIGGER automation_email_open_trigger
  AFTER INSERT ON email_opens
  FOR EACH ROW EXECUTE FUNCTION process_email_open_trigger();

-- Trigger function for email clicks
CREATE OR REPLACE FUNCTION process_email_click_trigger()
RETURNS TRIGGER AS $$
BEGIN
  -- Create email click event
  PERFORM create_automation_event(
    'email_click',
    NEW.subscriber_id,
    jsonb_build_object(
      'campaign_id', NEW.campaign_id,
      'email_id', NEW.email_id,
      'url', NEW.url,
      'clicked_at', NEW.clicked_at
    ),
    'email_tracking',
    NULL
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for email click events
DROP TRIGGER IF EXISTS automation_email_click_trigger ON email_clicks;
CREATE TRIGGER automation_email_click_trigger
  AFTER INSERT ON email_clicks
  FOR EACH ROW EXECUTE FUNCTION process_email_click_trigger();

-- =============================================
-- INITIAL DATA SETUP
-- =============================================

-- Insert default custom fields
INSERT INTO automation_custom_fields (name, field_type, description, options) VALUES
  ('subscription_type', 'select', 'Type of subscription', '["free", "pro", "enterprise"]'),
  ('signup_source', 'select', 'How the user signed up', '["website", "app", "referral", "social"]'),
  ('language', 'select', 'Preferred language', '["en", "es", "fr", "de", "it"]'),
  ('company_size', 'select', 'Company size', '["1-10", "11-50", "51-200", "201-1000", "1000+"]'),
  ('industry', 'text', 'Industry or sector', '[]'),
  ('last_login', 'date', 'Last login date', '[]'),
  ('total_purchases', 'number', 'Total number of purchases', '[]'),
  ('lifetime_value', 'number', 'Customer lifetime value', '[]'),
  ('birthday', 'date', 'Birthday for anniversary campaigns', '[]'),
  ('phone', 'text', 'Phone number', '[]')
ON CONFLICT (name) DO NOTHING;

-- Create initial partitions for current and next month
DO $$
DECLARE
  current_month TEXT := to_char(CURRENT_DATE, 'YYYY_MM');
  next_month TEXT := to_char(CURRENT_DATE + INTERVAL '1 month', 'YYYY_MM');
BEGIN
  -- Events partitions
  EXECUTE format('CREATE TABLE IF NOT EXISTS automation_events_%s PARTITION OF automation_events FOR VALUES FROM (%L) TO (%L)',
    current_month, 
    date_trunc('month', CURRENT_DATE),
    date_trunc('month', CURRENT_DATE + INTERVAL '1 month')
  );
  
  EXECUTE format('CREATE TABLE IF NOT EXISTS automation_events_%s PARTITION OF automation_events FOR VALUES FROM (%L) TO (%L)',
    next_month,
    date_trunc('month', CURRENT_DATE + INTERVAL '1 month'),
    date_trunc('month', CURRENT_DATE + INTERVAL '2 months')
  );
  
  -- Webhook logs partitions
  EXECUTE format('CREATE TABLE IF NOT EXISTS automation_webhook_logs_%s PARTITION OF automation_webhook_logs FOR VALUES FROM (%L) TO (%L)',
    current_month,
    date_trunc('month', CURRENT_DATE),
    date_trunc('month', CURRENT_DATE + INTERVAL '1 month')
  );
  
  EXECUTE format('CREATE TABLE IF NOT EXISTS automation_webhook_logs_%s PARTITION OF automation_webhook_logs FOR VALUES FROM (%L) TO (%L)',
    next_month,
    date_trunc('month', CURRENT_DATE + INTERVAL '1 month'),
    date_trunc('month', CURRENT_DATE + INTERVAL '2 months')
  );
END $$;

-- =============================================
-- COMMENTS FOR DOCUMENTATION
-- =============================================

COMMENT ON TABLE email_automations IS 'Main automation workflows with trigger configuration and workflow definitions';
COMMENT ON TABLE email_automation_enrollments IS 'Tracks subscriber enrollments in automations with progress tracking';
COMMENT ON TABLE automation_step_executions IS 'Logs individual step executions with performance metrics';
COMMENT ON TABLE automation_jobs IS 'Background job queue for scalable automation processing';
COMMENT ON TABLE automation_events IS 'Event tracking for trigger detection (partitioned by date)';
COMMENT ON TABLE automation_custom_fields IS 'Custom field definitions for advanced segmentation';
COMMENT ON TABLE automation_subscriber_fields IS 'Subscriber custom field values';
COMMENT ON TABLE automation_segments IS 'Dynamic segmentation with caching';
COMMENT ON TABLE automation_segment_members IS 'Cached segment membership for performance';
COMMENT ON TABLE automation_email_templates IS 'Automation-specific email templates with A/B testing support';
COMMENT ON TABLE automation_webhooks IS 'Webhook endpoints for external integrations';
COMMENT ON TABLE automation_webhook_logs IS 'Webhook call logs (partitioned by date)';

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Email Automation System migration completed successfully!';
  RAISE NOTICE 'Created: % tables, % types, % functions, % triggers', 
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_name LIKE 'automation_%' OR table_name LIKE 'email_automation%'),
    (SELECT COUNT(*) FROM pg_type WHERE typname LIKE 'automation_%' OR typname LIKE 'enrollment_%' OR typname LIKE 'job_%'),
    (SELECT COUNT(*) FROM pg_proc WHERE proname LIKE '%automation%'),
    (SELECT COUNT(*) FROM pg_trigger WHERE tgname LIKE 'automation_%');
END $$;

-- RPC function to increment email sent count for automation enrollments
CREATE OR REPLACE FUNCTION increment_enrollment_emails_sent(enrollment_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE email_automation_enrollments 
  SET 
    emails_sent = COALESCE(emails_sent, 0) + 1,
    updated_at = NOW()
  WHERE id = enrollment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users and service role
GRANT EXECUTE ON FUNCTION increment_enrollment_emails_sent(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_enrollment_emails_sent(UUID) TO service_role;
