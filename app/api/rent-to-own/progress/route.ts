import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { getRentToOwnProgress } from "@/utils/rent-to-own/progress";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const progress = await getRentToOwnProgress(user.id);

    return NextResponse.json({
      success: true,
      progress,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to load rent-to-own progress",
      },
      { status: 500 },
    );
  }
}
