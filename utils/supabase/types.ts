import { Database } from "@/database.types";
import { User } from "@supabase/supabase-js";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export interface UserProfile extends User {
  profile: Profile;
}
