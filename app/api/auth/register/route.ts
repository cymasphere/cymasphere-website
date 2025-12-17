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
    // Support separate first_name and last_name fields (from JUCE app)
    const first_name_param = data.get("first_name")?.toString();
    const last_name_param = data.get("last_name")?.toString();

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

    // Determine first_name and last_name from either separate params or combined name
    let firstName: string;
    let lastName: string;
    
    if (first_name_param || last_name_param) {
      // Use separate first_name and last_name if provided (from JUCE app)
      firstName = first_name_param || '';
      lastName = last_name_param || '';
    } else if (name) {
      // Split combined name (legacy format)
      firstName = name.split(' ')[0] || '';
      lastName = name.split(' ').slice(1).join(' ') || '';
    } else {
      // Fallback to email prefix
      firstName = email.split("@")[0];
      lastName = '';
    }

    // Initialize Supabase client directly with environment variables
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Register the user with first_name and last_name in user_metadata
    // This matches how signUpWithStripe works, ensuring the database trigger
    // can copy these values to the profiles table
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
          name: `${firstName} ${lastName}`.trim() || email.split("@")[0],
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
    // Note: first_name and last_name are now passed in user_metadata (options.data)
    // so the database trigger should automatically populate them in the profiles table
    if (authData.user) {
      // Create subscriber record
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
              first_name: firstName,
              last_name: lastName,
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
