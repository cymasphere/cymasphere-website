"use server";

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const data = await request.formData();
    const email = data.get("email")?.toString();
    const password = data.get("password")?.toString();
    const name = data.get("name")?.toString();

    // Validate inputs
    if (!email) {
      return NextResponse.json(
        {
          success: false,
          error: "Email is required",
        },
        { status: 400 }
      );
    }

    if (!password) {
      return NextResponse.json(
        {
          success: false,
          error: "Password is required",
        },
        { status: 400 }
      );
    }

    // Initialize Supabase client directly with environment variables
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Register the user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name || email.split("@")[0],
        },
      },
    });

    if (authError) {
      return NextResponse.json(
        {
          success: false,
          error: authError.message,
        },
        { status: 400 }
      );
    }

    // Create subscriber for the new user
    if (authData.user) {
      try {
        const { error: subscriberError } = await supabase
          .from('subscribers')
          .insert({
            id: authData.user.id,
            user_id: authData.user.id,
            email: authData.user.email,
            source: 'signup',
            status: 'active',
            tags: ['free-user'],
            metadata: {
              first_name: name?.split(' ')[0] || '',
              last_name: name?.split(' ').slice(1).join(' ') || '',
              subscription: 'none',
              auth_created_at: authData.user.created_at,
              profile_updated_at: new Date().toISOString()
            }
          });

        if (subscriberError) {
          console.error('Failed to create subscriber:', subscriberError);
          // Don't fail the signup if subscriber creation fails
        } else {
          console.log('Subscriber created successfully for user:', authData.user.id);
        }
      } catch (subscriberError) {
        console.error('Error creating subscriber:', subscriberError);
        // Don't fail the signup if subscriber creation fails
      }
    }

    // Return success response
    return NextResponse.json({
      success: true,
      message:
        "Registration successful! Please check your email to verify your account.",
      user: authData.user,
    });
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: "An unexpected error occurred during registration",
      },
      { status: 500 }
    );
  }
}
