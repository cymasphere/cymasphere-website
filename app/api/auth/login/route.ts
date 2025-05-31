"use server";

import { NextResponse, type NextRequest } from "next/server";

import { Profile } from "@/utils/supabase/types";
import { createServerClient } from "@supabase/ssr";
import { updateStripe } from "@/utils/supabase/actions";
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

    console.log("clientIp", clientIp);
    console.log("userAgent", userAgent);

    // Reject login attempts not from the Cymasphere app
    if (!userAgent || !userAgent.startsWith("cymasphere:")) {
      return err("invalid_credentials", "Invalid credentials");
    }

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
        console.error("Error fetching user sessions:", sessionsError);
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
        // Check and update Stripe subscription status
        try {
          const { success, profile: updatedProfile } = await updateStripe(
            user.email!,
            profile
          );

          if (success && updatedProfile) {
            // Use the updated profile from Stripe check
            return ok(
              { ...updatedProfile, email: user.email },
              session.access_token,
              session.refresh_token,
              session.expires_at || null
            );
          }
        } catch (stripeError) {
          console.error("Error updating Stripe data:", stripeError);
          // Continue with original profile if Stripe update fails
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
  } catch (error) {
    console.log(error);
    return err("unexpected_failure", "An unexpected error occured");
  }
}
