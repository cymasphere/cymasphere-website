"use server";

import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { Profile } from "@/utils/supabase/types";
import { updateStripe } from "@/utils/supabase/actions";

interface ProfileWithEmail extends Profile {
  email: string;
}

type UserResponse = {
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
): NextResponse<UserResponse> => {
  return NextResponse.json({
    user,
    access_token,
    refresh_token,
    expires_at,
    error: null,
  });
};

const err = (code: string, message: string): NextResponse<UserResponse> => {
  return NextResponse.json({
    user: null,
    access_token: null,
    refresh_token: null,
    expires_at: null,
    error: { code, message },
  });
};

const supabase = createServerClient(
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
  }
);

export async function POST(
  request: NextRequest
): Promise<NextResponse<UserResponse>> {
  try {
    const body = await request.formData();
    const access_token = body.get("access_token")?.toString();
    const refresh_token = body.get("refresh_token")?.toString();

    if (!access_token || !refresh_token)
      return err(
        "invalid_token",
        "access_token and refresh_token are required"
      );

    // First try to use the existing session
    let session;
    let user;
    let error;

    // Set the session in supabase
    const { error: setSessionError } = await supabase.auth.setSession({
      access_token,
      refresh_token,
    });

    if (setSessionError) {
      // If setting session failed, try to refresh
      const refreshResult = await supabase.auth.refreshSession({
        refresh_token,
      });

      user = refreshResult.data.user;
      session = refreshResult.data.session;
      error = refreshResult.error;
    } else {
      // Get current user with the set session
      const { data, error: getUserError } = await supabase.auth.getUser();
      user = data.user;

      // Get current session
      const { data: sessionData } = await supabase.auth.getSession();
      session = sessionData.session;
      error = getUserError;
    }

    // Handle error in getting user/session
    if (error) {
      return err(error.code as string, error.message);
    }

    // Proceed if we have user and session
    if (session && user && user.email) {
      const { data: profile, error: profile_error } = await supabase
        .from("profiles")
        .select()
        .eq("id", user.id)
        .single();

      if (profile_error) {
        return err(profile_error.code, profile_error.message);
      }

      if (profile) {
        // Check authorization from all sources (NFR, Stripe, iOS)
        try {
          const { checkUnifiedAuthorization } = await import("@/utils/subscriptions/unified-auth-check");
          const authResult = await checkUnifiedAuthorization(user.id, user.email!);

          // Use the unified auth check result (it already updates the profile)
          const finalProfile = {
            ...profile,
            subscription: authResult.subscription,
            subscription_expiration: authResult.subscriptionExpiration?.toISOString() || null,
            email: user.email,
          };

          console.log(`Token refresh: User ${user.email} authorized via ${authResult.source}: ${authResult.subscription}`);

          return ok(
            finalProfile,
            session.access_token,
            session.refresh_token,
            session.expires_at || null
          );
        } catch (error) {
          console.error("Error checking unified authorization:", error);
          // Continue with original profile if auth check fails
        }

        return ok(
          { ...profile, email: user.email },
          session.access_token,
          session.refresh_token,
          session.expires_at || null
        );
      }
    }

    return err("unexpected_failure", "An unexpected error occurred");
  } catch (error) {
    console.error(error);
    return err("unexpected_failure", "An unexpected error occurred");
  }
}
