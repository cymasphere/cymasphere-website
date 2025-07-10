import { NextRequest, NextResponse } from "next/server";

// Dynamically import scheduler to avoid client-side bundling
async function getEmailScheduler() {
  const { emailScheduler } = await import("@/utils/scheduler");
  return emailScheduler;
}

// GET /api/scheduler - Get scheduler status
export async function GET() {
  try {
    const emailScheduler = await getEmailScheduler();
    const status = emailScheduler.getStatus();

    return NextResponse.json({
      success: true,
      scheduler: {
        ...status,
        lastCheck: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Error getting scheduler status:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to get scheduler status",
      },
      { status: 500 }
    );
  }
}

// POST /api/scheduler - Control scheduler actions
export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json();
    const emailScheduler = await getEmailScheduler();

    switch (action) {
      case "start":
        emailScheduler.start();
        return NextResponse.json({
          success: true,
          message: "Scheduler started",
          status: emailScheduler.getStatus(),
        });

      case "stop":
        emailScheduler.stop();
        return NextResponse.json({
          success: true,
          message: "Scheduler stopped",
          status: emailScheduler.getStatus(),
        });

      case "trigger":
        // Manual trigger for testing
        await emailScheduler.triggerNow();
        return NextResponse.json({
          success: true,
          message: "Manual trigger completed",
          timestamp: new Date().toISOString(),
        });

      case "status":
        return NextResponse.json({
          success: true,
          status: emailScheduler.getStatus(),
        });

      default:
        return NextResponse.json(
          {
            success: false,
            error: "Invalid action. Use: start, stop, trigger, or status",
          },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Error controlling scheduler:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to control scheduler",
      },
      { status: 500 }
    );
  }
}
