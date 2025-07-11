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
          console.log(JSON.stringify(error));
          return;
        }

        const { is_admin, error: adminError } = await fetchIsAdmin(
          session.user.id
        );
        if (adminError) {
          console.log(JSON.stringify(adminError));
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
        console.log("👤 Fetching user profile for:", logged_in_user.email);

        const { profile, error } = await fetchProfile(logged_in_user.id);
        if (error) {
          console.log("❌ Error fetching profile", JSON.stringify(error));
          setUser(null);
          return;
        }

        const { is_admin, error: adminError } = await fetchIsAdmin(
          logged_in_user.id
        );
        if (adminError) {
          console.log(
            "❌ Error fetching admin status",
            JSON.stringify(adminError)
          );
          // Don't fail completely if admin check fails, just set is_admin to false
        }

        if (profile) {
          // Set user immediately, then update Stripe async
          setUser({ ...logged_in_user, profile, is_admin: is_admin || false });

          // Update Stripe subscription status asynchronously (non-blocking)
          updateStripe(logged_in_user.email!, profile)
            .then(({ success, profile: updatedProfile }) => {
              if (success && updatedProfile) {
                console.log("✅ Stripe data updated");
                setUser({
                  ...logged_in_user,
                  profile: updatedProfile,
                  is_admin: is_admin || false,
                });
              }
            })
            .catch((stripeError) => {
              console.warn(
                "⚠️ Stripe update failed (non-critical):",
                stripeError
              );
              // Keep the user logged in even if Stripe fails
            });
        } else {
          console.log("❌ No profile found for user");
          setUser(null);
        }
      } else {
        console.log("ℹ️ No authenticated user found");
        setUser(null);
      }
    } catch (error) {
      console.error("❌ Error in updateUserFromSession:", error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log("🔐 AuthContext initializing...");

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log(`🔐 Auth state changed: ${event}`, {
        hasSession: !!session,
        userId: session?.user?.id,
        expiresAt: session?.expires_at,
      });

      // Handle password recovery events
      if (event === "PASSWORD_RECOVERY" && session) {
        console.log(
          "🔐 Password recovery event detected - session established for password reset"
        );
        setSession(session);
        return;
      }

      // Prevent unnecessary re-renders during auth operations
      if (event === "TOKEN_REFRESHED" && session) {
        console.log("✅ Token refreshed successfully");
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
          console.error("❌ Error getting session:", error);
          return;
        }

        if (currentSession) {
          const now = Date.now() / 1000;
          const expiresAt = currentSession.expires_at || 0;
          const timeUntilExpiry = expiresAt - now;

          // Refresh 10 minutes before expiry
          if (timeUntilExpiry < 600) {
            console.log(
              `🔄 Auto-refreshing token (expires in ${Math.round(
                timeUntilExpiry / 60
              )} minutes)...`
            );

            const { data, error: refreshError } =
              await supabase.auth.refreshSession();

            if (refreshError) {
              console.error("❌ Failed to refresh session:", refreshError);
              // Only sign out if refresh fails with specific errors
              if (
                refreshError.message.includes("refresh_token_not_found") ||
                refreshError.message.includes("invalid_grant")
              ) {
                console.log("🚪 Invalid refresh token, signing out...");
                await supabase.auth.signOut();
              }
            } else if (data.session) {
              console.log("✅ Session refreshed successfully");
              setSession(data.session);
            }
          } else {
            console.log(
              `⏰ Token valid for ${Math.round(
                timeUntilExpiry / 60
              )} more minutes`
            );
          }
        }
      } catch (error) {
        console.error("❌ Error in token refresh interval:", error);
      }
    }, 30000); // Check every 30 seconds

    // Initial session check
    const checkInitialSession = async () => {
      try {
        const {
          data: { session: initialSession },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          console.error("❌ Error getting initial session:", error);
        } else if (initialSession) {
          console.log("✅ Initial session found:", {
            userId: initialSession.user?.id,
            expiresAt: initialSession.expires_at,
          });
          setSession(initialSession);
        } else {
          console.log("ℹ️ No initial session found");
        }
      } catch (error) {
        console.error("❌ Error checking initial session:", error);
      }
    };

    checkInitialSession();

    return () => {
      console.log("🔐 AuthContext cleanup");
      subscription.unsubscribe();
      clearInterval(refreshInterval);
    };
  }, []);

  useEffect(() => {
    // Only update user when session actually changes
    if (session?.user && session.user.id !== user?.id) {
      console.log("🔄 Session changed, updating user profile...");
      updateUserFromSession();
    } else if (!session && user) {
      console.log("🚪 Session cleared, clearing user...");
      setUser(null);
      setLoading(false);
    } else if (session && user && session.user.id === user.id) {
      console.log("✅ Session matches current user, no update needed");
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
