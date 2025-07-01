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
      email_automations: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          template_id: string | null
          total_sent: number | null
          total_triggered: number | null
          trigger_conditions: Json | null
          trigger_type: Database["public"]["Enums"]["automation_trigger"] | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          template_id?: string | null
          total_sent?: number | null
          total_triggered?: number | null
          trigger_conditions?: Json | null
          trigger_type?:
            | Database["public"]["Enums"]["automation_trigger"]
            | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          template_id?: string | null
          total_sent?: number | null
          total_triggered?: number | null
          trigger_conditions?: Json | null
          trigger_type?:
            | Database["public"]["Enums"]["automation_trigger"]
            | null
          updated_at?: string | null
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
      debug_is_admin: {
        Args: { user_id: string }
        Returns: Json
      }
      is_admin: {
        Args: { user_id: string }
        Returns: boolean
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
  stripe_tables: {
    Enums: {},
  },
} as const
