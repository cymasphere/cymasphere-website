import { Database } from "@/database.types";
import { User } from "@supabase/supabase-js";

export type SubscriptionType = Database["public"]["Enums"]["subscription_type"];

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export type SessionData = Database["public"]["Tables"]["user_sessions"]["Row"];

export interface UserProfile extends User {
  profile: Profile;
  is_admin: boolean;
}
