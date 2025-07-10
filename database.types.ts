export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
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
          ip_address: unknown | null
          send_id: string | null
          subscriber_id: string | null
          url: string
          user_agent: string | null
        }
        Insert: {
          campaign_id?: string | null
          clicked_at?: string | null
          id?: string
          ip_address?: unknown | null
          send_id?: string | null
          subscriber_id?: string | null
          url: string
          user_agent?: string | null
        }
        Update: {
          campaign_id?: string | null
          clicked_at?: string | null
          id?: string
          ip_address?: unknown | null
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
          ip_address: unknown | null
          opened_at: string | null
          send_id: string | null
          subscriber_id: string | null
          user_agent: string | null
        }
        Insert: {
          campaign_id?: string | null
          id?: string
          ip_address?: unknown | null
          opened_at?: string | null
          send_id?: string | null
          subscriber_id?: string | null
          user_agent?: string | null
        }
        Update: {
          campaign_id?: string | null
          id?: string
          ip_address?: unknown | null
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
          bounce_reason: string | null
          bounced_at: string | null
          campaign_id: string | null
          created_at: string | null
          delivered_at: string | null
          email: string
          id: string
          sent_at: string | null
          status: Database["public"]["Enums"]["email_send_status"] | null
          subscriber_id: string | null
        }
        Insert: {
          bounce_reason?: string | null
          bounced_at?: string | null
          campaign_id?: string | null
          created_at?: string | null
          delivered_at?: string | null
          email: string
          id?: string
          sent_at?: string | null
          status?: Database["public"]["Enums"]["email_send_status"] | null
          subscriber_id?: string | null
        }
        Update: {
          bounce_reason?: string | null
          bounced_at?: string | null
          campaign_id?: string | null
          created_at?: string | null
          delivered_at?: string | null
          email?: string
          id?: string
          sent_at?: string | null
          status?: Database["public"]["Enums"]["email_send_status"] | null
          subscriber_id?: string | null
        }
        Relationships: [
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
          variables?: Json | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          customer_id: string | null
          first_name: string | null
          id: string
          last_name: string | null
          last_stripe_api_check: string | null
          subscription: Database["public"]["Enums"]["subscription_type"]
          subscription_expiration: string | null
          trial_expiration: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          customer_id?: string | null
          first_name?: string | null
          id: string
          last_name?: string | null
          last_stripe_api_check?: string | null
          subscription?: Database["public"]["Enums"]["subscription_type"]
          subscription_expiration?: string | null
          trial_expiration?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          customer_id?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          last_stripe_api_check?: string | null
          subscription?: Database["public"]["Enums"]["subscription_type"]
          subscription_expiration?: string | null
          trial_expiration?: string | null
          updated_at?: string | null
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
      user_sessions: {
        Row: {
          aal: string | null
          created_at: string | null
          factor_id: string | null
          id: string
          ip: unknown | null
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
          ip?: unknown | null
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
          ip?: unknown | null
          not_after?: string | null
          refreshed_at?: string | null
          tag?: string | null
          updated_at?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      complete_automation_job: {
        Args: {
          p_job_id: string
          p_status: Database["public"]["Enums"]["job_status"]
          p_result?: Json
          p_error_message?: string
        }
        Returns: undefined
      }
      create_automation_event: {
        Args: {
          p_event_type: string
          p_subscriber_id: string
          p_event_data?: Json
          p_source?: string
          p_session_id?: string
        }
        Returns: string
      }
      debug_is_admin: {
        Args: { user_id: string }
        Returns: Json
      }
      enroll_subscriber_in_automation: {
        Args: {
          p_automation_id: string
          p_subscriber_id: string
          p_enrollment_data?: Json
        }
        Returns: string
      }
      evaluate_automation_conditions: {
        Args: { p_conditions: Json; p_subscriber_id: string }
        Returns: boolean
      }
      get_next_automation_job: {
        Args: Record<PropertyKey, never>
        Returns: {
          job_id: string
          job_type: Database["public"]["Enums"]["automation_job_type"]
          payload: Json
          automation_id: string
          enrollment_id: string
        }[]
      }
      is_admin: {
        Args: { user_id: string }
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
    }
    Enums: {
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
      automation_trigger:
        | "signup"
        | "purchase"
        | "abandonment"
        | "anniversary"
        | "behavior"
        | "custom"
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
      subscriber_status: "active" | "unsubscribed" | "bounced" | "pending"
      subscription_type: "none" | "monthly" | "annual" | "lifetime"
      template_status: "draft" | "active" | "archived"
      template_type:
        | "welcome"
        | "newsletter"
        | "promotional"
        | "transactional"
        | "custom"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
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
      ],
      automation_trigger: [
        "signup",
        "purchase",
        "abandonment",
        "anniversary",
        "behavior",
        "custom",
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
      subscriber_status: ["active", "unsubscribed", "bounced", "pending"],
      subscription_type: ["none", "monthly", "annual", "lifetime"],
      template_status: ["draft", "active", "archived"],
      template_type: [
        "welcome",
        "newsletter",
        "promotional",
        "transactional",
        "custom",
      ],
    },
  },
} as const
