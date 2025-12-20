/**
 * ADMIN/TESTING ENDPOINT ONLY
 * 
 * This endpoint is for testing email templates and sending sample emails.
 * 
 * PRODUCTION EMAILS are sent automatically via:
 * - utils/subscriptions/check-subscription.ts -> updateUserProStatus()
 * - Triggered when subscription changes from "none" to active (trial/subscription/lifetime)
 * 
 * This endpoint should NOT be used in production workflows.
 */

import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/utils/email";
import {
  generateWelcomeEmailHtml,
  generateWelcomeEmailText,
} from "@/utils/email-campaigns/welcome-email";

export async function GET(request: NextRequest) {
  return POST(request);
}

export async function POST(request: NextRequest) {
  // Admin/testing endpoint - sends to test email
  const testEmail = "garrett@cymasphere.com";

  const variations = [
    {
      name: "Monthly Subscription",
      data: {
        customerName: "Ryan Test",
        customerEmail: testEmail,
        purchaseType: "subscription" as const,
        subscriptionType: "monthly" as const,
        planName: "monthly_6",
        isTrial: false,
      },
      subject: "Welcome to Cymasphere - Monthly Subscription",
    },
    {
      name: "Annual Subscription",
      data: {
        customerName: "Ryan Test",
        customerEmail: testEmail,
        purchaseType: "subscription" as const,
        subscriptionType: "annual" as const,
        planName: "annual_59",
        isTrial: false,
      },
      subject: "Welcome to Cymasphere - Annual Subscription",
    },
    {
      name: "Lifetime Purchase",
      data: {
        customerName: "Ryan Test",
        customerEmail: testEmail,
        purchaseType: "lifetime" as const,
        planName: "lifetime_149",
        isTrial: false,
      },
      subject: "Welcome to Cymasphere - Lifetime License",
    },
    {
      name: "Free Trial Start",
      data: {
        customerName: "Ryan Test",
        customerEmail: testEmail,
        purchaseType: "subscription" as const,
        subscriptionType: "monthly" as const,
        planName: "monthly_6",
        isTrial: true,
        trialEndDate: new Date(
          Date.now() + 7 * 24 * 60 * 60 * 1000
        ).toISOString(), // 7 days from now
        trialDays: 7,
      },
      subject: "Welcome to Cymasphere - Free Trial Started",
    },
    {
      name: "Elite Access (NFR)",
      data: {
        customerName: "Ryan Test",
        customerEmail: testEmail,
        purchaseType: "elite" as const,
        planName: "elite",
        isTrial: false,
      },
      subject: "Welcome to Cymasphere - Elite Access",
    },
  ];

  const results = [];

  for (const variation of variations) {
    try {
      const html = generateWelcomeEmailHtml(variation.data);
      const text = generateWelcomeEmailText(variation.data);

      const result = await sendEmail({
        to: testEmail,
        subject: variation.subject,
        html: html,
        text: text,
        from: "Cymasphere <support@cymasphere.com>",
      });

      results.push({
        name: variation.name,
        success: result.success,
        messageId: result.messageId,
        error: result.error,
      });
    } catch (error) {
      results.push({
        name: variation.name,
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }

    // Small delay between emails
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  return NextResponse.json({
    success: true,
    message: "All email variations sent",
    results,
  });
}

