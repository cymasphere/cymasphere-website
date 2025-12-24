/**
 * @fileoverview User registration API endpoint
 * 
 * This endpoint handles new user registration with email and password.
 * Creates a new user account in Supabase Auth, populates user metadata with
 * name information, and automatically creates a subscriber record for email
 * campaigns. Supports both combined name format and separate first_name/last_name
 * fields (for JUCE mobile app compatibility).
 * 
 * @module api/auth/register
 */

"use server";

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * @brief POST endpoint to register a new user account
 * 
 * Creates a new user account with email and password authentication. The user
 * will receive an email verification link. User metadata (first_name, last_name)
 * is stored in auth and automatically copied to the profiles table via database trigger.
 * A subscriber record is also created for email marketing purposes.
 * 
 * Request body (FormData):
 * - email: User's email address (required)
 * - password: User's password (required)
 * - name: Combined full name (optional, legacy format)
 * - first_name: User's first name (optional, preferred for JUCE app)
 * - last_name: User's last name (optional, preferred for JUCE app)
 * 
 * Responses:
 * 
 * 200 OK - Success:
 * ```json
 * {
 *   "success": true,
 *   "message": "Registration successful! Please check your email to verify your account.",
 *   "user": {
 *     "id": "uuid",
 *     "email": "user@example.com",
 *     "created_at": "2024-01-01T00:00:00.000Z"
 *   }
 * }
 * ```
 * 
 * 400 Bad Request - Missing email:
 * ```json
 * {
 *   "success": false,
 *   "error": "Email is required"
 * }
 * ```
 * 
 * 400 Bad Request - Missing password:
 * ```json
 * {
 *   "success": false,
 *   "error": "Password is required"
 * }
 * ```
 * 
 * 400 Bad Request - Auth error:
 * ```json
 * {
 *   "success": false,
 *   "error": "User already registered"
 * }
 * ```
 * 
 * 500 Internal Server Error - Unexpected error:
 * ```json
 * {
 *   "success": false,
 *   "error": "An unexpected error occurred during registration"
 * }
 * ```
 * 
 * @param request Next.js request object containing FormData with registration details
 * @returns NextResponse with success status, user data, or error message
 * @note User must verify email before they can log in
 * @note Subscriber creation failure does not block registration
 * @note Name parsing: If first_name/last_name provided, use those. Otherwise split combined name or use email prefix.
 * 
 * @example
 * ```typescript
 * // POST /api/auth/register
 * // FormData: { email: "user@example.com", password: "securepassword", first_name: "John", last_name: "Doe" }
 * // Returns: { success: true, message: "...", user: {...} }
 * ```
 */
export async function POST(request: NextRequest) {
  try {
    // Parse form data from request body
    const data = await request.formData();
    const email = data.get("email")?.toString();
    const password = data.get("password")?.toString();
    const name = data.get("name")?.toString();
    // Support separate first_name and last_name fields (from JUCE mobile app)
    const first_name_param = data.get("first_name")?.toString();
    const last_name_param = data.get("last_name")?.toString();

    // Validate required email field
    if (!email) {
      return NextResponse.json(
        {
          success: false,
          error: "Email is required",
        },
        { status: 400 }
      );
    }

    // Validate required password field
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
    // Priority: 1) separate first_name/last_name, 2) combined name, 3) email prefix
    let firstName: string;
    let lastName: string;
    
    if (first_name_param || last_name_param) {
      // Use separate first_name and last_name if provided (preferred format from JUCE app)
      firstName = first_name_param || '';
      lastName = last_name_param || '';
    } else if (name) {
      // Split combined name (legacy format from web signup)
      // First word is first name, rest is last name
      firstName = name.split(' ')[0] || '';
      lastName = name.split(' ').slice(1).join(' ') || '';
    } else {
      // Fallback to email prefix as first name if no name provided
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
    // can automatically copy these values to the profiles table
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

    // Return error if user registration failed
    if (authError) {
      return NextResponse.json(
        {
          success: false,
          error: authError.message,
        },
        { status: 400 }
      );
    }

    // Create subscriber record for email marketing campaigns
    // Note: first_name and last_name are now passed in user_metadata (options.data)
    // so the database trigger should automatically populate them in the profiles table
    if (authData.user) {
      // Create subscriber record in subscribers table
      // This is separate from the auth user and profile, used for email campaigns
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
          // User account is more important than subscriber record
        } else {
          console.log('Subscriber created successfully for user:', authData.user.id);
        }
      } catch (subscriberError) {
        console.error('Error creating subscriber:', subscriberError);
        // Don't fail the signup if subscriber creation fails
        // Continue with successful registration response
      }
    }

    // Return success response with user data
    return NextResponse.json({
      success: true,
      message:
        "Registration successful! Please check your email to verify your account.",
      user: authData.user,
    });
  } catch {
    // Catch any unexpected errors and return generic error
    return NextResponse.json(
      {
        success: false,
        error: "An unexpected error occurred during registration",
      },
      { status: 500 }
    );
  }
}
