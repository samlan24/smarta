import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/app/lib/supabase/server";
import { GitHubService } from "@/app/lib/github";
import { checkEndpointRateLimits } from "@/app/lib/rateLimit";
import { makeGitHubAPICall } from "@/app/lib/githubRateLimit";
import { getUserPlan } from "@/app/lib/planManager";

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
      "github-sync",
      {
        hourlyLimitFree: 3,
        hourlyLimitPro: 20,
        dailyLimitFree: 5,
        dailyLimitPro: 100,
      }
    );

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          error: rateLimitResult.error,
          reset_time: rateLimitResult.reset_time,
          limit_type: rateLimitResult.limit_type,
          upgrade_required: rateLimitResult.upgrade_required || false, // Add this
        },
        { status: rateLimitResult.upgrade_required ? 402 : 429 } // Update this
      );
    }
    const { repositories, syncDays = 30 } = await request.json();

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

    // Validate repositories input
    if (!repositories || repositories.length === 0) {
      return NextResponse.json(
        {
          error: "Please select repositories to sync",
          requiresRepoSelection: true,
        },
        { status: 400 }
      );
    }
    const planInfo = await getUserPlan(user.id);


    const maxRepos = planInfo?.features.github_sync_repos || 1;


    if (repositories.length > maxRepos) {
      return NextResponse.json(
        {
          error: `Repository sync limit exceeded (${maxRepos} repositories for ${
            planInfo?.planName || "Free"
          } plan)`,
          upgrade_required: planInfo?.planId === "free",
          current_request: repositories.length,
          limit: maxRepos,
        },
        { status: planInfo?.planId === "free" ? 402 : 400 }
      );
    }

    const github = new GitHubService(integration.access_token);

    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - syncDays);

    let syncedRepos = 0;
    const failedRepos: Array<{ repo: string; error: string }> = [];

    // Array to hold per-repo sync stats
    const repoStats: Array<{
      repoFullName: string;
      commits: number;
      aiCommits: number;
      manualCommits: number;
    }> = [];

    // Fetch repository details from GitHub API to store complete info
    const allRepoDetails = new Map();
    for (const repoFullName of repositories) {
      try {
        const repoDetails = await makeGitHubAPICall<any>(
          () =>
            fetch(`https://api.github.com/repos/${repoFullName}`, {
              headers: {
                Authorization: `Bearer ${integration.access_token}`,
                Accept: "application/vnd.github.v3+json",
                "User-Agent": "SmartCommit-App",
              },
            }),
          "core"
        );

        allRepoDetails.set(repoFullName, {
          repo_name: repoDetails.name,
          repo_full_name: repoDetails.full_name,
          description: repoDetails.description,
          language: repoDetails.language,
          is_private: repoDetails.private,
          stars: repoDetails.stargazers_count || 0,
          forks: repoDetails.forks_count || 0,
          last_commit_at: repoDetails.pushed_at,
        });
      } catch (error) {
        console.error(`Failed to fetch details for ${repoFullName}:`, error);

        // If it's a GitHub rate limit error, stop the entire sync operation
        if (error instanceof Error && error.message.includes("rate limit")) {
          return NextResponse.json(
            {
              error:
                "GitHub API rate limit exceeded during repository sync. Please try again later.",
            },
            { status: 429 }
          );
        }
      }
    }

    try {
      // Sync commits for each selected repository and collect per-repo stats
      for (const repoFullName of repositories) {
        try {
          await github.syncRepositoryCommits(user.id, repoFullName, sinceDate);

          // Store repository info after successful commit sync
          const repoDetails = allRepoDetails.get(repoFullName);
          if (repoDetails) {
            await supabase.from("external_repositories").upsert(
              {
                user_id: user.id,
                integration_id: integration.id,
                ...repoDetails,
                updated_at: new Date().toISOString(),
              },
              {
                onConflict: "integration_id,repo_full_name",
              }
            );
          }

          syncedRepos++;

          // Count total commits in the time range for this repo
          const { count: repoCommits } = await supabase
            .from("external_commits")
            .select("", { count: "exact", head: true })
            .eq("user_id", user.id)
            .eq("repo_full_name", repoFullName)
            .gte("committed_at", sinceDate.toISOString());

          // Count AI-generated commits in the time range for this repo
          const { count: repoAiCommits } = await supabase
            .from("external_commits")
            .select("", { count: "exact", head: true })
            .eq("user_id", user.id)
            .eq("repo_full_name", repoFullName)
            .eq("is_ai_generated", true)
            .gte("committed_at", sinceDate.toISOString());

          const repoManualCommits = (repoCommits || 0) - (repoAiCommits || 0);

          repoStats.push({
            repoFullName,
            commits: repoCommits || 0,
            aiCommits: repoAiCommits || 0,
            manualCommits: Math.max(0, repoManualCommits),
          });
        } catch (repoError) {
          console.error(`Error syncing repository ${repoFullName}:`, repoError);
          failedRepos.push({
            repo: repoFullName,
            error:
              repoError instanceof Error ? repoError.message : "Unknown error",
          });
        }
      }

      if (repositories.length === 1 && failedRepos.length === 1) {
        return NextResponse.json(
          {
            error: failedRepos[0].error,
          },
          { status: 400 }
        );
      }

      // Aggregate totals from repoStats
      const totalCommitsAllRepos = repoStats.reduce(
        (sum, r) => sum + r.commits,
        0
      );
      const aiCommitsAllRepos = repoStats.reduce(
        (sum, r) => sum + r.aiCommits,
        0
      );
      const manualCommitsAllRepos = repoStats.reduce(
        (sum, r) => sum + r.manualCommits,
        0
      );

      // Update last sync timestamp on git_integrations
      await supabase
        .from("git_integrations")
        .update({ last_sync_at: new Date().toISOString() })
        .eq("id", integration.id);

      const response = {
        success: true,
        repositories: syncedRepos,
        commits: totalCommitsAllRepos,
        aiCommits: aiCommitsAllRepos,
        manualCommits: manualCommitsAllRepos,
        syncedRepositories: syncedRepos,
        syncedCommits: totalCommitsAllRepos,
        syncPeriod: `${syncDays} days`,
        repoStats, // <-- per repo commit stats included here
        ...(failedRepos.length > 0 && {
          warnings: `Failed to sync ${
            failedRepos.length
          } repositories: ${failedRepos.join(", ")}`,
        }),
      };

      return NextResponse.json(response);
    } catch (syncError) {
      console.error("Sync error:", syncError);

      try {
        await supabase
          .from("git_integrations")
          .update({ last_sync_at: new Date().toISOString() })
          .eq("id", integration.id);
      } catch (timestampError) {
        console.error("Failed to update timestamp:", timestampError);
      }

      return NextResponse.json(
        {
          error: "Sync failed",
          details:
            syncError instanceof Error ? syncError.message : "Unknown error",
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("GitHub sync API error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
