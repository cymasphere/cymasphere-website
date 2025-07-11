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

  const updateUserFromSession = async () => {
    try {
      setLoading(user === null);
      const {
        data: { user: logged_in_user },
      } = await supabase.auth.getUser();

      if (logged_in_user) {
        const { profile, error } = await fetchProfile(logged_in_user.id);
        if (error) {
          setUser(null);
          return;
        }

        const { is_admin, error: adminError } = await fetchIsAdmin(
          logged_in_user.id
        );
        if (adminError) {
          // Don't fail completely if admin check fails, just set is_admin to false
        }

        if (profile) {
          // Set user immediately, then update Stripe async
          setUser({ ...logged_in_user, profile, is_admin: is_admin || false });

          // Update Stripe subscription status asynchronously (non-blocking)
          updateStripe(logged_in_user.email!, profile)
            .then(({ success, profile: updatedProfile }) => {
              if (success && updatedProfile) {
                setUser({
                  ...logged_in_user,
                  profile: updatedProfile,
                  is_admin: is_admin || false,
                });
              }
            })
            .catch(() => {
              // Keep the user logged in even if Stripe fails
            });
        } else {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Handle password recovery events
      if (event === "PASSWORD_RECOVERY" && session) {
        setSession(session);
        return;
      }

      // Prevent unnecessary re-renders during auth operations
      if (event === "TOKEN_REFRESHED" && session) {
        setSession(session);
        return;
      }

      setSession(session);
    });

    // Token refresh to prevent login redirects
    const refreshInterval = setInterval(async () => {
      try {
        const {
          data: { session: currentSession },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          return;
        }

        if (currentSession) {
          const now = Date.now() / 1000;
          const expiresAt = currentSession.expires_at || 0;
          const timeUntilExpiry = expiresAt - now;

          // Refresh 10 minutes before expiry
          if (timeUntilExpiry < 600) {
            const { data, error: refreshError } =
              await supabase.auth.refreshSession();

            if (refreshError) {
              // Only sign out if refresh fails with specific errors
              if (
                refreshError.message.includes("refresh_token_not_found") ||
                refreshError.message.includes("invalid_grant")
              ) {
                await supabase.auth.signOut();
              }
            } else if (data.session) {
              setSession(data.session);
            }
          }
        }
      } catch {
        // Silent fail for token refresh errors
      }
    }, 30000); // Check every 30 seconds

    // Initial session check
    const checkInitialSession = async () => {
      try {
        const {
          data: { session: initialSession },
          error,
        } = await supabase.auth.getSession();

        if (!error && initialSession) {
          setSession(initialSession);
        }
      } catch {
        // Silent fail for initial session check
      }
    };

    checkInitialSession();

    return () => {
      subscription.unsubscribe();
      clearInterval(refreshInterval);
    };
  }, []);

  useEffect(() => {
    // Only update user when session actually changes
    if (session?.user && session.user.id !== user?.id) {
      updateUserFromSession();
    } else if (!session && user) {
      setUser(null);
      setLoading(false);
    } else if (session && user && session.user.id === user.id) {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id]); // Only trigger when user ID changes

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
