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
  useMemo,
  useRef,
} from "react";
import {
  SupabaseClient,
  AuthError,
  AuthTokenResponsePassword,
  AuthResponse,
  Session,
  User,
} from "@supabase/supabase-js";
import { Profile, UserProfile } from "@/utils/supabase/types";
import { signUpWithStripe } from "@/utils/supabase/actions";
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
    password: string,
  ) => Promise<AuthResponse>;
  signIn: (
    email: string,
    password: string,
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

/** Max time to wait on auth/profile network calls before failing the sync so UI can recover. */
const AUTH_SYNC_TIMEOUT_MS = 25_000;

/**
 * @brief Rejects if `promise` does not settle within `ms` milliseconds.
 * @param promise Async work to bound.
 * @param ms Timeout in milliseconds.
 * @param label Included in the timeout error message for debugging.
 * @returns The resolved value of `promise`.
 */
function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const id = setTimeout(() => {
      reject(new Error(`${label} timed out after ${ms}ms`));
    }, ms);
    promise.then(
      (value) => {
        clearTimeout(id);
        resolve(value);
      },
      (err: unknown) => {
        clearTimeout(id);
        reject(err instanceof Error ? err : new Error(String(err)));
      },
    );
  });
}

/**
 * @brief Fetches profile from Supabase using the browser client (avoids server action / 431 when cookies are large).
 * @param userId User ID to fetch profile for.
 * @returns Promise with profile data or error.
 */
async function fetchProfileClient(
  userId: string,
): Promise<{ profile: Profile | null; error: Error | null }> {
  const { data: profile, error } = await supabase
    .from("profiles")
    .select()
    .eq("id", userId)
    .single();
  return {
    profile: profile ?? null,
    error: error ? new Error(error.message) : null,
  };
}

/**
 * @brief Checks admin status using the browser client (avoids server action / 431 when cookies are large).
 * @param userId User ID to check.
 * @returns Promise with is_admin boolean and optional error.
 */
