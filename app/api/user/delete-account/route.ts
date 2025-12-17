import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createSupabaseServiceRole } from "@/utils/supabase/service";
import Stripe from "stripe";

/**
 * DELETE /api/user/delete-account
 *
 * Deletes the authenticated user's account.
 * Admins can delete any user by passing ?userId=xxx query parameter.
 *
 * Security:
 * - Requires authentication
 * - Regular users can only delete their own account
 * - Admins can delete any user's account
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get the authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 }
      );
    }

    // Check if a specific userId was provided (admin functionality)
    const { searchParams } = new URL(request.url);
    const targetUserId = searchParams.get("userId");

    let userIdToDelete = user.id;

    // If a specific userId was provided, verify the requester is an admin
    if (targetUserId && targetUserId !== user.id) {
      // Check if current user is admin
      const { data: adminCheck, error: adminError } = await supabase
        .from("admins")
        .select("*")
        .eq("user", user.id)
        .single();

      const isAdmin = !adminError && !!adminCheck;

      if (!isAdmin) {
        return NextResponse.json(
          {
            success: false,
            error: "Unauthorized. Only admins can delete other users.",
          },
          { status: 403 }
        );
      }

      userIdToDelete = targetUserId;
    }

    // Use service role for the actual deletion
    const serviceSupabase = await createSupabaseServiceRole();

    // Get the Stripe customer ID from the profiles table
    const { data: profile, error: profileError } = await serviceSupabase
      .from("profiles")
      .select("customer_id")
      .eq("id", userIdToDelete)
      .single();

    if (profileError) {
      console.error("Error fetching profile:", profileError);
      return NextResponse.json(
        { success: false, error: "Could not find user profile" },
        { status: 404 }
      );
    }

    const stripeCustomerId = profile?.customer_id;

    // Cancel any active Stripe subscriptions
    if (stripeCustomerId) {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

      try {
        // Get all subscriptions for this customer
        const subscriptions = await stripe.subscriptions.list({
          customer: stripeCustomerId,
          status: "all",
        });

        // Cancel all subscriptions that aren't already canceled
        for (const subscription of subscriptions.data) {
          if (subscription.status !== "canceled") {
            await stripe.subscriptions.cancel(subscription.id);
            console.log(
              `Canceled subscription: ${subscription.id} for customer: ${stripeCustomerId}`
            );
          }
        }
      } catch (stripeError) {
        console.error("Error canceling subscriptions:", stripeError);
        return NextResponse.json(
          {
            success: false,
            error: "Failed to cancel subscription. Account deletion aborted.",
          },
          { status: 500 }
        );
      }
    }

    // Delete the user from Supabase
    const { error: deleteError } = await serviceSupabase.auth.admin.deleteUser(
      userIdToDelete
    );

    if (deleteError) {
      console.error("Error deleting user:", deleteError);
      return NextResponse.json(
        { success: false, error: "Failed to delete user account" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in delete account API:", error);
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
