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
  fetchIsAdmin,
  fetchProfile,
  signUpWithStripe,
  updateStripe,
} from "@/utils/supabase/actions";
import { createClient } from "@/utils/supabase/client";

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

const supabase = createClient();

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    if (session?.user) {
      try {
        const { profile, error } = await fetchProfile(session.user.id);
        if (error) {
          return;
        }

        const { is_admin, error: adminError } = await fetchIsAdmin(
          session.user.id
        );
        if (adminError) {
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
            });
          } else if (profile) {
            setUser({ ...session.user, profile, is_admin });
          }
        }
      } catch {
        console.error("Error refreshing user");
      }
    }
  };

  // Simple session update effect - based on working project
  useEffect(() => {
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
            setUser(null);
            return;
          }

          const { is_admin, error: adminError } = await fetchIsAdmin(
            logged_in_user.id
          );
          if (adminError) {
            console.log(
              "error fetching admin status",
              JSON.stringify(adminError)
            );
          }

          if (profile) {
            // Set user immediately with basic profile data
            setUser({
              ...logged_in_user,
              profile,
              is_admin: is_admin || false,
            });

            // Update Stripe subscription status asynchronously (non-blocking)
            try {
              const { success, profile: updatedProfile } = await updateStripe(
                logged_in_user.email!,
                profile
              );
              if (success && updatedProfile) {
                setUser({
                  ...logged_in_user,
                  profile: updatedProfile,
                  is_admin: is_admin || false,
                });
              }
            } catch (stripeError) {
              // Keep the user logged in even if Stripe update fails
              console.log("Stripe update failed:", stripeError);
            }
          }
        } else {
          setUser(null);
        }
      } catch (error) {
        console.log("error updating user from session", JSON.stringify(error));
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    updateUserFromSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  // Simple auth state change handler - based on working project
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
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/reset-password`,
    });
  };

  const updateProfile = async (profile: Profile) => {
    if (user) {
      const { error } = await supabase
        .from("profiles")
        .update(profile)
        .eq("id", profile.id!);
      if (error) {
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
