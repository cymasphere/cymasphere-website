import { NextRequest, NextResponse } from "next/server";
import { checkCustomerTrialStatus } from "@/utils/stripe/actions";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email }: { email: string } = body;

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const result = await checkCustomerTrialStatus(email);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error checking trial status:", error);
    return NextResponse.json(
      {
        hasHadTrial: false,
        customerId: null,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
