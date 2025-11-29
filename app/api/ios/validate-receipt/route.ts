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
    console.log("[validate-receipt] Received receipt validation request");
    const body = await request.json();
    const { receiptData, userId, accessToken } = body;

    console.log("[validate-receipt] Request body:", {
      hasReceiptData: !!receiptData,
      receiptDataLength: receiptData?.length || 0,
      hasUserId: !!userId,
      hasAccessToken: !!accessToken
    });

    if (!receiptData) {
      console.log("[validate-receipt] Error: No receipt data provided");
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
    console.log("[validate-receipt] Supabase service role client created");

    // If accessToken is provided, get userId from it
    let resolvedUserId = userId;
    if (!resolvedUserId && accessToken) {
      console.log("[validate-receipt] Resolving userId from accessToken...");
      const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
      if (authError || !user) {
        console.log("[validate-receipt] ERROR - Invalid access token:", authError);
        return NextResponse.json(
          { error: "Invalid access token" },
          { status: 401 }
        );
      }
      resolvedUserId = user.id;
      console.log("[validate-receipt] Resolved userId:", resolvedUserId, "Email:", user.email);
    } else if (resolvedUserId) {
      console.log("[validate-receipt] Using provided userId:", resolvedUserId);
    } else {
      console.log("[validate-receipt] ERROR - No userId or accessToken provided");
    }

    // Validate receipt with Apple
    console.log("[validate-receipt] Starting Apple receipt validation...");
    const validationResult = await validateReceiptWithApple(receiptData);
    console.log("[validate-receipt] Apple validation result:", {
      valid: validationResult.valid,
      error: validationResult.error,
      hasAppleResponse: !!validationResult.appleResponse
    });

    if (!validationResult.valid) {
      console.log("[validate-receipt] ERROR - Apple validation failed:", validationResult.error);
      return NextResponse.json(
        { 
          error: "Receipt validation failed",
          details: validationResult.error 
        },
        { status: 400 }
      );
    }
    
    console.log("[validate-receipt] Apple validation successful, proceeding to extract subscription info...");

    // Extract subscription information from Apple's response
    console.log("Extracting subscription info from Apple response...");
    const subscriptionInfo = extractSubscriptionInfo(validationResult.appleResponse);

    if (!subscriptionInfo) {
      console.log("No valid subscription found in receipt. Apple response:", JSON.stringify(validationResult.appleResponse, null, 2));
      return NextResponse.json(
        { error: "No valid subscription found in receipt" },
        { status: 400 }
      );
    }
    
    console.log("Subscription info extracted:", {
      productId: subscriptionInfo.productId,
      isActive: subscriptionInfo.isActive,
      expiresDate: subscriptionInfo.expiresDate,
      transactionId: subscriptionInfo.transactionId
    });

    // Map iOS product ID to subscription type
    console.log("[validate-receipt] Mapping product ID to subscription type:", subscriptionInfo.productId);
    const subscriptionType = mapProductIdToSubscriptionType(subscriptionInfo.productId);
    console.log("[validate-receipt] Mapped subscription type:", subscriptionType);

    if (subscriptionType === "none") {
      console.log("[validate-receipt] ERROR - Unknown product ID:", subscriptionInfo.productId);
      return NextResponse.json(
        { error: "Unknown product ID: " + subscriptionInfo.productId },
        { status: 400 }
      );
    }

    // Get user's profile
    console.log("[validate-receipt] Fetching user profile for userId:", resolvedUserId);
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", resolvedUserId)
      .single();

    if (profileError || !profile) {
      console.log("[validate-receipt] ERROR - User profile not found:", profileError);
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 404 }
      );
    }
    console.log("[validate-receipt] User profile found:", profile.id);

    // Check if subscription already exists
    console.log("[validate-receipt] Checking for existing subscription with transaction_id:", subscriptionInfo.transactionId);
    const { data: existingSubscription, error: existingError } = await supabase
      .from("ios_subscriptions")
      .select("*")
      .eq("transaction_id", subscriptionInfo.transactionId)
      .single();
    
    if (existingError && existingError.code !== 'PGRST116') { // PGRST116 = not found, which is OK
      console.log("[validate-receipt] ERROR checking existing subscription:", existingError);
    } else if (existingSubscription) {
      console.log("[validate-receipt] Found existing subscription, will update:", existingSubscription.id);
    } else {
      console.log("[validate-receipt] No existing subscription found, will create new one");
    }

    if (existingSubscription) {
      // Update existing subscription
      console.log("[validate-receipt] Updating existing iOS subscription in database...");
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
        console.error("[validate-receipt] ERROR - Failed to update iOS subscription:", updateError);
        return NextResponse.json(
          { error: "Failed to update subscription" },
          { status: 500 }
        );
      }
      console.log("[validate-receipt] Successfully updated iOS subscription in database");
    } else {
      // Create new subscription record
      console.log("[validate-receipt] Creating new iOS subscription in database...");
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
        console.error("[validate-receipt] ERROR - Failed to insert iOS subscription:", insertError);
        return NextResponse.json(
          { error: "Failed to save subscription" },
          { status: 500 }
        );
      }
      console.log("[validate-receipt] Successfully created iOS subscription in database");
    }

    // Update user's profile subscription status
    // Check if user has active iOS subscription
    console.log("[validate-receipt] Checking for active iOS subscriptions for user...");
    const { data: activeSubscription, error: activeSubError } = await supabase
      .from("ios_subscriptions")
      .select("subscription_type, expires_date")
      .eq("user_id", resolvedUserId)
      .eq("is_active", true)
      .eq("validation_status", "valid")
      .gt("expires_date", new Date().toISOString())
      .order("expires_date", { ascending: false })
      .limit(1)
      .single();
    
    if (activeSubError && activeSubError.code !== 'PGRST116') {
      console.log("[validate-receipt] ERROR checking active subscriptions:", activeSubError);
    } else if (activeSubscription) {
      console.log("[validate-receipt] Found active iOS subscription:", activeSubscription);
    } else {
      console.log("[validate-receipt] No active iOS subscription found");
    }

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

    // Update profile with subscription and source
    const { error: profileUpdateError } = await supabase
      .from("profiles")
      .update({
        subscription: finalSubscriptionType,
        subscription_expiration: finalExpiration,
        subscription_source: "ios", // Mark subscription as coming from iOS App Store
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
    console.error("[validate-receipt] ========== EXCEPTION ==========");
    console.error("[validate-receipt] Error validating iOS receipt:", error);
    console.error("[validate-receipt] Error stack:", error instanceof Error ? error.stack : "No stack trace");
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
    // Always try sandbox first for testing, then production if needed
    // Apple error 21007 means receipt is from sandbox but sent to production (or vice versa)
    // Error 21004 means shared secret doesn't match (optional for sandbox)
    const sharedSecret = process.env.APPLE_SHARED_SECRET;

    const validateWithURL = async (url: string, useSecret: boolean = true) => {
      const body: any = {
        "receipt-data": receiptData,
        "exclude-old-transactions": false,
      };
      
      // Only include password if shared secret is available and we want to use it
      // For sandbox testing, shared secret is optional
      if (useSecret && sharedSecret) {
        body.password = sharedSecret;
      }
      
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
      return await response.json();
    };

    // Try sandbox first (for testing)
    // Try with shared secret first if available, then without
    console.log("[validate-receipt] Trying sandbox validation URL first...");
    let result;
    
    if (sharedSecret) {
      console.log("[validate-receipt] Attempting sandbox validation WITH shared secret...");
      result = await validateWithURL("https://sandbox.itunes.apple.com/verifyReceipt", true);
      console.log("[validate-receipt] Sandbox validation (with secret) result status:", result.status);
      
      if (result.status === 0) {
        console.log("[validate-receipt] Receipt validated successfully with sandbox (with shared secret)");
        return { valid: true, appleResponse: result };
      }
      
      // If 21004, try without secret
      if (result.status === 21004) {
        console.log("[validate-receipt] Got 21004 (shared secret mismatch), retrying sandbox WITHOUT secret...");
        result = await validateWithURL("https://sandbox.itunes.apple.com/verifyReceipt", false);
        console.log("[validate-receipt] Sandbox validation (without secret) result status:", result.status);
      }
    } else {
      console.log("[validate-receipt] No shared secret available, trying sandbox WITHOUT secret...");
      result = await validateWithURL("https://sandbox.itunes.apple.com/verifyReceipt", false);
      console.log("[validate-receipt] Sandbox validation (without secret) result status:", result.status);
    }

    // Status 0 = valid receipt
    if (result.status === 0) {
      console.log("[validate-receipt] Receipt validated successfully with sandbox");
      console.log("[validate-receipt] Apple response keys:", Object.keys(result));
      return { valid: true, appleResponse: result };
    }
    
    // Status 21007 = receipt is from production but we tried sandbox
    // Status 21008 = receipt is from sandbox but we tried production
    if (result.status === 21007) {
      // Receipt is from production, try production URL
      console.log("Receipt is from production, trying production URL...");
      result = await validateWithURL("https://buy.itunes.apple.com/verifyReceipt", true);
      if (result.status === 0) {
        console.log("Receipt validated successfully with production");
        return { valid: true, appleResponse: result };
      }
    } else if (result.status === 21008) {
      // Receipt is from sandbox but we tried production, try sandbox
      console.log("Receipt is from sandbox, trying sandbox URL...");
      result = await validateWithURL("https://sandbox.itunes.apple.com/verifyReceipt", false);
      if (result.status === 0) {
        console.log("Receipt validated successfully with sandbox");
        return { valid: true, appleResponse: result };
      }
    }

    console.log("[validate-receipt] Final validation failed with status:", result.status);
    console.log("[validate-receipt] Full Apple response:", JSON.stringify(result, null, 2));
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



