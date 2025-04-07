"use server";

import { NextResponse, type NextRequest } from "next/server";

import { Profile } from "@/utils/supabase/types";
import { createClient } from "@/utils/supabase/server";
import { updateStripe } from "@/utils/supabase/actions";
import { isBuildTime, buildAuthResponse } from "@/utils/build-time-skip";

// Next.js route configuration - export objects instead of function properties
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const fetchCache = 'force-no-store';

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

// Function to return a mock response for build time
function getMockResponse(): NextResponse<LoginResponse> {
  console.log('Login API: Using mock response for build');
  return NextResponse.json({
    user: null,
    access_token: null,
    refresh_token: null,
    expires_at: null,
    error: { code: "mock_build", message: "This is a mock response during build" }
  });
}

// The GET handler
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    user: null,
    access_token: null,
    refresh_token: null,
    expires_at: null,
    error: { code: "build_mock", message: "Static export for build process" }
  });
}

// The main POST handler function
export async function POST(
  request: NextRequest
): Promise<NextResponse<LoginResponse>> {
  // If in build mode, return mock response without initializing Supabase
  if (isBuildTime || process.env.NEXT_SUPABASE_MOCK === 'true') {
    console.log('Login API: Build time detected, returning mock response');
    return getMockResponse();
  }

  try {
    // Initialize Supabase inside the request handler (only at runtime)
    const supabase = await createClient();
    
    // Check if Supabase client is properly initialized
    if (!supabase) {
      return err(
        "supabase_not_initialized",
        "Authentication service is not available"
      );
    }

    const body = await request.formData();

    const email = body.get("email")?.toString();
    const password = body.get("password")?.toString();

    if (!email || !password)
      return err(
        "invalid_credentials",
        "email and password fields are required"
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
    console.error('Login error:', error);
    return err("unexpected_failure", "An unexpected error occured");
  }
}
