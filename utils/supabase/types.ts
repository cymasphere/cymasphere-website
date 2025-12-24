/**
 * @fileoverview Supabase type definitions and interfaces
 * 
 * This file exports TypeScript types and interfaces for Supabase database
 * tables and enums. Includes extended user profile types with admin status.
 * 
 * @module utils/supabase/types
 */

import { Database } from "@/database.types";
import { User } from "@supabase/supabase-js";

/**
 * Subscription type enum from database
 */
export type SubscriptionType = Database["public"]["Enums"]["subscription_type"];

/**
 * Profile table row type
 */
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];

/**
 * User sessions table row type
 */
export type SessionData = Database["public"]["Tables"]["user_sessions"]["Row"];

/**
 * Extended user interface with profile and admin status
 */
export interface UserProfile extends User {
  profile: Profile;
  is_admin: boolean;
}