async function fetchIsAdminClient(
  userId: string,
): Promise<{ is_admin: boolean; error: Error | null }> {
  const { data, error } = await supabase
    .from("admins")
    .select()
    .eq("user", userId)
    .maybeSingle();
  if (error) {
    return { is_admin: false, error: new Error(error.message) };
  }
  return { is_admin: !!data, error: null };
}

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
  const isUpdatingUserRef = useRef(false);
  /** When the current `updateUserFromSession` run started (`performance.now()` or `Date.now()`). */
  const updateUserLockStartedAtRef = useRef(0);
  const lastProStatusUpdateRef = useRef<number>(0);
  /**
   * Synchronous mirror of `session?.user?.id` updated in onAuthStateChange before setState.
   * Used to drop stale async work (profile / pro-status) that finishes after sign-out.
   */
  const latestAuthUserIdRef = useRef<string | null>(null);
  /**
   * Set true after the first `onAuthStateChange` callback (e.g. INITIAL_SESSION).
   * The session-sync effect runs before that subscription effect on mount; without this,
   * `session` is still null and we must not clear loading — otherwise `(private)/layout`
   * briefly sees `!user && !loading` and redirects to `/login` while cookies are valid.
   */
  const hasReceivedInitialAuthEventRef = useRef(false);

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
    const authUser = session?.user;
    const expectedUserId = authUser?.id;
    if (!expectedUserId || !authUser) {
      return;
    }
    try {
      const { profile, error } = await fetchProfileClient(expectedUserId);
      if (latestAuthUserIdRef.current !== expectedUserId) {
        return;
      }
      if (error) {
        console.log("[refreshUser] Error fetching profile:", error.message);
        return;
      }

      const { is_admin, error: adminError } = await fetchIsAdminClient(
        expectedUserId,
      );
      if (latestAuthUserIdRef.current !== expectedUserId) {
        return;
      }
      if (adminError) {
        console.log(
          "[refreshUser] Error fetching admin status:",
          adminError.message,
        );
        return;
      }

      if (profile) {
        // Update pro status using centralized function (handles NFR, Stripe, and iOS)
        try {
          const { updateUserProStatus } =
            await import("@/utils/subscriptions/check-subscription");
          const result = await updateUserProStatus(expectedUserId);
          if (latestAuthUserIdRef.current !== expectedUserId) {
            return;
          }

          // Update profile with the determined subscription status
          const updatedProfile = {
            ...profile,
            subscription: result.subscription,
            subscription_expiration:
              result.subscriptionExpiration?.toISOString() || null,
            subscription_source: result.source,
          };

          setUser({
            ...authUser,
            profile: updatedProfile,
            is_admin,
          });
        } catch (error) {
          console.error("[refreshUser] Error updating pro status:", error);
          if (latestAuthUserIdRef.current !== expectedUserId) {
            return;
          }
          // Fall back to original profile if update fails
          setUser({ ...authUser, profile, is_admin });
        }
      }
    } catch (error) {
      console.error("[refreshUser] Error refreshing user:", error);
    }
  }, [session]);

  /**
   * @brief Hydrate session from storage immediately so signed-out users are not stuck on loading=true.
   * @description onAuthStateChange INITIAL_SESSION can be delayed; until then the session-sync effect
   * returns early and never calls setLoading(false). This mirrors common Supabase + Next.js patterns.
   */
  useEffect(() => {
    void supabase.auth.getSession().then(({ data: { session: initial } }) => {
      hasReceivedInitialAuthEventRef.current = true;
      latestAuthUserIdRef.current = initial?.user?.id ?? null;
      setSession(initial ?? null);
      if (!initial?.user) {
        setUser(null);
        setLoading(false);
      }
    });
  }, []);

  // Simple session update effect - based on working project
  useEffect(() => {
    /**
     * @brief Loads profile/admin state for the signed-in user.
     * @param expectedUserId Auth user id from the active session.
     * @param sessionUserFallback User from the auth callback when storage lags cross-tab.
     * @param accessTokenHint Optional access JWT from React session; passed to getUser() so
     * resolution does not depend on cookie storage matching yet (BroadcastChannel / race).
     */
    const updateUserFromSession = async (
      expectedUserId: string,
      sessionUserFallback: User | undefined,
      accessTokenHint?: string,
    ) => {
      const nowPerf =
        typeof performance !== "undefined" ? performance.now() : Date.now();
      if (isUpdatingUserRef.current) {
        const lockAge = nowPerf - updateUserLockStartedAtRef.current;
        if (lockAge < AUTH_SYNC_TIMEOUT_MS) {
          return;
        }
        console.warn(
          "[AuthContext] Replacing stuck updateUserFromSession lock after",
          Math.round(lockAge),
          "ms",
        );
        isUpdatingUserRef.current = false;
      }

      isUpdatingUserRef.current = true;
      updateUserLockStartedAtRef.current = nowPerf;

      try {
        setLoading(user === null);
        const userResult = await withTimeout(
          accessTokenHint
            ? supabase.auth.getUser(accessTokenHint)
            : supabase.auth.getUser(),
          AUTH_SYNC_TIMEOUT_MS,
          "getUser",
        );
        if (userResult.error) {
          console.log(
            "[AuthContext] getUser:",
            accessTokenHint ? "jwt" : "storage",
            userResult.error.message,
          );
        }
        const fetchedUser = userResult.data?.user ?? null;

        const logged_in_user =
          fetchedUser ??
          (sessionUserFallback?.id === expectedUserId
            ? sessionUserFallback
            : null);

        if (latestAuthUserIdRef.current !== expectedUserId) {
          return;
        }

        if (logged_in_user) {
          if (logged_in_user.id !== expectedUserId) {
            return;
          }
          const { profile, error } = await withTimeout(
            fetchProfileClient(logged_in_user.id),
            AUTH_SYNC_TIMEOUT_MS,
            "fetchProfile",
          );
          if (latestAuthUserIdRef.current !== expectedUserId) {
            return;
          }
          if (error) {
            console.log("error fetching profile", error.message);
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
            if (latestAuthUserIdRef.current !== expectedUserId) {
              return;
            }
            setUser({
              ...logged_in_user,
              profile: defaultProfile,
              is_admin: false,
            });
            return;
          }

          const { is_admin, error: adminError } = await withTimeout(
            fetchIsAdminClient(logged_in_user.id),
            AUTH_SYNC_TIMEOUT_MS,
            "fetchIsAdmin",
          );
          if (latestAuthUserIdRef.current !== expectedUserId) {
            return;
          }
          if (adminError) {
            console.log("error fetching admin status", adminError.message);
          } else {
            console.log(
              `[AuthContext] Admin status for ${logged_in_user.email}:`,
              is_admin,
            );
          }

          if (!profile) {
            console.warn(
              "[AuthContext] Profile missing without error; using default profile for",
              logged_in_user.id,
            );
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
            if (latestAuthUserIdRef.current !== expectedUserId) {
              return;
            }
            setUser({
              ...logged_in_user,
              profile: defaultProfile,
              is_admin: false,
            });
            return;
          }

          // Set user immediately with basic profile data
          // Use functional update to prevent unnecessary re-renders
          setUser((prevUser) => {
            const newUser = {
              ...logged_in_user,
              profile,
              is_admin: is_admin || false,
            };

            // Only update if user ID changed or profile data actually changed
            if (
              prevUser &&
              prevUser.id === newUser.id &&
              prevUser.email === newUser.email &&
              prevUser.is_admin === newUser.is_admin &&
              JSON.stringify(prevUser.profile) === JSON.stringify(profile)
            ) {
              return prevUser; // Return same reference if no change
            }

            return newUser;
          });

          // Update pro status asynchronously (non-blocking) using centralized function
          // Only update if subscription has actually changed to prevent loops
          const currentSubscription = profile.subscription;
          const currentSource = profile.subscription_source;

          // Throttle pro status updates - only update if it's been at least 30 seconds since last update
          const now = Date.now();
          const timeSinceLastUpdate = now - lastProStatusUpdateRef.current;
          const UPDATE_THROTTLE_MS = 30000; // 30 seconds

          // Skip update if we just updated recently (prevent loops)
          // Only update if:
          // 1. Subscription is "none" (new user, needs initial check)
          // 2. No source set (needs initial check)
          // 3. It's been at least 30 seconds since last update
          const shouldUpdateProStatus =
            currentSubscription === "none" ||
            !currentSource ||
            timeSinceLastUpdate > UPDATE_THROTTLE_MS;

          if (shouldUpdateProStatus) {
            lastProStatusUpdateRef.current = now;
            const proExpected = expectedUserId;
            const proUserSnapshot = logged_in_user;
            const proProfileSnapshot = profile;
            const proAdmin = is_admin || false;
            const proCurrSub = currentSubscription;
            const proCurrSource = currentSource;

            void (async () => {
              try {
                const { updateUserProStatus } =
                  await import("@/utils/subscriptions/check-subscription");
                const result = await updateUserProStatus(proUserSnapshot.id);

                if (latestAuthUserIdRef.current !== proExpected) {
                  return;
                }

                if (
                  result.subscription !== proCurrSub ||
                  result.source !== proCurrSource
                ) {
                  const updatedProfile = {
                    ...proProfileSnapshot,
                    subscription: result.subscription,
                    subscription_expiration:
                      result.subscriptionExpiration?.toISOString() || null,
                    subscription_source: result.source,
                  };

                  setUser((prevUser) => {
                    if (
                      prevUser &&
                      prevUser.id === proUserSnapshot.id &&
                      prevUser.profile.subscription === result.subscription &&
                      prevUser.profile.subscription_source === result.source
                    ) {
                      return prevUser;
                    }
                    if (!prevUser || prevUser.id !== proUserSnapshot.id) {
                      return prevUser;
                    }
                    return {
                      ...proUserSnapshot,
                      profile: updatedProfile,
                      is_admin: proAdmin,
                    };
                  });
                }
              } catch (proStatusError) {
                console.log("Pro status update failed:", proStatusError);
              }
            })();
          }
        } else {
          setUser(null);
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        console.log("error updating user from session", errorMessage);
        // 431 or "unexpected response" usually means request headers (cookies) are too large.
        // Do not clear user; suggest clearing site cookies for this origin.
        const isHeaderTooLarge =
          errorMessage.includes("431") ||
          errorMessage.includes("Request Header Fields Too Large") ||
          errorMessage.includes("unexpected response was received");
        if (isHeaderTooLarge) {
          console.warn(
            "[AuthContext] Request failed due to large headers (often too many cookies). " +
              "Clear this site's cookies for localhost (or your dev URL) and reload.",
          );
        }
        // Only set user to null if we have a real auth error, not a profile fetch or header size error
        if (
          !isHeaderTooLarge &&
          (errorMessage.includes("JWT") || errorMessage.includes("auth"))
        ) {
          setUser(null);
        }
      } finally {
        setLoading(false);
        isUpdatingUserRef.current = false;
      }
    };

    // Only run if session actually changed (not just a reference change)
    // Use stable values from session instead of the whole object
    const sessionToken = session?.access_token;
    const sessionUserId = session?.user?.id;

    // Only update if we have a valid session and it's different from current user
    if (sessionToken && sessionUserId) {
      // Check if this is actually a different session than what we have
      const currentUserId = user?.id;
      if (sessionUserId !== currentUserId) {
        void updateUserFromSession(
          sessionUserId,
          session?.user ?? undefined,
          session?.access_token,
        );
      } else {
        // Same user, just refresh if needed (throttled by updateUserFromSession)
        // Don't call updateUserFromSession if user already exists and matches
        setLoading(false);
      }
    } else if (!session) {
      if (!hasReceivedInitialAuthEventRef.current) {
        return;
      }
      // Handle logout case (only after Supabase has reported initial session state)
      setUser(null);
      setLoading(false);
    } else if (!hasReceivedInitialAuthEventRef.current) {
      return;
    } else {
      // Truthy session missing access_token or user id — cannot load a user; unblock the UI
      setUser(null);
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.access_token, session?.user?.id]); // Use stable values instead of whole session object

  // Simple auth state change handler - based on working project
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      hasReceivedInitialAuthEventRef.current = true;
      latestAuthUserIdRef.current = session?.user?.id ?? null;
      setSession(session);

      /**
       * @note Cross-tab: GoTrue may broadcast SIGNED_IN / TOKEN_REFRESHED before this tab’s cookie
       * adapter sees tokens; we re-persist via setSession when needed.
       * @note Must not `await getSession` / `setSession` inside this callback synchronously: GoTrue invokes
       * subscribers while holding the auth lock (e.g. after `updateUser` → USER_UPDATED). Nested lock
       * waits deadlock `updateUser` and leave callers stuck on “loading” forever.
       */
      if (session?.access_token && session.refresh_token) {
        void (async () => {
          try {
            const {
              data: { session: persisted },
            } = await supabase.auth.getSession();
            const needsPersist =
              !persisted?.access_token ||
              persisted.access_token !== session.access_token;
            if (needsPersist) {
              const { error: syncError } = await supabase.auth.setSession({
                access_token: session.access_token,
                refresh_token: session.refresh_token,
              });
              if (syncError) {
                console.warn(
                  "[AuthContext] Session cookie sync failed:",
                  syncError.message,
                );
              }
            }
          } catch (syncErr) {
            console.warn("[AuthContext] Session storage sync error:", syncErr);
          }
        })();
      }

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
   * @brief If GoTrue never emits INITIAL_SESSION, hydrate from storage and unblock the UI.
   * @description Prevents private routes from spinning forever when the auth subscription is delayed or missing.
   * @note Does not run once {@link hasReceivedInitialAuthEventRef} is already true.
   */
  useEffect(() => {
    const fallbackMs = 8000;
    const id = window.setTimeout(async () => {
      if (hasReceivedInitialAuthEventRef.current) {
        return;
      }
      console.warn(
        "[AuthContext] No INITIAL_SESSION within timeout; hydrating from getSession()",
      );
      hasReceivedInitialAuthEventRef.current = true;
      try {
        const {
          data: { session: resolved },
        } = await supabase.auth.getSession();
        latestAuthUserIdRef.current = resolved?.user?.id ?? null;
        setSession(resolved ?? null);
      } catch (err) {
        console.warn("[AuthContext] getSession() fallback failed:", err);
        latestAuthUserIdRef.current = null;
        setSession(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    }, fallbackMs);
    return () => window.clearTimeout(id);
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
    password: string,
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

  // Memoize context value to prevent unnecessary re-renders
  const value = useMemo(
    () => ({
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
    }),
    [user, session, loading, refreshUser],
  );

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
