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
          created_at: string | null
          id: string
          is_ad_manager: boolean | null
          user: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_ad_manager?: boolean | null
          user: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_ad_manager?: boolean | null
          user?: string
        }
        Relationships: []
      }
      band_members: {
        Row: {
          band_id: string
          contact_id: string
          created_at: string | null
          enrollment_id: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          band_id: string
          contact_id: string
          created_at?: string | null
          enrollment_id?: string | null
          id?: string
          updated_at?: string | null
        }
        Update: {
          band_id?: string
          contact_id?: string
          created_at?: string | null
          enrollment_id?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "band_members_band_id_fkey"
            columns: ["band_id"]
            isOneToOne: false
            referencedRelation: "bands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "band_members_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "band_members_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "enrollments"
            referencedColumns: ["id"]
          },
        ]
      }
      bands: {
        Row: {
          avatar_key: string | null
          avatar_url: string | null
          created_at: string | null
          id: string
          leader_id: string | null
          name: string
          status: string
          updated_at: string | null
        }
        Insert: {
          avatar_key?: string | null
          avatar_url?: string | null
          created_at?: string | null
          id?: string
          leader_id?: string | null
          name: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          avatar_key?: string | null
          avatar_url?: string | null
          created_at?: string | null
          id?: string
          leader_id?: string | null
          name?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bands_leader_id_fkey"
            columns: ["leader_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts: {
        Row: {
          avatar_key: string | null
          avatar_url: string | null
          created_at: string | null
          date_of_birth: string | null
          email: string | null
          first_name: string
          id: string
          last_name: string
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_key?: string | null
          avatar_url?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          email?: string | null
          first_name: string
          id?: string
          last_name: string
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_key?: string | null
          avatar_url?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          email?: string | null
          first_name?: string
          id?: string
          last_name?: string
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      digital_signs: {
        Row: {
          background_image_key: string | null
          background_image_url: string | null
          background_mask_opacity: number | null
          created_at: string | null
          id: string
          left_location_id: string | null
          name: string
          right_location_id: string | null
          updated_at: string | null
        }
        Insert: {
          background_image_key?: string | null
          background_image_url?: string | null
          background_mask_opacity?: number | null
          created_at?: string | null
          id?: string
          left_location_id?: string | null
          name: string
          right_location_id?: string | null
          updated_at?: string | null
        }
        Update: {
          background_image_key?: string | null
          background_image_url?: string | null
          background_mask_opacity?: number | null
          created_at?: string | null
          id?: string
          left_location_id?: string | null
          name?: string
          right_location_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "digital_signs_left_location_id_fkey"
            columns: ["left_location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "digital_signs_right_location_id_fkey"
            columns: ["right_location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      disciplines: {
        Row: {
          created_at: string | null
          icon: string | null
          id: string
          name: string | null
          position: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          icon?: string | null
          id?: string
          name?: string | null
          position?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          icon?: string | null
          id?: string
          name?: string | null
          position?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      email_ab_test_results: {
        Row: {
          ab_test_id: string | null
          calculated_at: string | null
          id: string
          is_winner: boolean | null
          statistical_significance: number | null
          variant: string
        }
        Insert: {
          ab_test_id?: string | null
          calculated_at?: string | null
          id?: string
          is_winner?: boolean | null
          statistical_significance?: number | null
          variant: string
        }
        Update: {
          ab_test_id?: string | null
          calculated_at?: string | null
          id?: string
          is_winner?: boolean | null
          statistical_significance?: number | null
          variant?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_ab_test_results_ab_test_id_fkey"
            columns: ["ab_test_id"]
            isOneToOne: false
            referencedRelation: "ab_test_performance"
            referencedColumns: ["test_id"]
          },
          {
            foreignKeyName: "email_ab_test_results_ab_test_id_fkey"
            columns: ["ab_test_id"]
            isOneToOne: false
            referencedRelation: "email_ab_tests"
            referencedColumns: ["id"]
          },
        ]
      }
      email_ab_test_variants: {
        Row: {
          ab_test_id: string | null
          content_variant: Json | null
          created_at: string | null
          id: string
          sender_email: string | null
          sender_name: string | null
          subject_line: string | null
          traffic_percentage: number
          variant_name: string
        }
        Insert: {
          ab_test_id?: string | null
          content_variant?: Json | null
          created_at?: string | null
          id?: string
          sender_email?: string | null
          sender_name?: string | null
          subject_line?: string | null
          traffic_percentage: number
          variant_name: string
        }
        Update: {
          ab_test_id?: string | null
          content_variant?: Json | null
          created_at?: string | null
          id?: string
          sender_email?: string | null
          sender_name?: string | null
          subject_line?: string | null
          traffic_percentage?: number
          variant_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_ab_test_variants_ab_test_id_fkey"
            columns: ["ab_test_id"]
            isOneToOne: false
            referencedRelation: "ab_test_performance"
            referencedColumns: ["test_id"]
          },
          {
            foreignKeyName: "email_ab_test_variants_ab_test_id_fkey"
            columns: ["ab_test_id"]
            isOneToOne: false
            referencedRelation: "email_ab_tests"
            referencedColumns: ["id"]
          },
        ]
      }
      email_ab_tests: {
        Row: {
          campaign_id: string | null
          completed_at: string | null
          created_at: string | null
          created_by: string | null
          id: string
          started_at: string | null
          status: string | null
          test_name: string
          test_type: string
          traffic_split: Json | null
          variants: Json
          winner_criteria: string | null
          winner_variant: string | null
        }
        Insert: {
          campaign_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          started_at?: string | null
          status?: string | null
          test_name: string
          test_type: string
          traffic_split?: Json | null
          variants: Json
          winner_criteria?: string | null
          winner_variant?: string | null
        }
        Update: {
          campaign_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          started_at?: string | null
          status?: string | null
          test_name?: string
          test_type?: string
          traffic_split?: Json | null
          variants?: Json
          winner_criteria?: string | null
          winner_variant?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_ab_tests_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaign_performance"
            referencedColumns: ["campaign_id"]
          },
          {
            foreignKeyName: "email_ab_tests_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaign_performance_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_ab_tests_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "email_campaigns"
            referencedColumns: ["id"]
          },
        ]
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
            referencedRelation: "audience_insights"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_audience_subscribers_audience_id_fkey"
            columns: ["audience_id"]
            isOneToOne: false
            referencedRelation: "audience_subscriber_counts"
            referencedColumns: ["id"]
          },
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
            referencedRelation: "subscriber_engagement_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_audience_subscribers_subscriber_id_fkey"
            columns: ["subscriber_id"]
            isOneToOne: false
            referencedRelation: "subscriber_profiles"
            referencedColumns: ["subscriber_id"]
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
          id: string
          is_dynamic: boolean | null
          name: string
          query_conditions: Json
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_dynamic?: boolean | null
          name: string
          query_conditions: Json
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_dynamic?: boolean | null
          name?: string
          query_conditions?: Json
          updated_at?: string | null
        }
        Relationships: []
      }
      email_automation_enrollments: {
        Row: {
          automation_id: string | null
          completed_at: string | null
          current_step: number | null
          enrolled_at: string | null
          id: string
          next_send_at: string | null
          status: string | null
          subscriber_id: string | null
        }
        Insert: {
          automation_id?: string | null
          completed_at?: string | null
          current_step?: number | null
          enrolled_at?: string | null
          id?: string
          next_send_at?: string | null
          status?: string | null
          subscriber_id?: string | null
        }
        Update: {
          automation_id?: string | null
          completed_at?: string | null
          current_step?: number | null
          enrolled_at?: string | null
          id?: string
          next_send_at?: string | null
          status?: string | null
          subscriber_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_automation_enrollments_automation_id_fkey"
            columns: ["automation_id"]
            isOneToOne: false
            referencedRelation: "automation_enrollment_stats"
            referencedColumns: ["id"]
          },
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
            referencedRelation: "subscriber_engagement_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_automation_enrollments_subscriber_id_fkey"
            columns: ["subscriber_id"]
            isOneToOne: false
            referencedRelation: "subscriber_profiles"
            referencedColumns: ["subscriber_id"]
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
          created_at: string | null
          created_by: string | null
          description: string | null
          email_sequence: Json
          id: string
          name: string
          status: string | null
          trigger_conditions: Json | null
          trigger_type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          email_sequence: Json
          id?: string
          name: string
          status?: string | null
          trigger_conditions?: Json | null
          trigger_type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          email_sequence?: Json
          id?: string
          name?: string
          status?: string | null
          trigger_conditions?: Json | null
          trigger_type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      email_bounces: {
        Row: {
          bounce_reason: string | null
          bounce_subtype: string | null
          bounce_type: Database["public"]["Enums"]["bounce_type"]
          bounced_at: string | null
          campaign_id: string | null
          diagnostic_code: string | null
          id: string
          send_id: string | null
          subscriber_id: string | null
        }
        Insert: {
          bounce_reason?: string | null
          bounce_subtype?: string | null
          bounce_type: Database["public"]["Enums"]["bounce_type"]
          bounced_at?: string | null
          campaign_id?: string | null
          diagnostic_code?: string | null
          id?: string
          send_id?: string | null
          subscriber_id?: string | null
        }
        Update: {
          bounce_reason?: string | null
          bounce_subtype?: string | null
          bounce_type?: Database["public"]["Enums"]["bounce_type"]
          bounced_at?: string | null
          campaign_id?: string | null
          diagnostic_code?: string | null
          id?: string
          send_id?: string | null
          subscriber_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_bounces_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaign_performance"
            referencedColumns: ["campaign_id"]
          },
          {
            foreignKeyName: "email_bounces_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaign_performance_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_bounces_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "email_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_bounces_send_id_fkey"
            columns: ["send_id"]
            isOneToOne: false
            referencedRelation: "email_sends"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_bounces_subscriber_id_fkey"
            columns: ["subscriber_id"]
            isOneToOne: false
            referencedRelation: "subscriber_engagement_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_bounces_subscriber_id_fkey"
            columns: ["subscriber_id"]
            isOneToOne: false
            referencedRelation: "subscriber_profiles"
            referencedColumns: ["subscriber_id"]
          },
          {
            foreignKeyName: "email_bounces_subscriber_id_fkey"
            columns: ["subscriber_id"]
            isOneToOne: false
            referencedRelation: "subscribers"
            referencedColumns: ["id"]
          },
        ]
      }
      email_campaign_analytics: {
        Row: {
          browser: string | null
          campaign_id: string | null
          city: string | null
          country: string | null
          created_at: string | null
          device_type: string | null
          event_type: string
          id: string
          operating_system: string | null
          region: string | null
          revenue: number | null
          subscriber_id: string | null
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          browser?: string | null
          campaign_id?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          device_type?: string | null
          event_type: string
          id?: string
          operating_system?: string | null
          region?: string | null
          revenue?: number | null
          subscriber_id?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          browser?: string | null
          campaign_id?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          device_type?: string | null
          event_type?: string
          id?: string
          operating_system?: string | null
          region?: string | null
          revenue?: number | null
          subscriber_id?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_campaign_analytics_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaign_performance"
            referencedColumns: ["campaign_id"]
          },
          {
            foreignKeyName: "email_campaign_analytics_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaign_performance_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_campaign_analytics_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "email_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_campaign_analytics_subscriber_id_fkey"
            columns: ["subscriber_id"]
            isOneToOne: false
            referencedRelation: "subscriber_engagement_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_campaign_analytics_subscriber_id_fkey"
            columns: ["subscriber_id"]
            isOneToOne: false
            referencedRelation: "subscriber_profiles"
            referencedColumns: ["subscriber_id"]
          },
          {
            foreignKeyName: "email_campaign_analytics_subscriber_id_fkey"
            columns: ["subscriber_id"]
            isOneToOne: false
            referencedRelation: "subscribers"
            referencedColumns: ["id"]
          },
        ]
      }
      email_campaign_previews: {
        Row: {
          campaign_id: string | null
          device_type: string | null
          email_client: string | null
          expires_at: string | null
          generated_at: string | null
          generated_html: string | null
          id: string
          preview_type: string | null
          preview_url: string | null
        }
        Insert: {
          campaign_id?: string | null
          device_type?: string | null
          email_client?: string | null
          expires_at?: string | null
          generated_at?: string | null
          generated_html?: string | null
          id?: string
          preview_type?: string | null
          preview_url?: string | null
        }
        Update: {
          campaign_id?: string | null
          device_type?: string | null
          email_client?: string | null
          expires_at?: string | null
          generated_at?: string | null
          generated_html?: string | null
          id?: string
          preview_type?: string | null
          preview_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_campaign_previews_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaign_performance"
            referencedColumns: ["campaign_id"]
          },
          {
            foreignKeyName: "email_campaign_previews_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaign_performance_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_campaign_previews_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "email_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      email_campaign_schedule_queue: {
        Row: {
          campaign_id: string | null
          created_at: string | null
          error_message: string | null
          id: string
          processed_at: string | null
          retry_count: number | null
          scheduled_for: string
          status: string | null
        }
        Insert: {
          campaign_id?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          processed_at?: string | null
          retry_count?: number | null
          scheduled_for: string
          status?: string | null
        }
        Update: {
          campaign_id?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          processed_at?: string | null
          retry_count?: number | null
          scheduled_for?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_campaign_schedule_queue_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaign_performance"
            referencedColumns: ["campaign_id"]
          },
          {
            foreignKeyName: "email_campaign_schedule_queue_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaign_performance_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_campaign_schedule_queue_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "email_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      email_campaigns: {
        Row: {
          audience_id: string | null
          created_at: string | null
          created_by: string | null
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
          subject: string
          template_id: string | null
          text_content: string | null
          updated_at: string | null
        }
        Insert: {
          audience_id?: string | null
          created_at?: string | null
          created_by?: string | null
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
          subject: string
          template_id?: string | null
          text_content?: string | null
          updated_at?: string | null
        }
        Update: {
          audience_id?: string | null
          created_at?: string | null
          created_by?: string | null
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
          subject?: string
          template_id?: string | null
          text_content?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_campaigns_audience_id_fkey"
            columns: ["audience_id"]
            isOneToOne: false
            referencedRelation: "audience_insights"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_campaigns_audience_id_fkey"
            columns: ["audience_id"]
            isOneToOne: false
            referencedRelation: "audience_subscriber_counts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_campaigns_audience_id_fkey"
            columns: ["audience_id"]
            isOneToOne: false
            referencedRelation: "email_audiences"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_campaigns_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "email_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_campaigns_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "template_usage_stats"
            referencedColumns: ["id"]
          },
        ]
      }
      email_clicks: {
        Row: {
          campaign_id: string | null
          clicked_at: string
          id: string
          ip_address: unknown | null
          send_id: string | null
          subscriber_id: string | null
          url: string
          user_agent: string | null
        }
        Insert: {
          campaign_id?: string | null
          clicked_at?: string
          id?: string
          ip_address?: unknown | null
          send_id?: string | null
          subscriber_id?: string | null
          url: string
          user_agent?: string | null
        }
        Update: {
          campaign_id?: string | null
          clicked_at?: string
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
            referencedRelation: "campaign_performance"
            referencedColumns: ["campaign_id"]
          },
          {
            foreignKeyName: "email_clicks_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaign_performance_summary"
            referencedColumns: ["id"]
          },
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
            referencedRelation: "subscriber_engagement_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_clicks_subscriber_id_fkey"
            columns: ["subscriber_id"]
            isOneToOne: false
            referencedRelation: "subscriber_profiles"
            referencedColumns: ["subscriber_id"]
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
      email_clicks_2024_12: {
        Row: {
          campaign_id: string | null
          clicked_at: string
          id: string
          ip_address: unknown | null
          send_id: string | null
          subscriber_id: string | null
          url: string
          user_agent: string | null
        }
        Insert: {
          campaign_id?: string | null
          clicked_at?: string
          id?: string
          ip_address?: unknown | null
          send_id?: string | null
          subscriber_id?: string | null
          url: string
          user_agent?: string | null
        }
        Update: {
          campaign_id?: string | null
          clicked_at?: string
          id?: string
          ip_address?: unknown | null
          send_id?: string | null
          subscriber_id?: string | null
          url?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      email_clicks_2025_01: {
        Row: {
          campaign_id: string | null
          clicked_at: string
          id: string
          ip_address: unknown | null
          send_id: string | null
          subscriber_id: string | null
          url: string
          user_agent: string | null
        }
        Insert: {
          campaign_id?: string | null
          clicked_at?: string
          id?: string
          ip_address?: unknown | null
          send_id?: string | null
          subscriber_id?: string | null
          url: string
          user_agent?: string | null
        }
        Update: {
          campaign_id?: string | null
          clicked_at?: string
          id?: string
          ip_address?: unknown | null
          send_id?: string | null
          subscriber_id?: string | null
          url?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      email_clicks_2025_02: {
        Row: {
          campaign_id: string | null
          clicked_at: string
          id: string
          ip_address: unknown | null
          send_id: string | null
          subscriber_id: string | null
          url: string
          user_agent: string | null
        }
        Insert: {
          campaign_id?: string | null
          clicked_at?: string
          id?: string
          ip_address?: unknown | null
          send_id?: string | null
          subscriber_id?: string | null
          url: string
          user_agent?: string | null
        }
        Update: {
          campaign_id?: string | null
          clicked_at?: string
          id?: string
          ip_address?: unknown | null
          send_id?: string | null
          subscriber_id?: string | null
          url?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      email_clicks_default: {
        Row: {
          campaign_id: string | null
          clicked_at: string
          id: string
          ip_address: unknown | null
          send_id: string | null
          subscriber_id: string | null
          url: string
          user_agent: string | null
        }
        Insert: {
          campaign_id?: string | null
          clicked_at?: string
          id?: string
          ip_address?: unknown | null
          send_id?: string | null
          subscriber_id?: string | null
          url: string
          user_agent?: string | null
        }
        Update: {
          campaign_id?: string | null
          clicked_at?: string
          id?: string
          ip_address?: unknown | null
          send_id?: string | null
          subscriber_id?: string | null
          url?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      email_deliverability_settings: {
        Row: {
          bounce_handling_enabled: boolean | null
          click_tracking_enabled: boolean | null
          complaint_handling_enabled: boolean | null
          created_at: string | null
          custom_tracking_domain: string | null
          dkim_private_key: string | null
          dkim_selector: string | null
          domain: string
          id: string
          open_tracking_enabled: boolean | null
          unsubscribe_tracking_enabled: boolean | null
          updated_at: string | null
        }
        Insert: {
          bounce_handling_enabled?: boolean | null
          click_tracking_enabled?: boolean | null
          complaint_handling_enabled?: boolean | null
          created_at?: string | null
          custom_tracking_domain?: string | null
          dkim_private_key?: string | null
          dkim_selector?: string | null
          domain: string
          id?: string
          open_tracking_enabled?: boolean | null
          unsubscribe_tracking_enabled?: boolean | null
          updated_at?: string | null
        }
        Update: {
          bounce_handling_enabled?: boolean | null
          click_tracking_enabled?: boolean | null
          complaint_handling_enabled?: boolean | null
          created_at?: string | null
          custom_tracking_domain?: string | null
          dkim_private_key?: string | null
          dkim_selector?: string | null
          domain?: string
          id?: string
          open_tracking_enabled?: boolean | null
          unsubscribe_tracking_enabled?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      email_domain_reputation: {
        Row: {
          blacklist_sources: string[] | null
          created_at: string | null
          dkim_status: string | null
          dmarc_status: string | null
          domain: string
          id: string
          is_blacklisted: boolean | null
          last_checked_at: string | null
          reputation_score: number | null
          spf_status: string | null
          updated_at: string | null
        }
        Insert: {
          blacklist_sources?: string[] | null
          created_at?: string | null
          dkim_status?: string | null
          dmarc_status?: string | null
          domain: string
          id?: string
          is_blacklisted?: boolean | null
          last_checked_at?: string | null
          reputation_score?: number | null
          spf_status?: string | null
          updated_at?: string | null
        }
        Update: {
          blacklist_sources?: string[] | null
          created_at?: string | null
          dkim_status?: string | null
          dmarc_status?: string | null
          domain?: string
          id?: string
          is_blacklisted?: boolean | null
          last_checked_at?: string | null
          reputation_score?: number | null
          spf_status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      email_element_types: {
        Row: {
          created_at: string | null
          default_properties: Json | null
          description: string | null
          display_name: string
          id: string
          is_active: boolean | null
          sort_order: number | null
          type_name: string
        }
        Insert: {
          created_at?: string | null
          default_properties?: Json | null
          description?: string | null
          display_name: string
          id?: string
          is_active?: boolean | null
          sort_order?: number | null
          type_name: string
        }
        Update: {
          created_at?: string | null
          default_properties?: Json | null
          description?: string | null
          display_name?: string
          id?: string
          is_active?: boolean | null
          sort_order?: number | null
          type_name?: string
        }
        Relationships: []
      }
      email_list_growth: {
        Row: {
          bounces: number | null
          created_at: string | null
          date: string
          growth_rate: number | null
          id: string
          net_growth: number | null
          new_subscribers: number | null
          total_subscribers: number | null
          unsubscribes: number | null
        }
        Insert: {
          bounces?: number | null
          created_at?: string | null
          date: string
          growth_rate?: number | null
          id?: string
          net_growth?: number | null
          new_subscribers?: number | null
          total_subscribers?: number | null
          unsubscribes?: number | null
        }
        Update: {
          bounces?: number | null
          created_at?: string | null
          date?: string
          growth_rate?: number | null
          id?: string
          net_growth?: number | null
          new_subscribers?: number | null
          total_subscribers?: number | null
          unsubscribes?: number | null
        }
        Relationships: []
      }
      email_opens: {
        Row: {
          campaign_id: string | null
          id: string
          ip_address: unknown | null
          opened_at: string
          send_id: string | null
          subscriber_id: string | null
          user_agent: string | null
        }
        Insert: {
          campaign_id?: string | null
          id?: string
          ip_address?: unknown | null
          opened_at?: string
          send_id?: string | null
          subscriber_id?: string | null
          user_agent?: string | null
        }
        Update: {
          campaign_id?: string | null
          id?: string
          ip_address?: unknown | null
          opened_at?: string
          send_id?: string | null
          subscriber_id?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_opens_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaign_performance"
            referencedColumns: ["campaign_id"]
          },
          {
            foreignKeyName: "email_opens_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaign_performance_summary"
            referencedColumns: ["id"]
          },
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
            referencedRelation: "subscriber_engagement_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_opens_subscriber_id_fkey"
            columns: ["subscriber_id"]
            isOneToOne: false
            referencedRelation: "subscriber_profiles"
            referencedColumns: ["subscriber_id"]
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
      email_opens_2024_12: {
        Row: {
          campaign_id: string | null
          id: string
          ip_address: unknown | null
          opened_at: string
          send_id: string | null
          subscriber_id: string | null
          user_agent: string | null
        }
        Insert: {
          campaign_id?: string | null
          id?: string
          ip_address?: unknown | null
          opened_at?: string
          send_id?: string | null
          subscriber_id?: string | null
          user_agent?: string | null
        }
        Update: {
          campaign_id?: string | null
          id?: string
          ip_address?: unknown | null
          opened_at?: string
          send_id?: string | null
          subscriber_id?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      email_opens_2025_01: {
        Row: {
          campaign_id: string | null
          id: string
          ip_address: unknown | null
          opened_at: string
          send_id: string | null
          subscriber_id: string | null
          user_agent: string | null
        }
        Insert: {
          campaign_id?: string | null
          id?: string
          ip_address?: unknown | null
          opened_at?: string
          send_id?: string | null
          subscriber_id?: string | null
          user_agent?: string | null
        }
        Update: {
          campaign_id?: string | null
          id?: string
          ip_address?: unknown | null
          opened_at?: string
          send_id?: string | null
          subscriber_id?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      email_opens_2025_02: {
        Row: {
          campaign_id: string | null
          id: string
          ip_address: unknown | null
          opened_at: string
          send_id: string | null
          subscriber_id: string | null
          user_agent: string | null
        }
        Insert: {
          campaign_id?: string | null
          id?: string
          ip_address?: unknown | null
          opened_at?: string
          send_id?: string | null
          subscriber_id?: string | null
          user_agent?: string | null
        }
        Update: {
          campaign_id?: string | null
          id?: string
          ip_address?: unknown | null
          opened_at?: string
          send_id?: string | null
          subscriber_id?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      email_opens_default: {
        Row: {
          campaign_id: string | null
          id: string
          ip_address: unknown | null
          opened_at: string
          send_id: string | null
          subscriber_id: string | null
          user_agent: string | null
        }
        Insert: {
          campaign_id?: string | null
          id?: string
          ip_address?: unknown | null
          opened_at?: string
          send_id?: string | null
          subscriber_id?: string | null
          user_agent?: string | null
        }
        Update: {
          campaign_id?: string | null
          id?: string
          ip_address?: unknown | null
          opened_at?: string
          send_id?: string | null
          subscriber_id?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      email_send_rate_limits: {
        Row: {
          created_at: string | null
          current_day_count: number | null
          current_hour_count: number | null
          emails_per_day: number
          emails_per_hour: number
          id: string
          is_active: boolean | null
          last_reset_day: string | null
          last_reset_hour: string | null
          provider: string
        }
        Insert: {
          created_at?: string | null
          current_day_count?: number | null
          current_hour_count?: number | null
          emails_per_day?: number
          emails_per_hour?: number
          id?: string
          is_active?: boolean | null
          last_reset_day?: string | null
          last_reset_hour?: string | null
          provider: string
        }
        Update: {
          created_at?: string | null
          current_day_count?: number | null
          current_hour_count?: number | null
          emails_per_day?: number
          emails_per_hour?: number
          id?: string
          is_active?: boolean | null
          last_reset_day?: string | null
          last_reset_hour?: string | null
          provider?: string
        }
        Relationships: []
      }
      email_sends: {
        Row: {
          campaign_id: string | null
          delivered_at: string | null
          email_address: string
          error_message: string | null
          id: string
          message_id: string | null
          sent_at: string | null
          status: Database["public"]["Enums"]["email_send_status"] | null
          subscriber_id: string | null
        }
        Insert: {
          campaign_id?: string | null
          delivered_at?: string | null
          email_address: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["email_send_status"] | null
          subscriber_id?: string | null
        }
        Update: {
          campaign_id?: string | null
          delivered_at?: string | null
          email_address?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["email_send_status"] | null
          subscriber_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_sends_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaign_performance"
            referencedColumns: ["campaign_id"]
          },
          {
            foreignKeyName: "email_sends_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaign_performance_summary"
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
            referencedRelation: "subscriber_engagement_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_sends_subscriber_id_fkey"
            columns: ["subscriber_id"]
            isOneToOne: false
            referencedRelation: "subscriber_profiles"
            referencedColumns: ["subscriber_id"]
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
      email_system_notifications: {
        Row: {
          created_at: string | null
          created_for: string | null
          id: string
          is_read: boolean | null
          message: string
          metadata: Json | null
          notification_type: string
          read_at: string | null
          severity: Database["public"]["Enums"]["notification_severity"] | null
          title: string
        }
        Insert: {
          created_at?: string | null
          created_for?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          metadata?: Json | null
          notification_type: string
          read_at?: string | null
          severity?: Database["public"]["Enums"]["notification_severity"] | null
          title: string
        }
        Update: {
          created_at?: string | null
          created_for?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          metadata?: Json | null
          notification_type?: string
          read_at?: string | null
          severity?: Database["public"]["Enums"]["notification_severity"] | null
          title?: string
        }
        Relationships: []
      }
      email_template_clones: {
        Row: {
          clone_type: string | null
          cloned_by: string | null
          cloned_template_id: string | null
          created_at: string | null
          id: string
          original_template_id: string | null
        }
        Insert: {
          clone_type?: string | null
          cloned_by?: string | null
          cloned_template_id?: string | null
          created_at?: string | null
          id?: string
          original_template_id?: string | null
        }
        Update: {
          clone_type?: string | null
          cloned_by?: string | null
          cloned_template_id?: string | null
          created_at?: string | null
          id?: string
          original_template_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_template_clones_cloned_template_id_fkey"
            columns: ["cloned_template_id"]
            isOneToOne: false
            referencedRelation: "email_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_template_clones_cloned_template_id_fkey"
            columns: ["cloned_template_id"]
            isOneToOne: false
            referencedRelation: "template_usage_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_template_clones_original_template_id_fkey"
            columns: ["original_template_id"]
            isOneToOne: false
            referencedRelation: "email_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_template_clones_original_template_id_fkey"
            columns: ["original_template_id"]
            isOneToOne: false
            referencedRelation: "template_usage_stats"
            referencedColumns: ["id"]
          },
        ]
      }
      email_template_favorites: {
        Row: {
          created_at: string | null
          id: string
          template_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          template_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          template_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_template_favorites_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "email_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_template_favorites_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "template_usage_stats"
            referencedColumns: ["id"]
          },
        ]
      }
      email_template_ratings: {
        Row: {
          created_at: string | null
          id: string
          rating: number | null
          review: string | null
          template_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          rating?: number | null
          review?: string | null
          template_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          rating?: number | null
          review?: string | null
          template_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_template_ratings_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "email_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_template_ratings_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "template_usage_stats"
            referencedColumns: ["id"]
          },
        ]
      }
      email_template_versions: {
        Row: {
          created_at: string | null
          created_by: string | null
          html_content: string | null
          id: string
          name: string
          template_id: string | null
          text_content: string | null
          variables: Json | null
          version_number: number
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          html_content?: string | null
          id?: string
          name: string
          template_id?: string | null
          text_content?: string | null
          variables?: Json | null
          version_number: number
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          html_content?: string | null
          id?: string
          name?: string
          template_id?: string | null
          text_content?: string | null
          variables?: Json | null
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "email_template_versions_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "email_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_template_versions_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "template_usage_stats"
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
      email_test_sends: {
        Row: {
          campaign_id: string | null
          error_message: string | null
          id: string
          sent_at: string | null
          sent_by: string | null
          status: Database["public"]["Enums"]["email_send_status"] | null
          template_id: string | null
          test_email: string
        }
        Insert: {
          campaign_id?: string | null
          error_message?: string | null
          id?: string
          sent_at?: string | null
          sent_by?: string | null
          status?: Database["public"]["Enums"]["email_send_status"] | null
          template_id?: string | null
          test_email: string
        }
        Update: {
          campaign_id?: string | null
          error_message?: string | null
          id?: string
          sent_at?: string | null
          sent_by?: string | null
          status?: Database["public"]["Enums"]["email_send_status"] | null
          template_id?: string | null
          test_email?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_test_sends_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaign_performance"
            referencedColumns: ["campaign_id"]
          },
          {
            foreignKeyName: "email_test_sends_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaign_performance_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_test_sends_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "email_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_test_sends_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "email_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_test_sends_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "template_usage_stats"
            referencedColumns: ["id"]
          },
        ]
      }
      email_unsubscribes: {
        Row: {
          campaign_id: string | null
          id: string
          reason: string | null
          send_id: string | null
          subscriber_id: string | null
          unsubscribed_at: string | null
        }
        Insert: {
          campaign_id?: string | null
          id?: string
          reason?: string | null
          send_id?: string | null
          subscriber_id?: string | null
          unsubscribed_at?: string | null
        }
        Update: {
          campaign_id?: string | null
          id?: string
          reason?: string | null
          send_id?: string | null
          subscriber_id?: string | null
          unsubscribed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_unsubscribes_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaign_performance"
            referencedColumns: ["campaign_id"]
          },
          {
            foreignKeyName: "email_unsubscribes_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaign_performance_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_unsubscribes_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "email_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_unsubscribes_send_id_fkey"
            columns: ["send_id"]
            isOneToOne: false
            referencedRelation: "email_sends"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_unsubscribes_subscriber_id_fkey"
            columns: ["subscriber_id"]
            isOneToOne: false
            referencedRelation: "subscriber_engagement_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_unsubscribes_subscriber_id_fkey"
            columns: ["subscriber_id"]
            isOneToOne: false
            referencedRelation: "subscriber_profiles"
            referencedColumns: ["subscriber_id"]
          },
          {
            foreignKeyName: "email_unsubscribes_subscriber_id_fkey"
            columns: ["subscriber_id"]
            isOneToOne: false
            referencedRelation: "subscribers"
            referencedColumns: ["id"]
          },
        ]
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
            referencedRelation: "campaign_performance"
            referencedColumns: ["campaign_id"]
          },
          {
            foreignKeyName: "email_webhook_logs_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaign_performance_summary"
            referencedColumns: ["id"]
          },
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
            referencedRelation: "subscriber_engagement_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_webhook_logs_subscriber_id_fkey"
            columns: ["subscriber_id"]
            isOneToOne: false
            referencedRelation: "subscriber_profiles"
            referencedColumns: ["subscriber_id"]
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
      employee_disciplines: {
        Row: {
          created_at: string | null
          discipline_id: string
          employee_id: string
        }
        Insert: {
          created_at?: string | null
          discipline_id: string
          employee_id: string
        }
        Update: {
          created_at?: string | null
          discipline_id?: string
          employee_id?: string
        }
        Relationships: []
      }
      employees: {
        Row: {
          avatar_key: string | null
          avatar_url: string | null
          created_at: string | null
          email: string | null
          employment_type: string
          first_name: string
          hire_date: string | null
          id: string
          last_name: string
          role_id: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_key?: string | null
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          employment_type: string
          first_name: string
          hire_date?: string | null
          id?: string
          last_name: string
          role_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_key?: string | null
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          employment_type?: string
          first_name?: string
          hire_date?: string | null
          id?: string
          last_name?: string
          role_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employees_new_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      enrollments: {
        Row: {
          contact_id: string | null
          created_at: string | null
          discipline_id: string | null
          id: string
          instructor_id: string | null
          service_id: string | null
          service_variation_id: string | null
          start_date: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          contact_id?: string | null
          created_at?: string | null
          discipline_id?: string | null
          id?: string
          instructor_id?: string | null
          service_id?: string | null
          service_variation_id?: string | null
          start_date: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          contact_id?: string | null
          created_at?: string | null
          discipline_id?: string | null
          id?: string
          instructor_id?: string | null
          service_id?: string | null
          service_variation_id?: string | null
          start_date?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "enrollments_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_new_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_new_discipline_id_fkey"
            columns: ["discipline_id"]
            isOneToOne: false
            referencedRelation: "disciplines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_new_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      event_instructors: {
        Row: {
          created_at: string | null
          event_id: string
          instructor_id: string
          is_substitute: boolean | null
          role: string | null
        }
        Insert: {
          created_at?: string | null
          event_id: string
          instructor_id: string
          is_substitute?: boolean | null
          role?: string | null
        }
        Update: {
          created_at?: string | null
          event_id?: string
          instructor_id?: string
          is_substitute?: boolean | null
          role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_instructors_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_instructors_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          band_id: string | null
          created_at: string | null
          description: string | null
          discipline_id: string | null
          duration: number
          enrollment_id: string | null
          event_type: string | null
          excluded_dates: string[] | null
          format: string | null
          id: string
          is_occurrence: boolean | null
          is_reschedule: boolean | null
          location_id: string | null
          occurrence_date: string | null
          occurrence_statuses: Json | null
          original_event_id: string | null
          parent_event_id: string | null
          recurrence_days: number[] | null
          recurrence_end_date: string | null
          recurrence_start_date: string | null
          recurrence_type: string | null
          rescheduled_from_id: string | null
          start_time: string
          status: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          band_id?: string | null
          created_at?: string | null
          description?: string | null
          discipline_id?: string | null
          duration: number
          enrollment_id?: string | null
          event_type?: string | null
          excluded_dates?: string[] | null
          format?: string | null
          id?: string
          is_occurrence?: boolean | null
          is_reschedule?: boolean | null
          location_id?: string | null
          occurrence_date?: string | null
          occurrence_statuses?: Json | null
          original_event_id?: string | null
          parent_event_id?: string | null
          recurrence_days?: number[] | null
          recurrence_end_date?: string | null
          recurrence_start_date?: string | null
          recurrence_type?: string | null
          rescheduled_from_id?: string | null
          start_time: string
          status?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          band_id?: string | null
          created_at?: string | null
          description?: string | null
          discipline_id?: string | null
          duration?: number
          enrollment_id?: string | null
          event_type?: string | null
          excluded_dates?: string[] | null
          format?: string | null
          id?: string
          is_occurrence?: boolean | null
          is_reschedule?: boolean | null
          location_id?: string | null
          occurrence_date?: string | null
          occurrence_statuses?: Json | null
          original_event_id?: string | null
          parent_event_id?: string | null
          recurrence_days?: number[] | null
          recurrence_end_date?: string | null
          recurrence_start_date?: string | null
          recurrence_type?: string | null
          rescheduled_from_id?: string | null
          start_time?: string
          status?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_band_id_fkey"
            columns: ["band_id"]
            isOneToOne: false
            referencedRelation: "bands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_new_discipline_id_fkey"
            columns: ["discipline_id"]
            isOneToOne: false
            referencedRelation: "disciplines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_original_event_id_fkey"
            columns: ["original_event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_parent_event_id_fkey"
            columns: ["parent_event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_rescheduled_from_id_fkey"
            columns: ["rescheduled_from_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      families: {
        Row: {
          contact_ids: string[]
          created_at: string | null
          family_name: string
          id: string
          primary_contact_id: string | null
          updated_at: string | null
        }
        Insert: {
          contact_ids?: string[]
          created_at?: string | null
          family_name: string
          id?: string
          primary_contact_id?: string | null
          updated_at?: string | null
        }
        Update: {
          contact_ids?: string[]
          created_at?: string | null
          family_name?: string
          id?: string
          primary_contact_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      invoices: {
        Row: {
          amount: number
          contact_id: string | null
          created_at: string | null
          description: string | null
          due_date: string | null
          id: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          contact_id?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          contact_id?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_new_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      location_disciplines: {
        Row: {
          created_at: string | null
          discipline_id: string
          location_id: string
        }
        Insert: {
          created_at?: string | null
          discipline_id: string
          location_id: string
        }
        Update: {
          created_at?: string | null
          discipline_id?: string
          location_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "location_disciplines_uuid_discipline_id_fkey"
            columns: ["discipline_id"]
            isOneToOne: false
            referencedRelation: "disciplines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "location_disciplines_uuid_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      location_types: {
        Row: {
          created_at: string | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      locations: {
        Row: {
          capacity: number | null
          created_at: string | null
          description: string | null
          id: string
          name: string
          position: number | null
          type_id: string | null
          updated_at: string | null
        }
        Insert: {
          capacity?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          position?: number | null
          type_id?: string | null
          updated_at?: string | null
        }
        Update: {
          capacity?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          position?: number | null
          type_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "locations_new_type_id_fkey"
            columns: ["type_id"]
            isOneToOne: false
            referencedRelation: "location_types"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          customer_id: string | null
          email: string | null
          first_name: string | null
          full_name: string | null
          id: string
          last_name: string | null
          subscription: Database["public"]["Enums"]["subscription_type"] | null
          subscription_expiration: string | null
          trial_expiration: string | null
          updated_at: string | null
          username: string | null
          website: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          customer_id?: string | null
          email?: string | null
          first_name?: string | null
          full_name?: string | null
          id: string
          last_name?: string | null
          subscription?: Database["public"]["Enums"]["subscription_type"] | null
          subscription_expiration?: string | null
          trial_expiration?: string | null
          updated_at?: string | null
          username?: string | null
          website?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          customer_id?: string | null
          email?: string | null
          first_name?: string | null
          full_name?: string | null
          id?: string
          last_name?: string | null
          subscription?: Database["public"]["Enums"]["subscription_type"] | null
          subscription_expiration?: string | null
          trial_expiration?: string | null
          updated_at?: string | null
          username?: string | null
          website?: string | null
        }
        Relationships: []
      }
      roles: {
        Row: {
          created_at: string | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      service_variations: {
        Row: {
          created_at: string | null
          id: string
          name: string
          price: number
          price_type: string | null
          service_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          price: number
          price_type?: string | null
          service_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          price?: number
          price_type?: string | null
          service_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_variations_new_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          created_at: string | null
          description: string | null
          duration: number | null
          id: string
          image_key: string | null
          image_url: string | null
          name: string
          service_type: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          duration?: number | null
          id?: string
          image_key?: string | null
          image_url?: string | null
          name: string
          service_type?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          duration?: number | null
          id?: string
          image_key?: string | null
          image_url?: string | null
          name?: string
          service_type?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      sessions: {
        Row: {
          created_at: string | null
          device_info: string | null
          device_token: string | null
          id: string
          is_active: boolean | null
          last_activity: string | null
          terminated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          device_info?: string | null
          device_token?: string | null
          id: string
          is_active?: boolean | null
          last_activity?: string | null
          terminated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          device_info?: string | null
          device_token?: string | null
          id?: string
          is_active?: boolean | null
          last_activity?: string | null
          terminated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sessions_new_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      settings: {
        Row: {
          created_at: string | null
          id: string
          key: string
          updated_at: string | null
          value: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          key: string
          updated_at?: string | null
          value?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          key?: string
          updated_at?: string | null
          value?: string | null
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
      transactional_email_templates: {
        Row: {
          created_at: string | null
          fallback_template_id: string | null
          id: string
          is_active: boolean | null
          template_id: string | null
          template_key: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          fallback_template_id?: string | null
          id?: string
          is_active?: boolean | null
          template_id?: string | null
          template_key: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          fallback_template_id?: string | null
          id?: string
          is_active?: boolean | null
          template_id?: string | null
          template_key?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transactional_email_templates_fallback_template_id_fkey"
            columns: ["fallback_template_id"]
            isOneToOne: false
            referencedRelation: "email_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactional_email_templates_fallback_template_id_fkey"
            columns: ["fallback_template_id"]
            isOneToOne: false
            referencedRelation: "template_usage_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactional_email_templates_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "email_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactional_email_templates_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "template_usage_stats"
            referencedColumns: ["id"]
          },
        ]
      }
      user_permissions: {
        Row: {
          created_at: string | null
          id: string
          permission: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          permission: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          permission?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_permissions_new_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string | null
          email: string
          first_name: string
          id: string
          last_name: string
          password: string
          role: string | null
          role_enum: Database["public"]["Enums"]["user_role"] | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          first_name: string
          id?: string
          last_name: string
          password: string
          role?: string | null
          role_enum?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          first_name?: string
          id?: string
          last_name?: string
          password?: string
          role?: string | null
          role_enum?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      ab_test_performance: {
        Row: {
          click_rate: number | null
          conversion_rate: number | null
          is_winner: boolean | null
          open_rate: number | null
          statistical_significance: number | null
          status: string | null
          test_id: string | null
          test_name: string | null
          test_type: string | null
          total_clicks: number | null
          total_conversions: number | null
          total_opens: number | null
          total_sent: number | null
          variant: string | null
        }
        Relationships: []
      }
      audience_insights: {
        Row: {
          active_rate: number | null
          active_subscribers: number | null
          annual_subscribers: number | null
          created_at: string | null
          description: string | null
          free_users: number | null
          high_engagement: number | null
          id: string | null
          is_dynamic: boolean | null
          lifetime_members: number | null
          low_engagement: number | null
          medium_engagement: number | null
          monthly_subscribers: number | null
          name: string | null
          paid_subscriber_rate: number | null
          total_subscribers: number | null
          trial_users: number | null
        }
        Relationships: []
      }
      audience_subscriber_counts: {
        Row: {
          created_at: string | null
          description: string | null
          id: string | null
          is_dynamic: boolean | null
          last_calculated_at: string | null
          name: string | null
          subscriber_count: number | null
        }
        Relationships: []
      }
      automation_enrollment_stats: {
        Row: {
          active_enrolled: number | null
          completion_rate: number | null
          created_at: string | null
          id: string | null
          name: string | null
          status: string | null
          total_completed: number | null
          total_enrolled: number | null
          trigger_type: string | null
        }
        Relationships: []
      }
      campaign_performance: {
        Row: {
          bounce_rate: number | null
          campaign_id: string | null
          click_rate: number | null
          name: string | null
          open_rate: number | null
          revenue_generated: number | null
          sent_at: string | null
          status: Database["public"]["Enums"]["campaign_status"] | null
          total_bounces: number | null
          total_clicks: number | null
          total_delivered: number | null
          total_opens: number | null
          total_recipients: number | null
          total_sent: number | null
          total_spam_reports: number | null
          total_unsubscribes: number | null
          unsubscribe_rate: number | null
        }
        Relationships: []
      }
      campaign_performance_summary: {
        Row: {
          bounce_rate: number | null
          click_rate: number | null
          id: string | null
          name: string | null
          open_rate: number | null
          sent_at: string | null
          status: Database["public"]["Enums"]["campaign_status"] | null
          total_bounces: number | null
          total_clicks: number | null
          total_delivered: number | null
          total_opens: number | null
          total_sent: number | null
        }
        Relationships: []
      }
      domain_reputation_stats: {
        Row: {
          delivery_rate: number | null
          dkim_status: string | null
          dmarc_status: string | null
          domain: string | null
          id: string | null
          is_blacklisted: boolean | null
          last_checked_at: string | null
          reputation_score: number | null
          spf_status: string | null
          total_bounced: number | null
          total_delivered: number | null
          total_sent: number | null
          total_spam_reports: number | null
        }
        Relationships: []
      }
      subscriber_engagement_summary: {
        Row: {
          email: string | null
          engagement_level_30d: string | null
          id: string | null
          last_engagement: string | null
          status: Database["public"]["Enums"]["subscriber_status"] | null
          total_clicks_30d: number | null
          total_emails_received_30d: number | null
          total_opens_30d: number | null
        }
        Relationships: []
      }
      subscriber_profiles: {
        Row: {
          auth_email: string | null
          avatar_url: string | null
          created_at: string | null
          customer_id: string | null
          email: string | null
          email_confirmed_at: string | null
          engagement_level: string | null
          first_name: string | null
          last_engagement_date: string | null
          last_name: string | null
          last_sign_in_at: string | null
          metadata: Json | null
          preferences: Json | null
          profile_updated_at: string | null
          source: string | null
          status: Database["public"]["Enums"]["subscriber_status"] | null
          subscribe_date: string | null
          subscriber_id: string | null
          subscription: Database["public"]["Enums"]["subscription_type"] | null
          subscription_expiration: string | null
          tags: string[] | null
          total_clicks: number | null
          total_opens: number | null
          trial_expiration: string | null
          unsubscribe_date: string | null
          updated_at: string | null
          user_created_at: string | null
          user_id: string | null
        }
        Relationships: []
      }
      subscriber_tag_counts: {
        Row: {
          color: string | null
          created_at: string | null
          description: string | null
          id: string | null
          name: string | null
          subscriber_count: number | null
        }
        Relationships: []
      }
      template_usage_stats: {
        Row: {
          avg_rating: number | null
          created_at: string | null
          favorite_count: number | null
          id: string | null
          last_used_at: string | null
          name: string | null
          status: Database["public"]["Enums"]["template_status"] | null
          template_type: Database["public"]["Enums"]["template_type"] | null
          total_ratings: number | null
          usage_count: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      analyze_email_system_performance: {
        Args: Record<PropertyKey, never>
        Returns: {
          table_name: string
          estimated_rows: number
          table_size: string
          index_usage: string
          recommendations: string
        }[]
      }
      archive_old_email_data: {
        Args: { archive_before_date?: string }
        Returns: number
      }
      calculate_daily_list_growth: {
        Args: { target_date?: string }
        Returns: undefined
      }
      check_send_rate_limit: {
        Args: { provider_name: string; emails_to_send?: number }
        Returns: boolean
      }
      create_families_table: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      create_monthly_partitions: {
        Args: { table_name: string; months_ahead?: number }
        Returns: undefined
      }
      discipline_exists: {
        Args: { p_discipline_id: string }
        Returns: boolean
      }
      get_discipline_id: {
        Args: { p_id: string }
        Returns: string
      }
      get_email_system_metrics: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_employee_discipline_names: {
        Args: { p_employee_id: number }
        Returns: {
          id: string
          name: string
        }[]
      }
      get_employee_disciplines: {
        Args: { p_employee_id: number }
        Returns: string[]
      }
      get_employee_id: {
        Args: { p_id: string }
        Returns: string
      }
      get_enhanced_email_metrics: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_enrollment_id: {
        Args: { p_id: string }
        Returns: string
      }
      get_entity_by_id: {
        Args: { p_id: string; p_table_name: string; p_id_map_table: string }
        Returns: string
      }
      get_event_id: {
        Args: { p_id: string }
        Returns: string
      }
      get_invoice_id: {
        Args: { p_id: string }
        Returns: string
      }
      get_location_id: {
        Args: { p_id: string }
        Returns: string
      }
      get_location_type_id: {
        Args: { p_id: string }
        Returns: string
      }
      get_role_id: {
        Args: { p_id: string }
        Returns: string
      }
      get_service_id: {
        Args: { p_id: string }
        Returns: string
      }
      get_service_variation_id: {
        Args: { p_id: string }
        Returns: string
      }
      get_setting_id: {
        Args: { p_id: string }
        Returns: string
      }
      get_user_id: {
        Args: { p_id: string }
        Returns: string
      }
      get_user_permission_id: {
        Args: { p_id: string }
        Returns: string
      }
      inspect_junction_table: {
        Args: { junction_table: string; table1: string; table2: string }
        Returns: {
          junction_table_name: string
          table1_name: string
          table1_column: string
          table1_column_type: string
          table2_name: string
          table2_column: string
          table2_column_type: string
          junction_count: number
        }[]
      }
      inspect_table_structure: {
        Args: { table_name: string }
        Returns: {
          column_name: string
          data_type: string
          is_nullable: boolean
          is_primary: boolean
        }[]
      }
      is_admin: {
        Args: { user_id: string }
        Returns: boolean
      }
      is_valid_uuid: {
        Args: { str: string }
        Returns: boolean
      }
      migrate_employee_disciplines: {
        Args: { p_employee_id: number }
        Returns: number
      }
      refresh_engagement_summary: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
    }
    Enums: {
      automation_trigger:
        | "signup"
        | "purchase"
        | "abandonment"
        | "anniversary"
        | "behavior"
        | "custom"
      bounce_type: "hard" | "soft" | "complaint"
      campaign_status:
        | "draft"
        | "scheduled"
        | "sending"
        | "sent"
        | "paused"
        | "failed"
      email_send_status: "pending" | "sent" | "delivered" | "bounced" | "failed"
      notification_severity: "info" | "warning" | "error" | "critical"
      subscriber_status: "active" | "unsubscribed" | "bounced" | "pending"
      subscription_type:
        | "none"
        | "monthly"
        | "annual"
        | "lifetime"
        | "admin"
        | "ad_manager"
      template_status: "draft" | "active" | "archived"
      template_type:
        | "welcome"
        | "newsletter"
        | "promotional"
        | "transactional"
        | "custom"
      user_role: "admin" | "ad_manager"
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
      automation_trigger: [
        "signup",
        "purchase",
        "abandonment",
        "anniversary",
        "behavior",
        "custom",
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
      notification_severity: ["info", "warning", "error", "critical"],
      subscriber_status: ["active", "unsubscribed", "bounced", "pending"],
      subscription_type: [
        "none",
        "monthly",
        "annual",
        "lifetime",
        "admin",
        "ad_manager",
      ],
      template_status: ["draft", "active", "archived"],
      template_type: [
        "welcome",
        "newsletter",
        "promotional",
        "transactional",
        "custom",
      ],
      user_role: ["admin", "ad_manager"],
    },
  },
} as const
