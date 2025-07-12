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
// import { updateSubscriberTimezone } from "@/utils/supabase/timezone-tracker";

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
        console.log(
          "[refreshUser] Starting to fetch profile for user:",
          session.user.id
        );
        const { profile, error } = await fetchProfile(session.user.id);
        if (error) {
          console.log("[refreshUser] Error fetching profile:", error);
          return;
        }

        console.log(
          "[refreshUser] Starting to fetch admin status for user:",
          session.user.id
        );
        const { is_admin, error: adminError } = await fetchIsAdmin(
          session.user.id
        );
        if (adminError) {
          console.log("[refreshUser] Error fetching admin status:", adminError);
          return;
        }

        if (profile) {
          // Check Stripe subscription status
          console.log(
            "[refreshUser] Starting to update Stripe for user:",
            session.user.email
          );
          const { success, profile: updatedProfile } = await updateStripe(
            session.user.email!,
            profile
          );

          if (success && updatedProfile) {
            console.log(
              "[refreshUser] Successfully updated user with Stripe profile"
            );
            setUser({
              ...session.user,
              profile: updatedProfile,
              is_admin,
            });
          } else if (profile) {
            console.log(
              "[refreshUser] Setting user with basic profile (no Stripe update)"
            );
            setUser({ ...session.user, profile, is_admin });
          }
        }
      } catch (error) {
        console.error("[refreshUser] Error refreshing user:", error);
      }
    } else {
      console.log("[refreshUser] No session or user found, skipping refresh");
    }
  };

  // Simple session update effect - based on working project
  useEffect(() => {
    const updateUserFromSession = async () => {
      try {
        console.log(
          "[updateUserFromSession] Starting session update, current user:",
          user?.id || "null"
        );
        setLoading(user === null);
        console.log(
          "[updateUserFromSession] Getting current user from supabase auth"
        );
        const {
          data: { user: logged_in_user },
        } = await supabase.auth.getUser();

        if (logged_in_user) {
          console.log(
            "[updateUserFromSession] Found logged in user:",
            logged_in_user.id
          );
          console.log(
            "[updateUserFromSession] Fetching profile for user:",
            logged_in_user.id
          );
          const { profile, error } = await fetchProfile(logged_in_user.id);
          if (error) {
            console.log("error fetching profile", JSON.stringify(error));
            // Don't set user to null - keep them logged in even if profile fetch fails
            // This is important for password reset flow
            // Create a minimal profile object with required fields
            console.log(
              "[updateUserFromSession] Creating default profile due to fetch error"
            );
            const defaultProfile: Profile = {
              id: logged_in_user.id,
              avatar_url: null,
              customer_id: null,
              first_name: null,
              last_name: null,
              last_stripe_api_check: null,
              subscription: "none",
              subscription_expiration: null,
              trial_expiration: null,
              updated_at: null,
            };
            console.log(
              "[updateUserFromSession] Setting user with default profile"
            );
            setUser({
              ...logged_in_user,
              profile: defaultProfile,
              is_admin: false,
            });
            return;
          }

          console.log(
            "[updateUserFromSession] Fetching admin status for user:",
            logged_in_user.id
          );
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
            console.log(
              "[updateUserFromSession] Setting user with basic profile data"
            );
            setUser({
              ...logged_in_user,
              profile,
              is_admin: is_admin || false,
            });

            // Update Stripe subscription status asynchronously (non-blocking)
            try {
              console.log(
                "[updateUserFromSession] Starting Stripe update for user:",
                logged_in_user.email
              );
              const { success, profile: updatedProfile } = await updateStripe(
                logged_in_user.email!,
                profile
              );
              if (success && updatedProfile) {
                console.log(
                  "[updateUserFromSession] Successfully updated user with Stripe profile"
                );
                setUser({
                  ...logged_in_user,
                  profile: updatedProfile,
                  is_admin: is_admin || false,
                });
              } else {
                console.log(
                  "[updateUserFromSession] Stripe update failed or returned no profile"
                );
              }
            } catch (stripeError) {
              // Keep the user logged in even if Stripe update fails
              console.log("Stripe update failed:", stripeError);
            }
          } else {
            console.log("[updateUserFromSession] No profile found for user");
          }
        } else {
          console.log(
            "[updateUserFromSession] No logged in user found, setting user to null"
          );
          setUser(null);
        }
      } catch (error) {
        console.log("error updating user from session", JSON.stringify(error));
        // Only set user to null if we have a real auth error, not a profile fetch error
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        console.log("[updateUserFromSession] Error message:", errorMessage);
        if (errorMessage.includes("JWT") || errorMessage.includes("auth")) {
          console.log(
            "[updateUserFromSession] Auth error detected, setting user to null"
          );
          setUser(null);
        } else {
          console.log(
            "[updateUserFromSession] Non-auth error, keeping user logged in"
          );
        }
      } finally {
        console.log("[updateUserFromSession] Setting loading to false");
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
      console.log(
        `[AuthContext] Session: ${session ? "EXISTS" : "NULL"}, User: ${
          session?.user?.id || "NULL"
        }`
      );
      setSession(session);

      // Handle timezone tracking directly in AuthContext to ensure it runs
      // if (
      //   (event === "SIGNED_IN" || event === "INITIAL_SESSION") &&
      //   session?.user
      // ) {
      //   console.log(
      //     `[AuthContext] Triggering timezone update for user: ${session.user.id}`
      //   );
      //   await updateSubscriberTimezone(session.user.id);
      // }
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
