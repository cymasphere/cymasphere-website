/**
 * @fileoverview Authentication context provider for managing user authentication state and operations.
 * @module contexts/AuthContext
 * @description Provides authentication functionality including sign up, sign in, sign out,
 * password reset, profile management, and subscription status updates. Integrates with
 * Supabase for authentication and user profile management.
 */

"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
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
} from "@/utils/supabase/actions";
import { createClient } from "@/utils/supabase/client";
import { logEnvironmentStatus } from "@/utils/env-check";
// import { updateSubscriberTimezone } from "@/utils/supabase/timezone-tracker";

/**
 * @brief Type definition for the authentication context.
 * @description Defines the shape of the authentication context value, including
 * user state, session, Supabase client, loading state, and authentication methods.
 */
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

/**
 * @brief Authentication context provider component.
 * @description Manages user authentication state, session management, profile updates,
 * and subscription status. Handles authentication state changes and provides methods
 * for sign up, sign in, sign out, password reset, and profile updates.
 * @param {Object} props - Component props.
 * @param {React.ReactNode} props.children - Child components to wrap with authentication context.
 * @returns {JSX.Element} AuthContext provider wrapping children.
 * @note Automatically updates subscription status using centralized check-subscription utility.
 * @note Logs environment status on mount to help debug 500 errors.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Log environment status on mount to help debug 500 errors
  useEffect(() => {
    logEnvironmentStatus();
  }, []);

  /**
   * @brief Refreshes the current user's profile and subscription status.
   * @description Fetches the latest profile data, admin status, and subscription
   * information from the database and updates the user state.
   * @returns {Promise<void>} Promise that resolves when the user data is refreshed.
   * @note Uses centralized updateUserProStatus function to handle NFR, Stripe, and iOS subscriptions.
   */
  const refreshUser = useCallback(async () => {
    if (session?.user) {
      try {
        const { profile, error } = await fetchProfile(session.user.id);
        if (error) {
          console.log("[refreshUser] Error fetching profile:", error);
          return;
        }

        const { is_admin, error: adminError } = await fetchIsAdmin(
          session.user.id
        );
        if (adminError) {
          console.log("[refreshUser] Error fetching admin status:", adminError);
          return;
        }

        if (profile) {
          // Update pro status using centralized function (handles NFR, Stripe, and iOS)
          try {
            const { updateUserProStatus } = await import(
              "@/utils/subscriptions/check-subscription"
            );
            const result = await updateUserProStatus(session.user.id);

            // Update profile with the determined subscription status
            const updatedProfile = {
              ...profile,
              subscription: result.subscription,
              subscription_expiration:
                result.subscriptionExpiration?.toISOString() || null,
              subscription_source: result.source,
            };

            setUser({
              ...session.user,
              profile: updatedProfile,
              is_admin,
            });
          } catch (error) {
            console.error("[refreshUser] Error updating pro status:", error);
            // Fall back to original profile if update fails
            setUser({ ...session.user, profile, is_admin });
          }
        }
      } catch (error) {
        console.error("[refreshUser] Error refreshing user:", error);
      }
    }
  }, [session]);

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
            console.log(
              "error fetching profile",
              error instanceof Error ? error.message : String(error)
            );
            // Don't set user to null - keep them logged in even if profile fetch fails
            // This is important for password reset flow
            // Create a minimal profile object with required fields
            const defaultProfile: Profile = {
              id: logged_in_user.id,
              email: logged_in_user.email || "",
              first_name: null,
              last_name: null,
              subscription: "none",
              customer_id: null,
              subscription_expiration: null,
              trial_expiration: null,
            } as Profile;
            setUser({
              ...logged_in_user,
              profile: defaultProfile,
              is_admin: false,
            });
            return;
          }

          const { is_admin, error: adminError } = await fetchIsAdmin(
            logged_in_user.id
          );
          if (adminError) {
            console.log(
              "error fetching admin status",
              adminError instanceof Error
                ? adminError.message
                : String(adminError)
            );
          } else {
            console.log(
              `[AuthContext] Admin status for ${logged_in_user.email}:`,
              is_admin
            );
          }

          if (profile) {
            // Set user immediately with basic profile data
            setUser({
              ...logged_in_user,
              profile,
              is_admin: is_admin || false,
            });

            // Update pro status asynchronously (non-blocking) using centralized function
            try {
              const { updateUserProStatus } = await import(
                "@/utils/subscriptions/check-subscription"
              );
              const result = await updateUserProStatus(logged_in_user.id);

              // Update profile with the determined subscription status
              const updatedProfile = {
                ...profile,
                subscription: result.subscription,
                subscription_expiration:
                  result.subscriptionExpiration?.toISOString() || null,
                subscription_source: result.source,
              };

              setUser({
                ...logged_in_user,
                profile: updatedProfile,
                is_admin: is_admin || false,
              });
            } catch (proStatusError) {
              // Keep the user logged in even if pro status update fails
              console.log("Pro status update failed:", proStatusError);
            }
          }
        } else {
          setUser(null);
        }
      } catch (error) {
        console.log(
          "error updating user from session",
          error instanceof Error ? error.message : String(error)
        );
        // Only set user to null if we have a real auth error, not a profile fetch error
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        if (errorMessage.includes("JWT") || errorMessage.includes("auth")) {
          setUser(null);
        }
      } finally {
        setLoading(false);
      }
    };

    updateUserFromSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  // Simple auth state change handler - based on working project
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);

      // Handle timezone tracking directly in AuthContext to ensure it runs
      // if (
      //   (event === "SIGNED_IN" || event === "INITIAL_SESSION") &&
      //   session?.user
      // ) {
      //   await updateSubscriberTimezone(session.user.id);
      // }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  /**
   * @brief Signs in a user with email and password.
   * @param {string} email - User's email address.
   * @param {string} password - User's password.
   * @returns {Promise<AuthTokenResponsePassword>} Promise resolving to authentication response.
   */
  const signIn = async (email: string, password: string) => {
    return await supabase.auth.signInWithPassword({ email, password });
  };

  /**
   * @brief Signs up a new user with Stripe integration.
   * @param {string} first_name - User's first name.
   * @param {string} last_name - User's last name.
   * @param {string} email - User's email address.
   * @param {string} password - User's password.
   * @returns {Promise<AuthResponse>} Promise resolving to authentication response.
   * @note Creates a Stripe customer during sign up.
   */
  const signUp = async (
    first_name: string,
    last_name: string,
    email: string,
    password: string
  ) => {
    return await signUpWithStripe(first_name, last_name, email, password);
  };

  /**
   * @brief Signs out the current user.
   * @param {("global" | "local" | "others" | undefined)} scope - Sign out scope.
   * @description "global" signs out from all devices, "local" signs out from current device,
   * "others" signs out from all other devices, undefined uses default behavior.
   * @returns {Promise<{error: AuthError | null}>} Promise resolving to sign out result.
   */
  const signOut = async (scope: "global" | "local" | "others" | undefined) => {
    return await supabase.auth.signOut({ scope });
  };

  /**
   * @brief Sends a password reset email to the user.
   * @param {string} email - User's email address.
   * @returns {Promise<{error: AuthError | null, data: object | null}>} Promise resolving to reset result.
   * @note Redirects to /reset-password page after email link is clicked.
   */
  const resetPassword = async (email: string) => {
    return await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/reset-password`,
    });
  };

  /**
   * @brief Updates the user's profile information.
   * @param {Profile} profile - Profile object with updated fields.
   * @returns {Promise<{error: string | null}>} Promise resolving to update result.
   * @note Only works if user is logged in. Updates both database and local state.
   */
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

/**
 * @brief Custom hook to access the authentication context.
 * @description Provides access to user state, session, authentication methods,
 * and Supabase client. Must be used within an AuthProvider.
 * @returns {AuthContextType} Authentication context value.
 * @throws {Error} If used outside of AuthProvider.
 * @example
 * const { user, signIn, signOut } = useAuth();
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
