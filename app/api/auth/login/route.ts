"use server";

import { NextResponse, type NextRequest } from "next/server";

import { Profile } from "@/utils/supabase/types";
import { createServerClient } from "@supabase/ssr";
import { Database } from "@/database.types";

interface ProfileWithEmail extends Profile {
  email: string;
}

type LoginResponse = {
  user: ProfileWithEmail | null;
  access_token: string | null;
  refresh_token: string | null;
  expires_at: number | null;
  error: { code: string; message: string } | null;
};

const ok = (
  user: ProfileWithEmail,
  access_token: string,
  refresh_token: string,
  expires_at: number | null
): NextResponse<LoginResponse> => {
  return NextResponse.json({
    user,
    access_token,
    refresh_token,
    expires_at,
    error: null,
  });
};

const err = (code: string, message: string): NextResponse<LoginResponse> => {
  return NextResponse.json({
    user: null,
    access_token: null,
    refresh_token: null,
    expires_at: null,
    error: { code, message },
  });
};

export async function POST(
  request: NextRequest
): Promise<NextResponse<LoginResponse>> {
  try {
    const body = await request.formData();

    const email = body.get("email")?.toString();
    const password = body.get("password")?.toString();

    if (!email || !password)
      return err(
        "invalid_credentials",
        "email and password fields are required"
      );

    // Extract client IP and device info from request headers for security tracking
    const clientIp =
      request.headers.get("x-forwarded-for")?.split(",")[0] ||
      request.headers.get("x-real-ip");
    const userAgent = request.headers.get("user-agent");

    // Allow both Cymasphere app and web browser user agents
    if (!userAgent) {
      return err("invalid_credentials", "Invalid credentials");
    }

    // Allow both web browsers (for web app) and Cymasphere app (for mobile)

    const allHeaders: Record<string, string> = {};
    if (clientIp) {
      allHeaders["X-Forwarded-For"] = clientIp;
    }
    if (userAgent) {
      allHeaders["User-Agent"] = userAgent;
    }

    // Add all headers to the request for Supabase to use
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return [];
          },
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          setAll(_cookiesToSet) {},
        },
        global: {
          headers: allHeaders,
        },
      }
    );

    const {
      data: { user, session },
      error,
    } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return err(error.code as string, error.message);
    }

    if (session && user && user.email) {
      // Check for maximum devices
      const { data: userSessions, error: sessionsError } = await supabase
        .from("user_sessions")
        .select("*")
        .eq("user_id", user.id);

      if (sessionsError) {
        // Handle session fetch error silently
      } else {
        // Count sessions with user agent starting with "cymasphere:"
        const cymasphereUserAgents =
          userSessions
            ?.filter(
              (session) =>
                session.user_agent &&
                session.user_agent.startsWith("cymasphere:")
            )
            .map((session) => session.user_agent) || [];

        // Get unique user agents to count unique devices
        const uniqueUserAgents = [...new Set(cymasphereUserAgents)];
        const deviceCount = uniqueUserAgents.length;

        // If device count exceeds limit, sign out and return error
        if (deviceCount > 3) {
          await supabase.auth.signOut();
          return err(
            "maximum_devices",
            "Maximum number of devices already logged in"
          );
        }
      }

      const { data: profile, error: profile_error } = await supabase
        .from("profiles")
        .select()
        .eq("id", user.id)
        .single();

      if (profile_error) {
        return err(profile_error.code, profile_error.message);
      }

      if (profile) {
        // Check and update subscription status (NFR, Stripe, and iOS)
        try {
          // Use centralized function that handles NFR, Stripe, and iOS
          const { updateUserProStatus } = await import(
            "@/utils/subscriptions/check-subscription"
          );
          const subscriptionCheck = await updateUserProStatus(user.id);

          console.log(`[Login] Subscription check for ${user.email}:`, {
            subscription: subscriptionCheck.subscription,
            source: subscriptionCheck.source,
            expiration: subscriptionCheck.subscriptionExpiration,
          });

          // Update profile with subscription info
          const finalProfileWithSubscription = {
            ...profile,
            subscription: subscriptionCheck.subscription,
            subscription_expiration:
              subscriptionCheck.subscriptionExpiration?.toISOString() || null,
            subscription_source: subscriptionCheck.source,
            email: user.email,
          };

          console.log(
            `[Login] Returning profile with subscription: ${finalProfileWithSubscription.subscription}`
          );

          return ok(
            finalProfileWithSubscription,
            session.access_token,
            session.refresh_token,
            session.expires_at || null
          );
        } catch (error) {
          console.error("[Login] Error checking subscription:", error);
          // Continue with original profile if subscription check fails
        }

        return ok(
          { ...profile, email: user.email },
          session.access_token,
          session.refresh_token,
          session.expires_at || null
        );
      }
    }

    return err("unexpected_failure", "An unexpected error occured");
  } catch {
    return err("unexpected_failure", "An unexpected error occured");
  }
}
