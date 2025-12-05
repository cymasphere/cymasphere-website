export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      admins: {
        Row: {
          id: number
          is_ad_manager: boolean | null
          user: string
        }
        Insert: {
          id?: number
          is_ad_manager?: boolean | null
          user: string
        }
        Update: {
          id?: number
          is_ad_manager?: boolean | null
          user?: string
        }
        Relationships: []
      }
      automation_custom_fields: {
        Row: {
          created_at: string | null
          description: string | null
          field_type: string
          id: string
          is_required: boolean | null
          name: string
          options: Json | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          field_type: string
          id?: string
          is_required?: boolean | null
          name: string
          options?: Json | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          field_type?: string
          id?: string
          is_required?: boolean | null
          name?: string
          options?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      automation_email_templates: {
        Row: {
          category: string | null
          created_at: string | null
          created_by: string | null
          html_content: string
          id: string
          is_variant: boolean | null
          name: string
          parent_template_id: string | null
          subject: string
          template_type: string | null
          text_content: string | null
          updated_at: string | null
          usage_count: number | null
          variant_name: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          html_content: string
          id?: string
          is_variant?: boolean | null
          name: string
          parent_template_id?: string | null
          subject: string
          template_type?: string | null
          text_content?: string | null
          updated_at?: string | null
          usage_count?: number | null
          variant_name?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          html_content?: string
          id?: string
          is_variant?: boolean | null
          name?: string
          parent_template_id?: string | null
          subject?: string
          template_type?: string | null
          text_content?: string | null
          updated_at?: string | null
          usage_count?: number | null
          variant_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "automation_email_templates_parent_template_id_fkey"
            columns: ["parent_template_id"]
            isOneToOne: false
            referencedRelation: "automation_email_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_events: {
        Row: {
          event_data: Json
          event_source: string | null
          event_type: string
          id: string
          occurred_at: string
          processed: boolean | null
          processed_at: string | null
          session_id: string | null
          source: string | null
          subscriber_id: string | null
        }
        Insert: {
          event_data?: Json
          event_source?: string | null
          event_type: string
          id?: string
          occurred_at?: string
          processed?: boolean | null
          processed_at?: string | null
          session_id?: string | null
          source?: string | null
          subscriber_id?: string | null
        }
        Update: {
          event_data?: Json
          event_source?: string | null
          event_type?: string
          id?: string
          occurred_at?: string
          processed?: boolean | null
          processed_at?: string | null
          session_id?: string | null
          source?: string | null
          subscriber_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "automation_events_subscriber_id_fkey"
            columns: ["subscriber_id"]
            isOneToOne: false
            referencedRelation: "subscribers"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_events_2025_07: {
        Row: {
          event_data: Json
          event_source: string | null
          event_type: string
          id: string
          occurred_at: string
          processed: boolean | null
          processed_at: string | null
          session_id: string | null
          source: string | null
          subscriber_id: string | null
        }
        Insert: {
          event_data?: Json
          event_source?: string | null
          event_type: string
          id?: string
          occurred_at?: string
          processed?: boolean | null
          processed_at?: string | null
          session_id?: string | null
          source?: string | null
          subscriber_id?: string | null
        }
        Update: {
          event_data?: Json
          event_source?: string | null
          event_type?: string
          id?: string
          occurred_at?: string
          processed?: boolean | null
          processed_at?: string | null
          session_id?: string | null
          source?: string | null
          subscriber_id?: string | null
        }
        Relationships: []
      }
      automation_events_2025_08: {
        Row: {
          event_data: Json
          event_source: string | null
          event_type: string
          id: string
          occurred_at: string
          processed: boolean | null
          processed_at: string | null
          session_id: string | null
          source: string | null
          subscriber_id: string | null
        }
        Insert: {
          event_data?: Json
          event_source?: string | null
          event_type: string
          id?: string
          occurred_at?: string
          processed?: boolean | null
          processed_at?: string | null
          session_id?: string | null
          source?: string | null
          subscriber_id?: string | null
        }
        Update: {
          event_data?: Json
          event_source?: string | null
          event_type?: string
          id?: string
          occurred_at?: string
          processed?: boolean | null
          processed_at?: string | null
          session_id?: string | null
          source?: string | null
          subscriber_id?: string | null
        }
        Relationships: []
      }
      automation_events_default: {
        Row: {
          event_data: Json
          event_source: string | null
          event_type: string
          id: string
          occurred_at: string
          processed: boolean | null
          processed_at: string | null
          session_id: string | null
          source: string | null
          subscriber_id: string | null
        }
        Insert: {
          event_data?: Json
          event_source?: string | null
          event_type: string
          id?: string
          occurred_at?: string
          processed?: boolean | null
          processed_at?: string | null
          session_id?: string | null
          source?: string | null
          subscriber_id?: string | null
        }
        Update: {
          event_data?: Json
          event_source?: string | null
          event_type?: string
          id?: string
          occurred_at?: string
          processed?: boolean | null
          processed_at?: string | null
          session_id?: string | null
          source?: string | null
          subscriber_id?: string | null
        }
        Relationships: []
      }
      automation_jobs: {
        Row: {
          attempts: number | null
          automation_id: string | null
          completed_at: string | null
          created_at: string | null
          enrollment_id: string | null
          error_message: string | null
          id: string
          job_type: Database["public"]["Enums"]["automation_job_type"]
          max_attempts: number | null
          payload: Json
          priority: Database["public"]["Enums"]["job_priority"] | null
          result: Json | null
          scheduled_for: string
          started_at: string | null
          status: Database["public"]["Enums"]["job_status"] | null
          updated_at: string | null
        }
        Insert: {
          attempts?: number | null
          automation_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          enrollment_id?: string | null
          error_message?: string | null
          id?: string
          job_type: Database["public"]["Enums"]["automation_job_type"]
          max_attempts?: number | null
          payload?: Json
          priority?: Database["public"]["Enums"]["job_priority"] | null
          result?: Json | null
          scheduled_for?: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["job_status"] | null
          updated_at?: string | null
        }
        Update: {
          attempts?: number | null
          automation_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          enrollment_id?: string | null
          error_message?: string | null
          id?: string
          job_type?: Database["public"]["Enums"]["automation_job_type"]
          max_attempts?: number | null
          payload?: Json
          priority?: Database["public"]["Enums"]["job_priority"] | null
          result?: Json | null
          scheduled_for?: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["job_status"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "automation_jobs_automation_id_fkey"
            columns: ["automation_id"]
            isOneToOne: false
            referencedRelation: "email_automations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automation_jobs_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "email_automation_enrollments"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_segment_members: {
        Row: {
          added_at: string | null
          id: string
          segment_id: string | null
          subscriber_id: string | null
        }
        Insert: {
          added_at?: string | null
          id?: string
          segment_id?: string | null
          subscriber_id?: string | null
        }
        Update: {
          added_at?: string | null
          id?: string
          segment_id?: string | null
          subscriber_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "automation_segment_members_segment_id_fkey"
            columns: ["segment_id"]
            isOneToOne: false
            referencedRelation: "automation_segments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automation_segment_members_subscriber_id_fkey"
            columns: ["subscriber_id"]
            isOneToOne: false
            referencedRelation: "subscribers"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_segments: {
        Row: {
          auto_update: boolean | null
          conditions: Json
          created_at: string | null
          description: string | null
          id: string
          is_dynamic: boolean | null
          last_calculated_at: string | null
          member_count: number | null
          name: string
          updated_at: string | null
        }
        Insert: {
          auto_update?: boolean | null
          conditions?: Json
          created_at?: string | null
          description?: string | null
          id?: string
          is_dynamic?: boolean | null
          last_calculated_at?: string | null
          member_count?: number | null
          name: string
          updated_at?: string | null
        }
        Update: {
          auto_update?: boolean | null
          conditions?: Json
          created_at?: string | null
          description?: string | null
          id?: string
          is_dynamic?: boolean | null
          last_calculated_at?: string | null
          member_count?: number | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      automation_step_executions: {
        Row: {
          automation_id: string | null
          completed_at: string | null
          enrollment_id: string | null
          error_message: string | null
          execution_result: Json | null
          id: string
          processing_time_ms: number | null
          retry_count: number | null
          started_at: string | null
          status: Database["public"]["Enums"]["job_status"] | null
          step_config: Json
          step_id: string
          step_index: number
          step_type: Database["public"]["Enums"]["automation_step_type"]
          subscriber_id: string | null
        }
        Insert: {
          automation_id?: string | null
          completed_at?: string | null
          enrollment_id?: string | null
          error_message?: string | null
          execution_result?: Json | null
          id?: string
          processing_time_ms?: number | null
          retry_count?: number | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["job_status"] | null
          step_config: Json
          step_id: string
          step_index: number
          step_type: Database["public"]["Enums"]["automation_step_type"]
          subscriber_id?: string | null
        }
        Update: {
          automation_id?: string | null
          completed_at?: string | null
          enrollment_id?: string | null
          error_message?: string | null
          execution_result?: Json | null
          id?: string
          processing_time_ms?: number | null
          retry_count?: number | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["job_status"] | null
          step_config?: Json
          step_id?: string
          step_index?: number
          step_type?: Database["public"]["Enums"]["automation_step_type"]
          subscriber_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "automation_step_executions_automation_id_fkey"
            columns: ["automation_id"]
            isOneToOne: false
            referencedRelation: "email_automations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automation_step_executions_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "email_automation_enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automation_step_executions_subscriber_id_fkey"
            columns: ["subscriber_id"]
            isOneToOne: false
            referencedRelation: "subscribers"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_subscriber_fields: {
        Row: {
          created_at: string | null
          field_id: string | null
          id: string
          subscriber_id: string | null
          updated_at: string | null
          value: string
        }
        Insert: {
          created_at?: string | null
          field_id?: string | null
          id?: string
          subscriber_id?: string | null
          updated_at?: string | null
          value: string
        }
        Update: {
          created_at?: string | null
          field_id?: string | null
          id?: string
          subscriber_id?: string | null
          updated_at?: string | null
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "automation_subscriber_fields_field_id_fkey"
            columns: ["field_id"]
            isOneToOne: false
            referencedRelation: "automation_custom_fields"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automation_subscriber_fields_subscriber_id_fkey"
            columns: ["subscriber_id"]
            isOneToOne: false
            referencedRelation: "subscribers"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_webhook_logs: {
        Row: {
          automation_id: string | null
          called_at: string
          enrollment_id: string | null
          error_message: string | null
          id: string
          request_headers: Json | null
          request_payload: Json
          response_body: string | null
          response_headers: Json | null
          response_status: number | null
          response_time_ms: number | null
          success: boolean | null
          webhook_id: string | null
        }
        Insert: {
          automation_id?: string | null
          called_at?: string
          enrollment_id?: string | null
          error_message?: string | null
          id?: string
          request_headers?: Json | null
          request_payload: Json
          response_body?: string | null
          response_headers?: Json | null
          response_status?: number | null
          response_time_ms?: number | null
          success?: boolean | null
          webhook_id?: string | null
        }
        Update: {
          automation_id?: string | null
          called_at?: string
          enrollment_id?: string | null
          error_message?: string | null
          id?: string
          request_headers?: Json | null
          request_payload?: Json
          response_body?: string | null
          response_headers?: Json | null
          response_status?: number | null
          response_time_ms?: number | null
          success?: boolean | null
          webhook_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "automation_webhook_logs_automation_id_fkey"
            columns: ["automation_id"]
            isOneToOne: false
            referencedRelation: "email_automations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automation_webhook_logs_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "email_automation_enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automation_webhook_logs_webhook_id_fkey"
            columns: ["webhook_id"]
            isOneToOne: false
            referencedRelation: "automation_webhooks"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_webhook_logs_2025_07: {
        Row: {
          automation_id: string | null
          called_at: string
          enrollment_id: string | null
          error_message: string | null
          id: string
          request_headers: Json | null
          request_payload: Json
          response_body: string | null
          response_headers: Json | null
          response_status: number | null
          response_time_ms: number | null
          success: boolean | null
          webhook_id: string | null
        }
        Insert: {
          automation_id?: string | null
          called_at?: string
          enrollment_id?: string | null
          error_message?: string | null
          id?: string
          request_headers?: Json | null
          request_payload: Json
          response_body?: string | null
          response_headers?: Json | null
          response_status?: number | null
          response_time_ms?: number | null
          success?: boolean | null
          webhook_id?: string | null
        }
        Update: {
          automation_id?: string | null
          called_at?: string
          enrollment_id?: string | null
          error_message?: string | null
          id?: string
          request_headers?: Json | null
          request_payload?: Json
          response_body?: string | null
          response_headers?: Json | null
          response_status?: number | null
          response_time_ms?: number | null
          success?: boolean | null
          webhook_id?: string | null
        }
        Relationships: []
      }
      automation_webhook_logs_2025_08: {
        Row: {
          automation_id: string | null
          called_at: string
          enrollment_id: string | null
          error_message: string | null
          id: string
          request_headers: Json | null
          request_payload: Json
          response_body: string | null
          response_headers: Json | null
          response_status: number | null
          response_time_ms: number | null
          success: boolean | null
          webhook_id: string | null
        }
        Insert: {
          automation_id?: string | null
          called_at?: string
          enrollment_id?: string | null
          error_message?: string | null
          id?: string
          request_headers?: Json | null
          request_payload: Json
          response_body?: string | null
          response_headers?: Json | null
          response_status?: number | null
          response_time_ms?: number | null
          success?: boolean | null
          webhook_id?: string | null
        }
        Update: {
          automation_id?: string | null
          called_at?: string
          enrollment_id?: string | null
          error_message?: string | null
          id?: string
          request_headers?: Json | null
          request_payload?: Json
          response_body?: string | null
          response_headers?: Json | null
          response_status?: number | null
          response_time_ms?: number | null
          success?: boolean | null
          webhook_id?: string | null
        }
        Relationships: []
      }
      automation_webhook_logs_default: {
        Row: {
          automation_id: string | null
          called_at: string
          enrollment_id: string | null
          error_message: string | null
          id: string
          request_headers: Json | null
          request_payload: Json
          response_body: string | null
          response_headers: Json | null
          response_status: number | null
          response_time_ms: number | null
          success: boolean | null
          webhook_id: string | null
        }
        Insert: {
          automation_id?: string | null
          called_at?: string
          enrollment_id?: string | null
          error_message?: string | null
          id?: string
          request_headers?: Json | null
          request_payload: Json
          response_body?: string | null
          response_headers?: Json | null
          response_status?: number | null
          response_time_ms?: number | null
          success?: boolean | null
          webhook_id?: string | null
        }
        Update: {
          automation_id?: string | null
          called_at?: string
          enrollment_id?: string | null
          error_message?: string | null
          id?: string
          request_headers?: Json | null
          request_payload?: Json
          response_body?: string | null
          response_headers?: Json | null
          response_status?: number | null
          response_time_ms?: number | null
          success?: boolean | null
          webhook_id?: string | null
        }
        Relationships: []
      }
      automation_webhooks: {
        Row: {
          auth_config: Json | null
          auth_type: string | null
          created_at: string | null
          failed_calls: number | null
          headers: Json | null
          id: string
          is_active: boolean | null
          method: string | null
          name: string
          retry_attempts: number | null
          successful_calls: number | null
          timeout_seconds: number | null
          total_calls: number | null
          updated_at: string | null
          url: string
        }
        Insert: {
          auth_config?: Json | null
          auth_type?: string | null
          created_at?: string | null
          failed_calls?: number | null
          headers?: Json | null
          id?: string
          is_active?: boolean | null
          method?: string | null
          name: string
          retry_attempts?: number | null
          successful_calls?: number | null
          timeout_seconds?: number | null
          total_calls?: number | null
          updated_at?: string | null
          url: string
        }
        Update: {
          auth_config?: Json | null
          auth_type?: string | null
          created_at?: string | null
          failed_calls?: number | null
          headers?: Json | null
          id?: string
          is_active?: boolean | null
          method?: string | null
          name?: string
          retry_attempts?: number | null
          successful_calls?: number | null
          timeout_seconds?: number | null
          total_calls?: number | null
          updated_at?: string | null
          url?: string
        }
        Relationships: []
      }
      background_jobs: {
        Row: {
          completed_at: string | null
          created_at: string | null
          data: Json
          error: string | null
          id: string
          result: Json | null
          started_at: string | null
          status: string
          type: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          data?: Json
          error?: string | null
          id?: string
          result?: Json | null
          started_at?: string | null
          status?: string
          type: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          data?: Json
          error?: string | null
          id?: string
          result?: Json | null
          started_at?: string | null
          status?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      email_audience_subscribers: {
        Row: {
          added_at: string | null
          audience_id: string | null
          id: string
          subscriber_id: string | null
        }
        Insert: {
          added_at?: string | null
          audience_id?: string | null
          id?: string
          subscriber_id?: string | null
        }
        Update: {
          added_at?: string | null
          audience_id?: string | null
          id?: string
          subscriber_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_audience_subscribers_audience_id_fkey"
            columns: ["audience_id"]
            isOneToOne: false
            referencedRelation: "email_audiences"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_audience_subscribers_subscriber_id_fkey"
            columns: ["subscriber_id"]
            isOneToOne: false
            referencedRelation: "subscribers"
            referencedColumns: ["id"]
          },
        ]
      }
      email_audiences: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          filters: Json | null
          id: string
          name: string
          subscriber_count: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          filters?: Json | null
          id?: string
          name: string
          subscriber_count?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          filters?: Json | null
          id?: string
          name?: string
          subscriber_count?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      email_automation_enrollments: {
        Row: {
          automation_id: string | null
          completed_at: string | null
          current_context: Json | null
          current_step_id: string | null
          current_step_index: number | null
          emails_clicked: number | null
          emails_opened: number | null
          emails_sent: number | null
          enrolled_at: string | null
          enrollment_data: Json | null
          id: string
          next_action_at: string | null
          paused_at: string | null
          status: Database["public"]["Enums"]["enrollment_status"] | null
          subscriber_id: string | null
        }
        Insert: {
          automation_id?: string | null
          completed_at?: string | null
          current_context?: Json | null
          current_step_id?: string | null
          current_step_index?: number | null
          emails_clicked?: number | null
          emails_opened?: number | null
          emails_sent?: number | null
          enrolled_at?: string | null
          enrollment_data?: Json | null
          id?: string
          next_action_at?: string | null
          paused_at?: string | null
          status?: Database["public"]["Enums"]["enrollment_status"] | null
          subscriber_id?: string | null
        }
        Update: {
          automation_id?: string | null
          completed_at?: string | null
          current_context?: Json | null
          current_step_id?: string | null
          current_step_index?: number | null
          emails_clicked?: number | null
          emails_opened?: number | null
          emails_sent?: number | null
          enrolled_at?: string | null
          enrollment_data?: Json | null
          id?: string
          next_action_at?: string | null
          paused_at?: string | null
          status?: Database["public"]["Enums"]["enrollment_status"] | null
          subscriber_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_automation_enrollments_automation_id_fkey"
            columns: ["automation_id"]
            isOneToOne: false
            referencedRelation: "email_automations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_automation_enrollments_subscriber_id_fkey"
            columns: ["subscriber_id"]
            isOneToOne: false
            referencedRelation: "subscribers"
            referencedColumns: ["id"]
          },
        ]
      }
      email_automations: {
        Row: {
          active_enrollments: number | null
          completed_enrollments: number | null
          created_at: string | null
          created_by: string | null
          description: string | null
          enrollment_limit_per_user: number | null
          id: string
          is_active: boolean | null
          is_recurring: boolean | null
          max_enrollments: number | null
          name: string
          status: Database["public"]["Enums"]["automation_status"] | null
          template_id: string | null
          total_enrollments: number | null
          total_sent: number | null
          total_triggered: number | null
          trigger_conditions: Json | null
          trigger_type: Database["public"]["Enums"]["automation_trigger"] | null
          updated_at: string | null
          workflow_definition: Json
        }
        Insert: {
          active_enrollments?: number | null
          completed_enrollments?: number | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          enrollment_limit_per_user?: number | null
          id?: string
          is_active?: boolean | null
          is_recurring?: boolean | null
          max_enrollments?: number | null
          name: string
          status?: Database["public"]["Enums"]["automation_status"] | null
          template_id?: string | null
          total_enrollments?: number | null
          total_sent?: number | null
          total_triggered?: number | null
          trigger_conditions?: Json | null
          trigger_type?:
            | Database["public"]["Enums"]["automation_trigger"]
            | null
          updated_at?: string | null
          workflow_definition?: Json
        }
        Update: {
          active_enrollments?: number | null
          completed_enrollments?: number | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          enrollment_limit_per_user?: number | null
          id?: string
          is_active?: boolean | null
          is_recurring?: boolean | null
          max_enrollments?: number | null
          name?: string
          status?: Database["public"]["Enums"]["automation_status"] | null
          template_id?: string | null
          total_enrollments?: number | null
          total_sent?: number | null
          total_triggered?: number | null
          trigger_conditions?: Json | null
          trigger_type?:
            | Database["public"]["Enums"]["automation_trigger"]
            | null
          updated_at?: string | null
          workflow_definition?: Json
        }
        Relationships: [
          {
            foreignKeyName: "email_automations_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "email_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      email_campaign_audiences: {
        Row: {
          audience_id: string | null
          campaign_id: string | null
          created_at: string | null
          id: string
          is_excluded: boolean | null
        }
        Insert: {
          audience_id?: string | null
          campaign_id?: string | null
          created_at?: string | null
          id?: string
          is_excluded?: boolean | null
        }
        Update: {
          audience_id?: string | null
          campaign_id?: string | null
          created_at?: string | null
          id?: string
          is_excluded?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "email_campaign_audiences_audience_id_fkey"
            columns: ["audience_id"]
            isOneToOne: false
            referencedRelation: "email_audiences"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_campaign_audiences_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "email_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      email_campaigns: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          emails_bounced: number | null
          emails_clicked: number | null
          emails_delivered: number | null
          emails_opened: number | null
          emails_sent: number | null
          emails_spam: number | null
          html_content: string | null
          id: string
          name: string
          preheader: string | null
          reply_to_email: string | null
          scheduled_at: string | null
          sender_email: string | null
          sender_name: string | null
          sent_at: string | null
          status: Database["public"]["Enums"]["campaign_status"] | null
          subject: string | null
          template_id: string | null
          text_content: string | null
          total_recipients: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          emails_bounced?: number | null
          emails_clicked?: number | null
          emails_delivered?: number | null
          emails_opened?: number | null
          emails_sent?: number | null
          emails_spam?: number | null
          html_content?: string | null
          id?: string
          name: string
          preheader?: string | null
          reply_to_email?: string | null
          scheduled_at?: string | null
          sender_email?: string | null
          sender_name?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["campaign_status"] | null
          subject?: string | null
          template_id?: string | null
          text_content?: string | null
          total_recipients?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          emails_bounced?: number | null
          emails_clicked?: number | null
          emails_delivered?: number | null
          emails_opened?: number | null
          emails_sent?: number | null
          emails_spam?: number | null
          html_content?: string | null
          id?: string
          name?: string
          preheader?: string | null
          reply_to_email?: string | null
          scheduled_at?: string | null
          sender_email?: string | null
          sender_name?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["campaign_status"] | null
          subject?: string | null
          template_id?: string | null
          text_content?: string | null
          total_recipients?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_campaigns_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "email_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      email_clicks: {
        Row: {
          campaign_id: string | null
          clicked_at: string | null
          id: string
          ip_address: unknown
          send_id: string | null
          subscriber_id: string | null
          url: string
          user_agent: string | null
        }
        Insert: {
          campaign_id?: string | null
          clicked_at?: string | null
          id?: string
          ip_address?: unknown
          send_id?: string | null
          subscriber_id?: string | null
          url: string
          user_agent?: string | null
        }
        Update: {
          campaign_id?: string | null
          clicked_at?: string | null
          id?: string
          ip_address?: unknown
          send_id?: string | null
          subscriber_id?: string | null
          url?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_clicks_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "email_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_clicks_send_id_fkey"
            columns: ["send_id"]
            isOneToOne: false
            referencedRelation: "email_sends"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_clicks_subscriber_id_fkey"
            columns: ["subscriber_id"]
            isOneToOne: false
            referencedRelation: "subscribers"
            referencedColumns: ["id"]
          },
        ]
      }
      email_opens: {
        Row: {
          campaign_id: string | null
          id: string
          ip_address: unknown
          opened_at: string | null
          send_id: string | null
          subscriber_id: string | null
          user_agent: string | null
        }
        Insert: {
          campaign_id?: string | null
          id?: string
          ip_address?: unknown
          opened_at?: string | null
          send_id?: string | null
          subscriber_id?: string | null
          user_agent?: string | null
        }
        Update: {
          campaign_id?: string | null
          id?: string
          ip_address?: unknown
          opened_at?: string | null
          send_id?: string | null
          subscriber_id?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_opens_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "email_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_opens_send_id_fkey"
            columns: ["send_id"]
            isOneToOne: false
            referencedRelation: "email_sends"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_opens_subscriber_id_fkey"
            columns: ["subscriber_id"]
            isOneToOne: false
            referencedRelation: "subscribers"
            referencedColumns: ["id"]
          },
        ]
      }
      email_sends: {
        Row: {
          automation_id: string | null
          bounce_reason: string | null
          bounced_at: string | null
          campaign_id: string | null
          created_at: string | null
          delivered_at: string | null
          email: string
          id: string
          message_id: string | null
          sent_at: string | null
          status: Database["public"]["Enums"]["email_send_status"] | null
          subscriber_id: string | null
        }
        Insert: {
          automation_id?: string | null
          bounce_reason?: string | null
          bounced_at?: string | null
          campaign_id?: string | null
          created_at?: string | null
          delivered_at?: string | null
          email: string
          id?: string
          message_id?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["email_send_status"] | null
          subscriber_id?: string | null
        }
        Update: {
          automation_id?: string | null
          bounce_reason?: string | null
          bounced_at?: string | null
          campaign_id?: string | null
          created_at?: string | null
          delivered_at?: string | null
          email?: string
          id?: string
          message_id?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["email_send_status"] | null
          subscriber_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_sends_automation_id_fkey"
            columns: ["automation_id"]
            isOneToOne: false
            referencedRelation: "email_automations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_sends_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "email_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_sends_subscriber_id_fkey"
            columns: ["subscriber_id"]
            isOneToOne: false
            referencedRelation: "subscribers"
            referencedColumns: ["id"]
          },
        ]
      }
      email_template_audiences: {
        Row: {
          audience_id: string
          created_at: string
          id: string
          is_excluded: boolean
          template_id: string
        }
        Insert: {
          audience_id: string
          created_at?: string
          id?: string
          is_excluded?: boolean
          template_id: string
        }
        Update: {
          audience_id?: string
          created_at?: string
          id?: string
          is_excluded?: boolean
          template_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_template_audiences_audience_id_fkey"
            columns: ["audience_id"]
            isOneToOne: false
            referencedRelation: "email_audiences"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_template_audiences_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "email_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      email_templates: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          html_content: string | null
          id: string
          last_used_at: string | null
          name: string
          status: Database["public"]["Enums"]["template_status"] | null
          subject: string | null
          template_type: Database["public"]["Enums"]["template_type"] | null
          text_content: string | null
          updated_at: string | null
          usage_count: number | null
          variables: Json | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          html_content?: string | null
          id?: string
          last_used_at?: string | null
          name: string
          status?: Database["public"]["Enums"]["template_status"] | null
          subject?: string | null
          template_type?: Database["public"]["Enums"]["template_type"] | null
          text_content?: string | null
          updated_at?: string | null
          usage_count?: number | null
          variables?: Json | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          html_content?: string | null
          id?: string
          last_used_at?: string | null
          name?: string
          status?: Database["public"]["Enums"]["template_status"] | null
          subject?: string | null
          template_type?: Database["public"]["Enums"]["template_type"] | null
          text_content?: string | null
          updated_at?: string | null
          usage_count?: number | null
          variables?: Json | null
        }
        Relationships: []
      }
      email_webhook_logs: {
        Row: {
          campaign_id: string | null
          created_at: string | null
          event_type: string
          id: string
          processed: boolean | null
          provider: string
          subscriber_id: string | null
          webhook_data: Json
        }
        Insert: {
          campaign_id?: string | null
          created_at?: string | null
          event_type: string
          id?: string
          processed?: boolean | null
          provider: string
          subscriber_id?: string | null
          webhook_data: Json
        }
        Update: {
          campaign_id?: string | null
          created_at?: string | null
          event_type?: string
          id?: string
          processed?: boolean | null
          provider?: string
          subscriber_id?: string | null
          webhook_data?: Json
        }
        Relationships: [
          {
            foreignKeyName: "email_webhook_logs_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "email_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_webhook_logs_subscriber_id_fkey"
            columns: ["subscriber_id"]
            isOneToOne: false
            referencedRelation: "subscribers"
            referencedColumns: ["id"]
          },
        ]
      }
      ios_subscriptions: {
        Row: {
          apple_validation_response: Json | null
          auto_renew_status: boolean | null
          created_at: string
          expires_date: string
          id: string
          is_active: boolean
          original_transaction_id: string | null
          product_id: string
          profile_id: string | null
          purchase_date: string
          receipt_data: string
          receipt_validated_at: string
          subscription_type: Database["public"]["Enums"]["subscription_type"]
          transaction_id: string
          updated_at: string
          user_id: string
          validation_status: string
        }
        Insert: {
          apple_validation_response?: Json | null
          auto_renew_status?: boolean | null
          created_at?: string
          expires_date: string
          id?: string
          is_active?: boolean
          original_transaction_id?: string | null
          product_id: string
          profile_id?: string | null
          purchase_date: string
          receipt_data: string
          receipt_validated_at?: string
          subscription_type?: Database["public"]["Enums"]["subscription_type"]
          transaction_id: string
          updated_at?: string
          user_id: string
          validation_status?: string
        }
        Update: {
          apple_validation_response?: Json | null
          auto_renew_status?: boolean | null
          created_at?: string
          expires_date?: string
          id?: string
          is_active?: boolean
          original_transaction_id?: string | null
          product_id?: string
          profile_id?: string | null
          purchase_date?: string
          receipt_data?: string
          receipt_validated_at?: string
          subscription_type?: Database["public"]["Enums"]["subscription_type"]
          transaction_id?: string
          updated_at?: string
          user_id?: string
          validation_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "ios_subscriptions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      meta_conversion_events: {
        Row: {
          client_ip: unknown
          created_at: string | null
          custom_data: Json | null
          error_message: string | null
          event_id: string | null
          event_name: string
          id: string
          meta_response_id: string | null
          status: string
          updated_at: string | null
          user_email: string | null
          user_id: string | null
        }
        Insert: {
          client_ip?: unknown
          created_at?: string | null
          custom_data?: Json | null
          error_message?: string | null
          event_id?: string | null
          event_name: string
          id?: string
          meta_response_id?: string | null
          status: string
          updated_at?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Update: {
          client_ip?: unknown
          created_at?: string | null
          custom_data?: Json | null
          error_message?: string | null
          event_id?: string | null
          event_name?: string
          id?: string
          meta_response_id?: string | null
          status?: string
          updated_at?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      playlist_videos: {
        Row: {
          condition_app_mode: string | null
          condition_musical_goal: string | null
          condition_tech_level: string | null
          condition_theory_level: string | null
          created_at: string | null
          id: string
          is_conditional: boolean | null
          is_optional: boolean | null
          playlist_id: string
          sequence_order: number
          video_id: string
        }
        Insert: {
          condition_app_mode?: string | null
          condition_musical_goal?: string | null
          condition_tech_level?: string | null
          condition_theory_level?: string | null
          created_at?: string | null
          id?: string
          is_conditional?: boolean | null
          is_optional?: boolean | null
          playlist_id: string
          sequence_order: number
          video_id: string
        }
        Update: {
          condition_app_mode?: string | null
          condition_musical_goal?: string | null
          condition_tech_level?: string | null
          condition_theory_level?: string | null
          created_at?: string | null
          id?: string
          is_conditional?: boolean | null
          is_optional?: boolean | null
          playlist_id?: string
          sequence_order?: number
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "playlist_videos_playlist_id_fkey"
            columns: ["playlist_id"]
            isOneToOne: false
            referencedRelation: "tutorial_playlists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "playlist_videos_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "tutorial_videos"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          customer_id: string | null
          email: string | null
          first_name: string | null
          id: string
          last_name: string | null
          last_stripe_api_check: string | null
          subscription: Database["public"]["Enums"]["subscription_type"]
          subscription_expiration: string | null
          subscription_source: string | null
          trial_expiration: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          customer_id?: string | null
          email?: string | null
          first_name?: string | null
          id: string
          last_name?: string | null
          last_stripe_api_check?: string | null
          subscription?: Database["public"]["Enums"]["subscription_type"]
          subscription_expiration?: string | null
          subscription_source?: string | null
          trial_expiration?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          customer_id?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          last_stripe_api_check?: string | null
          subscription?: Database["public"]["Enums"]["subscription_type"]
          subscription_expiration?: string | null
          subscription_source?: string | null
          trial_expiration?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      promotions: {
        Row: {
          active: boolean
          applicable_plans: string[] | null
          banner_theme: Json | null
          conversions: number | null
          created_at: string
          description: string | null
          discount_type: string
          discount_value: number
          end_date: string | null
          id: string
          name: string
          priority: number | null
          revenue: number | null
          sale_price_annual: number | null
          sale_price_lifetime: number | null
          sale_price_monthly: number | null
          start_date: string | null
          stripe_coupon_code: string | null
          stripe_coupon_created: boolean | null
          stripe_coupon_id: string | null
          title: string
          updated_at: string
          views: number | null
        }
        Insert: {
          active?: boolean
          applicable_plans?: string[] | null
          banner_theme?: Json | null
          conversions?: number | null
          created_at?: string
          description?: string | null
          discount_type: string
          discount_value: number
          end_date?: string | null
          id?: string
          name: string
          priority?: number | null
          revenue?: number | null
          sale_price_annual?: number | null
          sale_price_lifetime?: number | null
          sale_price_monthly?: number | null
          start_date?: string | null
          stripe_coupon_code?: string | null
          stripe_coupon_created?: boolean | null
          stripe_coupon_id?: string | null
          title: string
          updated_at?: string
          views?: number | null
        }
        Update: {
          active?: boolean
          applicable_plans?: string[] | null
          banner_theme?: Json | null
          conversions?: number | null
          created_at?: string
          description?: string | null
          discount_type?: string
          discount_value?: number
          end_date?: string | null
          id?: string
          name?: string
          priority?: number | null
          revenue?: number | null
          sale_price_annual?: number | null
          sale_price_lifetime?: number | null
          sale_price_monthly?: number | null
          start_date?: string | null
          stripe_coupon_code?: string | null
          stripe_coupon_created?: boolean | null
          stripe_coupon_id?: string | null
          title?: string
          updated_at?: string
          views?: number | null
        }
        Relationships: []
      }
      subscriber_imports: {
        Row: {
          created_at: string | null
          error_log: string | null
          failed_imports: number | null
          filename: string
          id: string
          import_status: string | null
          imported_by: string | null
          successful_imports: number | null
          total_rows: number
        }
        Insert: {
          created_at?: string | null
          error_log?: string | null
          failed_imports?: number | null
          filename: string
          id?: string
          import_status?: string | null
          imported_by?: string | null
          successful_imports?: number | null
          total_rows: number
        }
        Update: {
          created_at?: string | null
          error_log?: string | null
          failed_imports?: number | null
          filename?: string
          id?: string
          import_status?: string | null
          imported_by?: string | null
          successful_imports?: number | null
          total_rows?: number
        }
        Relationships: []
      }
      subscriber_tags: {
        Row: {
          color: string | null
          created_at: string | null
          description: string | null
          id: string
          name: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      subscribers: {
        Row: {
          bounce_reason: string | null
          bounced_at: string | null
          complained_at: string | null
          created_at: string | null
          email: string
          id: string
          metadata: Json | null
          preferences: Json | null
          source: string | null
          status: Database["public"]["Enums"]["subscriber_status"] | null
          subscribe_date: string | null
          tags: string[] | null
          unsubscribe_date: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          bounce_reason?: string | null
          bounced_at?: string | null
          complained_at?: string | null
          created_at?: string | null
          email: string
          id: string
          metadata?: Json | null
          preferences?: Json | null
          source?: string | null
          status?: Database["public"]["Enums"]["subscriber_status"] | null
          subscribe_date?: string | null
          tags?: string[] | null
          unsubscribe_date?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          bounce_reason?: string | null
          bounced_at?: string | null
          complained_at?: string | null
          created_at?: string | null
          email?: string
          id?: string
          metadata?: Json | null
          preferences?: Json | null
          source?: string | null
          status?: Database["public"]["Enums"]["subscriber_status"] | null
          subscribe_date?: string | null
          tags?: string[] | null
          unsubscribe_date?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      support_attachments: {
        Row: {
          attachment_type: Database["public"]["Enums"]["attachment_type"]
          created_at: string
          file_name: string
          file_size: number
          file_type: string
          id: string
          message_id: string
          storage_path: string
          url: string | null
        }
        Insert: {
          attachment_type: Database["public"]["Enums"]["attachment_type"]
          created_at?: string
          file_name: string
          file_size: number
          file_type: string
          id?: string
          message_id: string
          storage_path: string
          url?: string | null
        }
        Update: {
          attachment_type?: Database["public"]["Enums"]["attachment_type"]
          created_at?: string
          file_name?: string
          file_size?: number
          file_type?: string
          id?: string
          message_id?: string
          storage_path?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "support_attachments_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "support_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      support_messages: {
        Row: {
          content: string
          created_at: string
          edited_at: string | null
          id: string
          is_admin: boolean
          message_type: Database["public"]["Enums"]["message_type"]
          ticket_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          edited_at?: string | null
          id?: string
          is_admin?: boolean
          message_type?: Database["public"]["Enums"]["message_type"]
          ticket_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          edited_at?: string | null
          id?: string
          is_admin?: boolean
          message_type?: Database["public"]["Enums"]["message_type"]
          ticket_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          closed_at: string | null
          created_at: string
          description: string | null
          id: string
          resolved_at: string | null
          status: Database["public"]["Enums"]["ticket_status"]
          subject: string
          ticket_number: string
          updated_at: string
          user_id: string
        }
        Insert: {
          closed_at?: string | null
          created_at?: string
          description?: string | null
          id?: string
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["ticket_status"]
          subject: string
          ticket_number: string
          updated_at?: string
          user_id: string
        }
        Update: {
          closed_at?: string | null
          created_at?: string
          description?: string | null
          id?: string
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["ticket_status"]
          subject?: string
          ticket_number?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      tutorial_playlists: {
        Row: {
          app_mode_filter: string
          created_at: string | null
          description: string | null
          difficulty_rating: number | null
          estimated_duration: number | null
          id: string
          musical_goal: string
          name: string
          target_tech_level: string
          target_theory_level: string
          updated_at: string | null
        }
        Insert: {
          app_mode_filter: string
          created_at?: string | null
          description?: string | null
          difficulty_rating?: number | null
          estimated_duration?: number | null
          id?: string
          musical_goal: string
          name: string
          target_tech_level: string
          target_theory_level: string
          updated_at?: string | null
        }
        Update: {
          app_mode_filter?: string
          created_at?: string | null
          description?: string | null
          difficulty_rating?: number | null
          estimated_duration?: number | null
          id?: string
          musical_goal?: string
          name?: string
          target_tech_level?: string
          target_theory_level?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      tutorial_videos: {
        Row: {
          app_mode_applicability: string
          component_source_file: string | null
          created_at: string | null
          description: string | null
          duration: number | null
          feature_category: string
          id: string
          musical_context: string
          tech_level_required: string
          theory_level_required: string
          title: string
          updated_at: string | null
          video_order: number | null
          youtube_duration_cache_version: number | null
          youtube_duration_cached: number | null
          youtube_duration_last_updated: string | null
          youtube_video_id: string | null
        }
        Insert: {
          app_mode_applicability: string
          component_source_file?: string | null
          created_at?: string | null
          description?: string | null
          duration?: number | null
          feature_category: string
          id?: string
          musical_context: string
          tech_level_required: string
          theory_level_required: string
          title: string
          updated_at?: string | null
          video_order?: number | null
          youtube_duration_cache_version?: number | null
          youtube_duration_cached?: number | null
          youtube_duration_last_updated?: string | null
          youtube_video_id?: string | null
        }
        Update: {
          app_mode_applicability?: string
          component_source_file?: string | null
          created_at?: string | null
          description?: string | null
          duration?: number | null
          feature_category?: string
          id?: string
          musical_context?: string
          tech_level_required?: string
          theory_level_required?: string
          title?: string
          updated_at?: string | null
          video_order?: number | null
          youtube_duration_cache_version?: number | null
          youtube_duration_cached?: number | null
          youtube_duration_last_updated?: string | null
          youtube_video_id?: string | null
        }
        Relationships: []
      }
      user_management: {
        Row: {
          notes: string | null
          pro: boolean
          user_email: string
        }
        Insert: {
          notes?: string | null
          pro?: boolean
          user_email: string
        }
        Update: {
          notes?: string | null
          pro?: boolean
          user_email?: string
        }
        Relationships: []
      }
      user_sessions: {
        Row: {
          aal: string | null
          created_at: string | null
          factor_id: string | null
          id: string
          ip: unknown
          not_after: string | null
          refreshed_at: string | null
          tag: string | null
          updated_at: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          aal?: string | null
          created_at?: string | null
          factor_id?: string | null
          id: string
          ip?: unknown
          not_after?: string | null
          refreshed_at?: string | null
          tag?: string | null
          updated_at?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          aal?: string | null
          created_at?: string | null
          factor_id?: string | null
          id?: string
          ip?: unknown
          not_after?: string | null
          refreshed_at?: string | null
          tag?: string | null
          updated_at?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_tutorial_paths: {
        Row: {
          app_mode: string
          created_at: string | null
          generated_playlist_id: string | null
          id: string
          musical_goals: string[] | null
          prior_experience: string | null
          progress_data: Json | null
          tech_level: string
          theory_level: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          app_mode: string
          created_at?: string | null
          generated_playlist_id?: string | null
          id?: string
          musical_goals?: string[] | null
          prior_experience?: string | null
          progress_data?: Json | null
          tech_level: string
          theory_level: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          app_mode?: string
          created_at?: string | null
          generated_playlist_id?: string | null
          id?: string
          musical_goals?: string[] | null
          prior_experience?: string | null
          progress_data?: Json | null
          tech_level?: string
          theory_level?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_tutorial_paths_generated_playlist_id_fkey"
            columns: ["generated_playlist_id"]
            isOneToOne: false
            referencedRelation: "tutorial_playlists"
            referencedColumns: ["id"]
          },
        ]
      }
      video_progress: {
        Row: {
          created_at: string | null
          id: string
          is_completed: boolean | null
          last_watched_at: string | null
          playlist_id: string | null
          total_watch_time: number | null
          updated_at: string | null
          user_id: string | null
          video_id: string | null
          watch_percentage: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_completed?: boolean | null
          last_watched_at?: string | null
          playlist_id?: string | null
          total_watch_time?: number | null
          updated_at?: string | null
          user_id?: string | null
          video_id?: string | null
          watch_percentage?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_completed?: boolean | null
          last_watched_at?: string | null
          playlist_id?: string | null
          total_watch_time?: number | null
          updated_at?: string | null
          user_id?: string | null
          video_id?: string | null
          watch_percentage?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "video_progress_playlist_id_fkey"
            columns: ["playlist_id"]
            isOneToOne: false
            referencedRelation: "tutorial_playlists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_progress_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "tutorial_videos"
            referencedColumns: ["id"]
          },
        ]
      }
      video_relationships: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          related_video_id: string
          relationship_strength: number | null
          relationship_type: string
          video_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          related_video_id: string
          relationship_strength?: number | null
          relationship_type: string
          video_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          related_video_id?: string
          relationship_strength?: number | null
          relationship_type?: string
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_relationships_related_video_id_fkey"
            columns: ["related_video_id"]
            isOneToOne: false
            referencedRelation: "tutorial_videos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_relationships_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "tutorial_videos"
            referencedColumns: ["id"]
          },
        ]
      }
      video_scripts: {
        Row: {
          created_at: string | null
          demonstration: string | null
          explanation: string | null
          hook: string | null
          id: string
          last_updated: string | null
          location: string | null
          practice: string | null
          related: string | null
          script_content: string
          source_references: string | null
          video_id: string
        }
        Insert: {
          created_at?: string | null
          demonstration?: string | null
          explanation?: string | null
          hook?: string | null
          id?: string
          last_updated?: string | null
          location?: string | null
          practice?: string | null
          related?: string | null
          script_content: string
          source_references?: string | null
          video_id: string
        }
        Update: {
          created_at?: string | null
          demonstration?: string | null
          explanation?: string | null
          hook?: string | null
          id?: string
          last_updated?: string | null
          location?: string | null
          practice?: string | null
          related?: string | null
          script_content?: string
          source_references?: string | null
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_scripts_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: true
            referencedRelation: "tutorial_videos"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_subscriber_to_audience: {
        Args: { p_audience_id: string; p_subscriber_id: string }
        Returns: boolean
      }
      can_attach_to_message: {
        Args: { p_message_id: string }
        Returns: boolean
      }
      complete_automation_job: {
        Args: {
          p_error_message?: string
          p_job_id: string
          p_result?: Json
          p_status: Database["public"]["Enums"]["job_status"]
        }
        Returns: undefined
      }
      create_automation_event: {
        Args: {
          p_event_data?: Json
          p_event_type: string
          p_session_id?: string
          p_source?: string
          p_subscriber_id: string
        }
        Returns: string
      }
      debug_is_admin: { Args: { user_id: string }; Returns: Json }
      enroll_subscriber_in_automation: {
        Args: {
          p_automation_id: string
          p_enrollment_data?: Json
          p_subscriber_id: string
        }
        Returns: string
      }
      evaluate_automation_conditions: {
        Args: { p_conditions: Json; p_subscriber_id: string }
        Returns: boolean
      }
      evaluate_purchase_conditions: {
        Args: { p_conditions: Json; p_subscriber_id: string }
        Returns: boolean
      }
      execute_automation_step: {
        Args: { p_enrollment_id: string; p_step_config: Json }
        Returns: Json
      }
      generate_ticket_number: { Args: never; Returns: string }
      get_active_ios_subscription: {
        Args: { p_user_id: string }
        Returns: {
          expires_date: string
          subscription_type: Database["public"]["Enums"]["subscription_type"]
          transaction_id: string
        }[]
      }
      get_active_promotion: {
        Args: { plan_type: string }
        Returns: {
          banner_theme: Json
          description: string
          discount_type: string
          discount_value: number
          id: string
          name: string
          sale_price: number
          stripe_coupon_code: string
          title: string
        }[]
      }
      get_lifetime_revenue: { Args: never; Returns: number }
      get_monthly_revenue: { Args: never; Returns: number }
      get_next_automation_job: {
        Args: never
        Returns: {
          automation_id: string
          enrollment_id: string
          job_id: string
          job_type: Database["public"]["Enums"]["automation_job_type"]
          payload: Json
        }[]
      }
      get_videos_needing_duration_cache: {
        Args: { limit_count?: number; max_age_hours?: number }
        Returns: {
          id: string
          youtube_duration_cached: number
          youtube_duration_last_updated: string
          youtube_video_id: string
        }[]
      }
      increment_campaign_bounced: {
        Args: { campaign_id: string }
        Returns: undefined
      }
      increment_campaign_delivered: {
        Args: { campaign_id: string }
        Returns: undefined
      }
      increment_campaign_spam: {
        Args: { campaign_id: string }
        Returns: undefined
      }
      increment_promotion_conversion: {
        Args: { conversion_value?: number; promotion_id: string }
        Returns: undefined
      }
      increment_promotion_view: {
        Args: { promotion_id: string }
        Returns: undefined
      }
      is_admin: { Args: { user_id: string }; Returns: boolean }
      remove_subscriber_from_audience: {
        Args: { p_audience_id: string; p_subscriber_id: string }
        Returns: boolean
      }
      schedule_automation_job: {
        Args: {
          p_job_type: Database["public"]["Enums"]["automation_job_type"]
          p_payload: Json
          p_priority?: Database["public"]["Enums"]["job_priority"]
          p_scheduled_for?: string
        }
        Returns: string
      }
      update_youtube_duration_cache: {
        Args: { duration_seconds: number; video_id: string }
        Returns: boolean
      }
    }
    Enums: {
      attachment_type: "image" | "video" | "document" | "audio" | "other"
      automation_job_type:
        | "trigger_check"
        | "enrollment_process"
        | "step_execution"
        | "delay_completion"
        | "condition_evaluation"
        | "email_send"
        | "webhook_call"
        | "cleanup"
        | "analytics_update"
      automation_status: "draft" | "active" | "paused" | "archived" | "testing"
      automation_step_type:
        | "email"
        | "delay"
        | "condition"
        | "action"
        | "webhook"
        | "tag_add"
        | "tag_remove"
        | "segment_add"
        | "segment_remove"
        | "custom_field_update"
        | "audience_add"
        | "audience_remove"
      automation_trigger:
        | "signup"
        | "purchase"
        | "abandonment"
        | "anniversary"
        | "behavior"
        | "custom"
        | "subscription_change"
      automation_trigger_type:
        | "signup"
        | "purchase"
        | "abandonment"
        | "anniversary"
        | "behavior"
        | "date_based"
        | "segment_entry"
        | "segment_exit"
        | "custom_event"
        | "email_open"
        | "email_click"
        | "website_visit"
        | "subscription_change"
        | "purchase_refunded"
        | "subscription_cancelled"
      bounce_type: "hard" | "soft" | "complaint"
      campaign_status:
        | "draft"
        | "scheduled"
        | "sending"
        | "sent"
        | "paused"
        | "failed"
      email_send_status: "pending" | "sent" | "delivered" | "bounced" | "failed"
      enrollment_status:
        | "active"
        | "completed"
        | "paused"
        | "cancelled"
        | "failed"
      job_priority: "low" | "medium" | "high" | "urgent"
      job_status:
        | "pending"
        | "processing"
        | "completed"
        | "failed"
        | "cancelled"
      message_type: "text" | "system"
      subscriber_status:
        | "active"
        | "unsubscribed"
        | "bounced"
        | "pending"
        | "complained"
        | "INACTIVE"
      subscription_type: "none" | "monthly" | "annual" | "lifetime"
      template_status: "draft" | "active" | "archived"
      template_type:
        | "welcome"
        | "newsletter"
        | "promotional"
        | "transactional"
        | "custom"
      ticket_status: "open" | "in_progress" | "resolved" | "closed"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  stripe_tables: {
    Tables: {
      stripe_charges: {
        Row: {
          amount: number | null
          attrs: Json | null
          created: string | null
          currency: string | null
          customer: string | null
          description: string | null
          id: string | null
          invoice: string | null
          payment_intent: string | null
          status: string | null
        }
        Insert: {
          amount?: number | null
          attrs?: Json | null
          created?: string | null
          currency?: string | null
          customer?: string | null
          description?: string | null
          id?: string | null
          invoice?: string | null
          payment_intent?: string | null
          status?: string | null
        }
        Update: {
          amount?: number | null
          attrs?: Json | null
          created?: string | null
          currency?: string | null
          customer?: string | null
          description?: string | null
          id?: string | null
          invoice?: string | null
          payment_intent?: string | null
          status?: string | null
        }
        Relationships: []
      }
      stripe_checkout_sessions: {
        Row: {
          attrs: Json | null
          customer: string | null
          id: string | null
          payment_intent: string | null
          subscription: string | null
        }
        Insert: {
          attrs?: Json | null
          customer?: string | null
          id?: string | null
          payment_intent?: string | null
          subscription?: string | null
        }
        Update: {
          attrs?: Json | null
          customer?: string | null
          id?: string | null
          payment_intent?: string | null
          subscription?: string | null
        }
        Relationships: []
      }
      stripe_customers: {
        Row: {
          attrs: Json | null
          created: string | null
          description: string | null
          email: string | null
          id: string | null
          name: string | null
        }
        Insert: {
          attrs?: Json | null
          created?: string | null
          description?: string | null
          email?: string | null
          id?: string | null
          name?: string | null
        }
        Update: {
          attrs?: Json | null
          created?: string | null
          description?: string | null
          email?: string | null
          id?: string | null
          name?: string | null
        }
        Relationships: []
      }
      stripe_disputes: {
        Row: {
          amount: number | null
          attrs: Json | null
          charge: string | null
          created: string | null
          currency: string | null
          id: string | null
          payment_intent: string | null
          reason: string | null
          status: string | null
        }
        Insert: {
          amount?: number | null
          attrs?: Json | null
          charge?: string | null
          created?: string | null
          currency?: string | null
          id?: string | null
          payment_intent?: string | null
          reason?: string | null
          status?: string | null
        }
        Update: {
          amount?: number | null
          attrs?: Json | null
          charge?: string | null
          created?: string | null
          currency?: string | null
          id?: string | null
          payment_intent?: string | null
          reason?: string | null
          status?: string | null
        }
        Relationships: []
      }
      stripe_events: {
        Row: {
          api_version: string | null
          attrs: Json | null
          created: string | null
          id: string | null
          type: string | null
        }
        Insert: {
          api_version?: string | null
          attrs?: Json | null
          created?: string | null
          id?: string | null
          type?: string | null
        }
        Update: {
          api_version?: string | null
          attrs?: Json | null
          created?: string | null
          id?: string | null
          type?: string | null
        }
        Relationships: []
      }
      stripe_invoices: {
        Row: {
          attrs: Json | null
          currency: string | null
          customer: string | null
          id: string | null
          period_end: string | null
          period_start: string | null
          status: string | null
          subscription: string | null
          total: number | null
        }
        Insert: {
          attrs?: Json | null
          currency?: string | null
          customer?: string | null
          id?: string | null
          period_end?: string | null
          period_start?: string | null
          status?: string | null
          subscription?: string | null
          total?: number | null
        }
        Update: {
          attrs?: Json | null
          currency?: string | null
          customer?: string | null
          id?: string | null
          period_end?: string | null
          period_start?: string | null
          status?: string | null
          subscription?: string | null
          total?: number | null
        }
        Relationships: []
      }
      stripe_payment_intents: {
        Row: {
          amount: number | null
          attrs: Json | null
          created: string | null
          currency: string | null
          customer: string | null
          id: string | null
          payment_method: string | null
        }
        Insert: {
          amount?: number | null
          attrs?: Json | null
          created?: string | null
          currency?: string | null
          customer?: string | null
          id?: string | null
          payment_method?: string | null
        }
        Update: {
          amount?: number | null
          attrs?: Json | null
          created?: string | null
          currency?: string | null
          customer?: string | null
          id?: string | null
          payment_method?: string | null
        }
        Relationships: []
      }
      stripe_prices: {
        Row: {
          active: boolean | null
          attrs: Json | null
          created: string | null
          currency: string | null
          id: string | null
          product: string | null
          type: string | null
          unit_amount: number | null
        }
        Insert: {
          active?: boolean | null
          attrs?: Json | null
          created?: string | null
          currency?: string | null
          id?: string | null
          product?: string | null
          type?: string | null
          unit_amount?: number | null
        }
        Update: {
          active?: boolean | null
          attrs?: Json | null
          created?: string | null
          currency?: string | null
          id?: string | null
          product?: string | null
          type?: string | null
          unit_amount?: number | null
        }
        Relationships: []
      }
      stripe_products: {
        Row: {
          active: boolean | null
          attrs: Json | null
          created: string | null
          default_price: string | null
          description: string | null
          id: string | null
          name: string | null
          updated: string | null
        }
        Insert: {
          active?: boolean | null
          attrs?: Json | null
          created?: string | null
          default_price?: string | null
          description?: string | null
          id?: string | null
          name?: string | null
          updated?: string | null
        }
        Update: {
          active?: boolean | null
          attrs?: Json | null
          created?: string | null
          default_price?: string | null
          description?: string | null
          id?: string | null
          name?: string | null
          updated?: string | null
        }
        Relationships: []
      }
      stripe_refunds: {
        Row: {
          amount: number | null
          attrs: Json | null
          charge: string | null
          created: string | null
          currency: string | null
          id: string | null
          payment_intent: string | null
          reason: string | null
          status: string | null
        }
        Insert: {
          amount?: number | null
          attrs?: Json | null
          charge?: string | null
          created?: string | null
          currency?: string | null
          id?: string | null
          payment_intent?: string | null
          reason?: string | null
          status?: string | null
        }
        Update: {
          amount?: number | null
          attrs?: Json | null
          charge?: string | null
          created?: string | null
          currency?: string | null
          id?: string | null
          payment_intent?: string | null
          reason?: string | null
          status?: string | null
        }
        Relationships: []
      }
      stripe_setup_attempts: {
        Row: {
          application: string | null
          attrs: Json | null
          created: string | null
          customer: string | null
          id: string | null
          on_behalf_of: string | null
          payment_method: string | null
          setup_intent: string | null
          status: string | null
          usage: string | null
        }
        Insert: {
          application?: string | null
          attrs?: Json | null
          created?: string | null
          customer?: string | null
          id?: string | null
          on_behalf_of?: string | null
          payment_method?: string | null
          setup_intent?: string | null
          status?: string | null
          usage?: string | null
        }
        Update: {
          application?: string | null
          attrs?: Json | null
          created?: string | null
          customer?: string | null
          id?: string | null
          on_behalf_of?: string | null
          payment_method?: string | null
          setup_intent?: string | null
          status?: string | null
          usage?: string | null
        }
        Relationships: []
      }
      stripe_setup_intents: {
        Row: {
          attrs: Json | null
          client_secret: string | null
          created: string | null
          customer: string | null
          description: string | null
          id: string | null
          payment_method: string | null
          status: string | null
          usage: string | null
        }
        Insert: {
          attrs?: Json | null
          client_secret?: string | null
          created?: string | null
          customer?: string | null
          description?: string | null
          id?: string | null
          payment_method?: string | null
          status?: string | null
          usage?: string | null
        }
        Update: {
          attrs?: Json | null
          client_secret?: string | null
          created?: string | null
          customer?: string | null
          description?: string | null
          id?: string | null
          payment_method?: string | null
          status?: string | null
          usage?: string | null
        }
        Relationships: []
      }
      stripe_subscriptions: {
        Row: {
          attrs: Json | null
          currency: string | null
          current_period_end: string | null
          current_period_start: string | null
          customer: string | null
          id: string | null
        }
        Insert: {
          attrs?: Json | null
          currency?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          customer?: string | null
          id?: string | null
        }
        Update: {
          attrs?: Json | null
          currency?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          customer?: string | null
          id?: string | null
        }
        Relationships: []
      }
      stripe_tokens: {
        Row: {
          attrs: Json | null
          currency: string | null
          current_period_end: string | null
          current_period_start: string | null
          customer: string | null
          id: string | null
        }
        Insert: {
          attrs?: Json | null
          currency?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          customer?: string | null
          id?: string | null
        }
        Update: {
          attrs?: Json | null
          currency?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          customer?: string | null
          id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      attachment_type: ["image", "video", "document", "audio", "other"],
      automation_job_type: [
        "trigger_check",
        "enrollment_process",
        "step_execution",
        "delay_completion",
        "condition_evaluation",
        "email_send",
        "webhook_call",
        "cleanup",
        "analytics_update",
      ],
      automation_status: ["draft", "active", "paused", "archived", "testing"],
      automation_step_type: [
        "email",
        "delay",
        "condition",
        "action",
        "webhook",
        "tag_add",
        "tag_remove",
        "segment_add",
        "segment_remove",
        "custom_field_update",
        "audience_add",
        "audience_remove",
      ],
      automation_trigger: [
        "signup",
        "purchase",
        "abandonment",
        "anniversary",
        "behavior",
        "custom",
        "subscription_change",
      ],
      automation_trigger_type: [
        "signup",
        "purchase",
        "abandonment",
        "anniversary",
        "behavior",
        "date_based",
        "segment_entry",
        "segment_exit",
        "custom_event",
        "email_open",
        "email_click",
        "website_visit",
        "subscription_change",
        "purchase_refunded",
        "subscription_cancelled",
      ],
      bounce_type: ["hard", "soft", "complaint"],
      campaign_status: [
        "draft",
        "scheduled",
        "sending",
        "sent",
        "paused",
        "failed",
      ],
      email_send_status: ["pending", "sent", "delivered", "bounced", "failed"],
      enrollment_status: [
        "active",
        "completed",
        "paused",
        "cancelled",
        "failed",
      ],
      job_priority: ["low", "medium", "high", "urgent"],
      job_status: ["pending", "processing", "completed", "failed", "cancelled"],
      message_type: ["text", "system"],
      subscriber_status: [
        "active",
        "unsubscribed",
        "bounced",
        "pending",
        "complained",
        "INACTIVE",
      ],
      subscription_type: ["none", "monthly", "annual", "lifetime"],
      template_status: ["draft", "active", "archived"],
      template_type: [
        "welcome",
        "newsletter",
        "promotional",
        "transactional",
        "custom",
      ],
      ticket_status: ["open", "in_progress", "resolved", "closed"],
    },
  },
  stripe_tables: {
    Enums: {},
  },
} as const
