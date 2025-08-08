import { NextRequest, NextResponse } from "next/server";
import { emailScheduler } from "@/utils/scheduler";

export async function GET() {
  try {
    const status = emailScheduler.getStatus();
    
    return NextResponse.json({
      message: "Scheduler status",
      ...status,
      environment: process.env.NODE_ENV,
      enableScheduler: process.env.ENABLE_SCHEDULER,
      schedulerCron: process.env.SCHEDULER_CRON || "* * * * *",
      siteUrl: process.env.NEXT_PUBLIC_SITE_URL,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to get scheduler status",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const action = body.action;

    switch (action) {
      case "start":
        emailScheduler.start();
        return NextResponse.json({
          message: "Scheduler started",
          status: emailScheduler.getStatus(),
        });

      case "stop":
        emailScheduler.stop();
        return NextResponse.json({
          message: "Scheduler stopped",
          status: emailScheduler.getStatus(),
        });

      case "trigger":
        await emailScheduler.triggerNow();
        return NextResponse.json({
          message: "Manual trigger completed",
          status: emailScheduler.getStatus(),
        });

      default:
        return NextResponse.json(
          {
            error: "Invalid action",
            validActions: ["start", "stop", "trigger"],
          },
          { status: 400 }
        );
    }
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to execute scheduler action",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
