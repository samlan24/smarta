import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/app/lib/supabase/server";
import {
  checkEndpointRateLimits,
  ENDPOINT_LIMITS,
} from "../../../../lib/rateLimit";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rateLimitResult = await checkEndpointRateLimits(
      user.id,
      "github-disconnect",
      ENDPOINT_LIMITS.INTEGRATIONS
    );
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          error: rateLimitResult.error,
          reset_time: rateLimitResult.reset_time,
          limit_type: rateLimitResult.limit_type,
        },
        { status: 429 }
      );
    }

    // Delete all related data in correct order (foreign key constraints)

    // 1. Delete external commits
    const { error: commitsError } = await supabase
      .from("external_commits")
      .delete()
      .eq("user_id", user.id);

    if (commitsError) {
      console.error("Error deleting external commits:", commitsError);
      return NextResponse.json(
        { error: "Failed to delete commit data" },
        { status: 500 }
      );
    }

    // 2. Delete external repositories
    const { error: reposError } = await supabase
      .from("external_repositories")
      .delete()
      .eq("user_id", user.id);

    if (reposError) {
      console.error("Error deleting external repositories:", reposError);
      return NextResponse.json(
        { error: "Failed to delete repository data" },
        { status: 500 }
      );
    }

    // 3. Delete GitHub integration
    const { error: integrationError } = await supabase
      .from("git_integrations")
      .delete()
      .eq("user_id", user.id)
      .eq("platform", "github");

    if (integrationError) {
      console.error("Error deleting GitHub integration:", integrationError);
      return NextResponse.json(
        { error: "Failed to disconnect GitHub" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "GitHub disconnected successfully",
    });
  } catch (error) {
    console.error("GitHub disconnect API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
