"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import {
  SupabaseClient,
  AuthError,
  AuthTokenResponsePassword,
  AuthResponse,
  Session,
} from "@supabase/supabase-js";
import { Profile, UserProfile } from "@/utils/supabase/types";
import {
  fetchUserPermissions,
  fetchProfile,
  signUpWithStripe,
  updateStripe,
} from "@/utils/supabase/actions";
import { createSupabaseBrowser } from "@/utils/supabase/client";

type AuthContextType = {
  user: UserProfile | null;
  session: Session | null;
  supabase: SupabaseClient;
  loading: boolean;
  signUp: (
    first_name: string,
    last_name: string,
    email: string,
    password: string
  ) => Promise<AuthResponse>;
  signIn: (
    email: string,
    password: string
  ) => Promise<AuthTokenResponsePassword>;
  signOut: (scope: "global" | "local" | "others" | undefined) => Promise<{
    error: AuthError | null;
  }>;
  resetPassword: (email: string) => Promise<{
    error: AuthError | null;
    data: object | null;
  }>;
  updateProfile: (profile: Profile) => Promise<{ error: string | null }>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const supabase = createSupabaseBrowser();

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    if (session?.user) {
      try {
        const { profile, error } = await fetchProfile(session.user.id);
        if (error) {
          console.log(JSON.stringify(error));
          return;
        }

        const { 
          is_admin, 
          is_ad_manager, 
          can_access_admin, 
          can_access_ad_manager, 
          error: permissionsError 
        } = await fetchUserPermissions(session.user.id);
        
        if (permissionsError) {
          console.log(JSON.stringify(permissionsError));
          return;
        }

        if (profile) {
          // Check Stripe subscription status
          const { success, profile: updatedProfile } = await updateStripe(
            session.user.email!,
            profile
          );

          if (success && updatedProfile) {
            setUser({
              ...session.user,
              profile: updatedProfile,
              is_admin,
              is_ad_manager,
              can_access_admin,
              can_access_ad_manager,
            });
          } else if (profile) {
            setUser({ 
              ...session.user, 
              profile, 
              is_admin,
              is_ad_manager,
              can_access_admin,
              can_access_ad_manager,
            });
          }
        }
      } catch (error) {
        console.error("Error refreshing user:", error);
      }
    }
  };

  const updateUserFromSession = async () => {
    try {
      setLoading(user === null);
      const {
        data: { user: logged_in_user },
      } = await supabase.auth.getUser();

      if (logged_in_user) {
        const { profile, error } = await fetchProfile(logged_in_user.id);
        if (error) {
          console.log("error fetching profile", JSON.stringify(error));
        }

        const { 
          is_admin, 
          is_ad_manager, 
          can_access_admin, 
          can_access_ad_manager, 
          error: permissionsError 
        } = await fetchUserPermissions(logged_in_user.id);
        
        if (permissionsError) {
          console.log(
            "error fetching permissions",
            JSON.stringify(permissionsError)
          );
        }

        if (profile) {
          // Check Stripe subscription status
          try {
            const { success, profile: updatedProfile } = await updateStripe(
              logged_in_user.email!,
              profile
            );
            if (success && updatedProfile) {
              setUser({ 
                ...logged_in_user, 
                profile: updatedProfile, 
                is_admin,
                is_ad_manager,
                can_access_admin,
                can_access_ad_manager,
              });
            } else {
              setUser({ 
                ...logged_in_user, 
                profile, 
                is_admin,
                is_ad_manager,
                can_access_admin,
                can_access_ad_manager,
              });
            }
          } catch (stripeError) {
            console.error("Error updating Stripe data:", stripeError);
            setUser({ 
              ...logged_in_user, 
              profile, 
              is_admin,
              is_ad_manager,
              can_access_admin,
              can_access_ad_manager,
            });
          }
        } else {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    } catch (error) {
      console.log("error fetching profile", JSON.stringify(error));
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    updateUserFromSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  useEffect(() => {
    console.log("auth context triggered");

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("auth state changed", event);
      setSession(session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    return await supabase.auth.signInWithPassword({ email, password });
  };

  const signUp = async (
    first_name: string,
    last_name: string,
    email: string,
    password: string
  ) => {
    return await signUpWithStripe(first_name, last_name, email, password);
  };

  const signOut = async (scope: "global" | "local" | "others" | undefined) => {
    return await supabase.auth.signOut({ scope });
  };

  const resetPassword = async (email: string) => {
    return await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/create-password`,
    });
  };

  const updateProfile = async (profile: Profile) => {
    if (user) {
      const { error } = await supabase
        .from("profiles")
        .update(profile)
        .eq("id", profile.id!);
      if (error) {
        console.log(JSON.stringify(error));
        return { error: error.message };
      }

      setUser({ ...user, profile });
      return { error: null };
    }

    return { error: "not logged in" };
  };

  const value = {
    user,
    session,
    supabase,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updateProfile,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
