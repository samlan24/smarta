import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/app/lib/supabase/server";
import {
  checkEndpointRateLimits,
  ENDPOINT_LIMITS,
} from "@/app/lib/rateLimit";
import { makeGitHubAPICall } from "@/app/lib/githubRateLimit";
import { getUserPlan } from "@/app/lib/planManager";

export async function GET(request: NextRequest) {
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
      "github-repositories",
      ENDPOINT_LIMITS.INTEGRATIONS
    );
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          error: rateLimitResult.error,
          reset_time: rateLimitResult.reset_time,
          limit_type: rateLimitResult.limit_type,
          upgrade_required: rateLimitResult.upgrade_required || false,
        },
        { status: 429 }
      );
    }

    // Get user's GitHub integration
    const { data: integration, error: integrationError } = await supabase
      .from("git_integrations")
      .select("*")
      .eq("user_id", user.id)
      .eq("platform", "github")
      .eq("is_active", true)
      .single();

    if (integrationError || !integration) {
      return NextResponse.json(
        { error: "GitHub integration not found" },
        { status: 404 }
      );
    }
    const planInfo = await getUserPlan(user.id);

    let repositories;
    try {
      repositories = await makeGitHubAPICall<any[]>(
        () =>
          fetch("https://api.github.com/user/repos?per_page=20&sort=updated", {
            headers: {
              Authorization: `Bearer ${integration.access_token}`,
              Accept: "application/vnd.github.v3+json",
              "User-Agent": "SmartCommit/1.0",
            },
          }),
        "core"
      );
    } catch (error) {
      console.error("GitHub API error:", error);

      if (error instanceof Error && error.message.includes("rate limit")) {
        return NextResponse.json(
          {
            error: "GitHub API rate limit exceeded. Please try again later.",
          },
          { status: 429 }
        );
      }

      return NextResponse.json(
        {
          error: "Failed to fetch repositories from GitHub",
        },
        { status: 500 }
      );
    }

    // Sort by updated date (most recent first) and format for UI
    const formattedRepos = repositories
      .sort(
        (a: any, b: any) =>
          new Date(b.updated_at || "").getTime() -
          new Date(a.updated_at || "").getTime()
      )
      .map((repo: any) => ({
        id: repo.id,
        name: repo.name,
        full_name: repo.full_name,
        description: repo.description || "",
        private: repo.private,
        updated_at: repo.updated_at || "",
        language: repo.language || "",
        stars: repo.stargazers_count || 0,
        forks: repo.forks_count || 0,
      }));

    return NextResponse.json({
      repositories: formattedRepos,
      planInfo: planInfo
        ? {
            planName: planInfo.planName,
            githubSyncLimit: planInfo.features.github_sync_repos,
          }
        : null,
    });
  } catch (error) {
    console.error("GitHub repositories API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch repositories" },
      { status: 500 }
    );
  }
}
