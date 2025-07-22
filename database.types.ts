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
      profiles: {
        Row: {
          id: string
          email: string
          first_name: string | null
          last_name: string | null
          subscription: Database['public']['Enums']['subscription_type']
          customer_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          first_name?: string | null
          last_name?: string | null
          subscription?: Database['public']['Enums']['subscription_type']
          customer_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          first_name?: string | null
          last_name?: string | null
          subscription?: Database['public']['Enums']['subscription_type']
          customer_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      subscribers: {
        Row: {
          id: string
          email: string
          status: Database['public']['Enums']['subscriber_status']
          subscribe_date: string | null
          metadata: Json | null
          user_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          status?: Database['public']['Enums']['subscriber_status']
          subscribe_date?: string | null
          metadata?: Json | null
          user_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          status?: Database['public']['Enums']['subscriber_status']
          subscribe_date?: string | null
          metadata?: Json | null
          user_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      user_sessions: {
        Row: {
          id: string
          user_id: string
          session_data: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          session_data: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          session_data?: Json
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      subscription_type: 'none' | 'monthly' | 'annual' | 'lifetime' | 'admin'
      subscriber_status: 'active' | 'inactive' | 'unsubscribed'
    }
  }
}
