"use server";

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServiceRole } from "@/utils/supabase/service";

/**
 * Validates an iOS receipt with Apple's App Store and syncs subscription to Supabase
 * 
 * This endpoint:
 * 1. Validates the receipt with Apple's App Store API
 * 2. Extracts subscription information
 * 3. Maps iOS product IDs to subscription types
 * 4. Stores/updates the subscription in Supabase
 * 5. Updates the user's profile with subscription status
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { receiptData, userId, accessToken } = body;

    if (!receiptData) {
      return NextResponse.json(
        { error: "Receipt data is required" },
        { status: 400 }
      );
    }

    if (!userId && !accessToken) {
      return NextResponse.json(
        { error: "Either userId or accessToken is required" },
        { status: 400 }
      );
    }

    const supabase = await createSupabaseServiceRole();

    // If accessToken is provided, get userId from it
    let resolvedUserId = userId;
    if (!resolvedUserId && accessToken) {
      const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
      if (authError || !user) {
        return NextResponse.json(
          { error: "Invalid access token" },
          { status: 401 }
        );
      }
      resolvedUserId = user.id;
    }

    // Validate receipt with Apple
    const validationResult = await validateReceiptWithApple(receiptData);

    if (!validationResult.valid) {
      return NextResponse.json(
        { 
          error: "Receipt validation failed",
          details: validationResult.error 
        },
        { status: 400 }
      );
    }

    // Extract subscription information from Apple's response
    const subscriptionInfo = extractSubscriptionInfo(validationResult.appleResponse);

    if (!subscriptionInfo) {
      return NextResponse.json(
        { error: "No valid subscription found in receipt" },
        { status: 400 }
      );
    }

    // Map iOS product ID to subscription type
    const subscriptionType = mapProductIdToSubscriptionType(subscriptionInfo.productId);

    if (subscriptionType === "none") {
      return NextResponse.json(
        { error: "Unknown product ID: " + subscriptionInfo.productId },
        { status: 400 }
      );
    }

    // Get user's profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", resolvedUserId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 404 }
      );
    }

    // Check if subscription already exists
    const { data: existingSubscription } = await supabase
      .from("ios_subscriptions")
      .select("*")
      .eq("transaction_id", subscriptionInfo.transactionId)
      .single();

    if (existingSubscription) {
      // Update existing subscription
      const { error: updateError } = await supabase
        .from("ios_subscriptions")
        .update({
          subscription_type: subscriptionType,
          expires_date: subscriptionInfo.expiresDate.toISOString(),
          receipt_data: receiptData,
          receipt_validated_at: new Date().toISOString(),
          validation_status: "valid",
          apple_validation_response: validationResult.appleResponse,
          is_active: subscriptionInfo.isActive,
          auto_renew_status: subscriptionInfo.autoRenewStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("transaction_id", subscriptionInfo.transactionId);

      if (updateError) {
        console.error("Error updating iOS subscription:", updateError);
        return NextResponse.json(
          { error: "Failed to update subscription" },
          { status: 500 }
        );
      }
    } else {
      // Create new subscription record
      const { error: insertError } = await supabase
        .from("ios_subscriptions")
        .insert({
          user_id: resolvedUserId,
          profile_id: profile.id,
          transaction_id: subscriptionInfo.transactionId,
          original_transaction_id: subscriptionInfo.originalTransactionId,
          product_id: subscriptionInfo.productId,
          subscription_type: subscriptionType,
          purchase_date: subscriptionInfo.purchaseDate.toISOString(),
          expires_date: subscriptionInfo.expiresDate.toISOString(),
          receipt_data: receiptData,
          receipt_validated_at: new Date().toISOString(),
          validation_status: "valid",
          apple_validation_response: validationResult.appleResponse,
          is_active: subscriptionInfo.isActive,
          auto_renew_status: subscriptionInfo.autoRenewStatus,
        });

      if (insertError) {
        console.error("Error inserting iOS subscription:", insertError);
        return NextResponse.json(
          { error: "Failed to save subscription" },
          { status: 500 }
        );
      }
    }

    // Update user's profile subscription status
    // Check if user has active iOS subscription
    const { data: activeSubscription } = await supabase
      .from("ios_subscriptions")
      .select("subscription_type, expires_date")
      .eq("user_id", resolvedUserId)
      .eq("is_active", true)
      .eq("validation_status", "valid")
      .gt("expires_date", new Date().toISOString())
      .order("expires_date", { ascending: false })
      .limit(1)
      .single();

    // Also check Stripe subscription
    const { data: profileWithStripe } = await supabase
      .from("profiles")
      .select("customer_id")
      .eq("id", resolvedUserId)
      .single();

    let finalSubscriptionType: "none" | "monthly" | "annual" | "lifetime" = "none";
    let finalExpiration: string | null = null;

    if (activeSubscription) {
      finalSubscriptionType = activeSubscription.subscription_type;
      finalExpiration = activeSubscription.expires_date;
    } else if (profileWithStripe?.customer_id) {
      // Check Stripe subscription (import from existing utility)
      const { customerPurchasedProFromSupabase } = await import("@/utils/stripe/supabase-stripe");
      const stripeResult = await customerPurchasedProFromSupabase(profileWithStripe.customer_id);
      
      if (stripeResult.success && stripeResult.subscription !== "none") {
        finalSubscriptionType = stripeResult.subscription;
        if (stripeResult.subscription_expiration) {
          finalExpiration = stripeResult.subscription_expiration.toISOString();
        }
      }
    }

    // Update profile
    const { error: profileUpdateError } = await supabase
      .from("profiles")
      .update({
        subscription: finalSubscriptionType,
        subscription_expiration: finalExpiration,
      })
      .eq("id", resolvedUserId);

    if (profileUpdateError) {
      console.error("Error updating profile subscription:", profileUpdateError);
      // Don't fail the request, subscription is saved
    }

    return NextResponse.json({
      success: true,
      subscription: {
        type: subscriptionType,
        expiresDate: subscriptionInfo.expiresDate.toISOString(),
        isActive: subscriptionInfo.isActive,
        transactionId: subscriptionInfo.transactionId,
      },
    });
  } catch (error) {
    console.error("Error validating iOS receipt:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

/**
 * Validates receipt with Apple's App Store
 */
