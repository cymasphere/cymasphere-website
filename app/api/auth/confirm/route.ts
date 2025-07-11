"use server";

import { type EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest } from "next/server";

import { createSupabaseServer } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  if (token_hash && type) {
    const supabase = await createSupabaseServer();

    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    });

    if (!error) {
      // Check the OTP type to determine where to redirect
      if (type === "recovery") {
        // Password reset flow - redirect to create-password page
        redirect("/create-password");
      } else {
        // Other types (signup confirmation, etc.) - redirect to dashboard
        redirect("/dashboard");
      }
    } else {
      // If there's an error, redirect to create-password with error parameters
      const errorParams = new URLSearchParams({
        error: "true",
        error_code: error.code || "unknown",
        error_description: error.message || "An error occurred",
      });
      redirect(`/create-password?${errorParams.toString()}`);
    }
  }

  // redirect the user to an error page with some instructions
  redirect("/error");
}
