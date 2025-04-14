"use server";

import { NextResponse, type NextRequest } from "next/server";
import { createClient } from '@supabase/supabase-js';
import { updateStripe } from "@/utils/supabase/actions";

interface ProfileWithEmail {
  id: string;
  email: string;
  [key: string]: any;
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

    // Initialize Supabase client directly with environment variables
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
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
            user.email,
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

    return err("unexpected_failure", "An unexpected error occurred");
  } catch (error) {
    console.error("Unexpected error during login:", error);
    return err("unexpected_failure", "An unexpected error occurred");
  }
}