async function validateReceiptWithApple(receiptData: string): Promise<{
  valid: boolean;
  appleResponse?: any;
  error?: string;
}> {
  try {
    // Use sandbox URL for testing, production URL for production
    const isProduction = process.env.NODE_ENV === "production";
    const validationURL = isProduction
      ? "https://buy.itunes.apple.com/verifyReceipt"
      : "https://sandbox.itunes.apple.com/verifyReceipt";

    const sharedSecret = process.env.APPLE_SHARED_SECRET;
    if (!sharedSecret) {
      console.error("APPLE_SHARED_SECRET not configured");
      return { valid: false, error: "Apple shared secret not configured" };
    }

    const response = await fetch(validationURL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        "receipt-data": receiptData,
        password: sharedSecret,
        "exclude-old-transactions": false,
      }),
    });

    const result = await response.json();

    // Status 0 = valid receipt
    // Status 21007 = receipt is from sandbox but we're using production URL (or vice versa)
    if (result.status === 0) {
      return { valid: true, appleResponse: result };
    } else if (result.status === 21007 && !isProduction) {
      // Retry with sandbox URL
      const sandboxResponse = await fetch(
        "https://sandbox.itunes.apple.com/verifyReceipt",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            "receipt-data": receiptData,
            password: sharedSecret,
            "exclude-old-transactions": false,
          }),
        }
      );
      const sandboxResult = await sandboxResponse.json();
      if (sandboxResult.status === 0) {
        return { valid: true, appleResponse: sandboxResult };
      }
    }

    return {
      valid: false,
      error: `Apple validation failed with status: ${result.status}`,
      appleResponse: result,
    };
  } catch (error) {
    console.error("Error validating with Apple:", error);
    return {
      valid: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Extracts subscription information from Apple's validation response
 */
function extractSubscriptionInfo(appleResponse: any): {
  transactionId: string;
  originalTransactionId: string;
  productId: string;
  purchaseDate: Date;
  expiresDate: Date;
  isActive: boolean;
  autoRenewStatus: boolean;
} | null {
  try {
    const receipt = appleResponse.receipt;
    if (!receipt || !receipt.in_app || receipt.in_app.length === 0) {
      return null;
    }

    // Get the latest transaction (most recent purchase)
    const latestTransaction = receipt.in_app[receipt.in_app.length - 1];

    // Get subscription info from latest_receipt_info if available (for subscriptions)
    const latestReceiptInfo = appleResponse.latest_receipt_info;
    let subscriptionTransaction = latestTransaction;

    if (latestReceiptInfo && latestReceiptInfo.length > 0) {
      // Get the most recent subscription transaction
      subscriptionTransaction = latestReceiptInfo.reduce((latest: any, current: any) => {
        const latestTime = parseInt(latest.expires_date_ms || "0");
        const currentTime = parseInt(current.expires_date_ms || "0");
        return currentTime > latestTime ? current : latest;
      });
    }

    const transactionId = subscriptionTransaction.transaction_id;
    const originalTransactionId =
      subscriptionTransaction.original_transaction_id || transactionId;
    const productId = subscriptionTransaction.product_id;

    // Parse dates (Apple provides timestamps in milliseconds)
    const purchaseDateMs = parseInt(subscriptionTransaction.purchase_date_ms || "0");
    const expiresDateMs = parseInt(
      subscriptionTransaction.expires_date_ms || subscriptionTransaction.purchase_date_ms || "0"
    );

    const purchaseDate = new Date(purchaseDateMs);
    const expiresDate = new Date(expiresDateMs);

    // Check if subscription is active (not expired)
    const now = new Date();
    const isActive = expiresDate > now;

    // Get auto-renew status from pending_renewal_info
    const pendingRenewal = appleResponse.pending_renewal_info?.find(
      (info: any) => info.original_transaction_id === originalTransactionId
    );
    const autoRenewStatus = pendingRenewal?.auto_renew_status === "1";

    return {
      transactionId,
      originalTransactionId,
      productId,
      purchaseDate,
      expiresDate,
      isActive,
      autoRenewStatus,
    };
  } catch (error) {
    console.error("Error extracting subscription info:", error);
    return null;
  }
}

/**
 * Maps iOS product ID to subscription type
 */
function mapProductIdToSubscriptionType(
  productId: string
): "none" | "monthly" | "annual" | "lifetime" {
  // Map based on your App Store Connect product IDs
  const productIdMap: Record<string, "monthly" | "annual" | "lifetime"> = {
    "com.NNAudio.Cymasphere.basic": "lifetime", // Assuming basic is lifetime
    "com.NNAudio.Cymasphere.monthly.plan": "monthly",
    "com.NNAudio.Cymasphere.annual.plan": "annual",
  };

  return productIdMap[productId] || "none";
}

