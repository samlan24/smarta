import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/app/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";

// Helper function to calculate commit stats for a repo
async function calculateCommitStats(
  supabase: SupabaseClient,
  userId: string,
  repoFullName: string
) {
  // Fetch all commits with their quality scores and source
  const { data: commits, error: commitsError } = await supabase
    .from("external_commits")
    .select("commit_source, is_ai_generated, quality_score")
    .eq("user_id", userId)
    .eq("repo_full_name", repoFullName);

  if (commitsError) {
    console.error(
      `Error fetching commits for repo ${repoFullName}`,
      commitsError
    );
    throw new Error("Error fetching commit stats");
  }

  const totalCommits = commits?.length || 0;

  // Count commit source categories
  const aiCommits =
    commits?.filter((c) => c.commit_source === "smart-commit").length || 0;
  const manualCommits =
    commits?.filter((c) => c.commit_source === "manual").length || 0;
  const unknownCommits =
    commits?.filter((c) => c.commit_source === "unknown").length || 0;

  // Calculate average quality score
  const qualityScore = totalCommits
    ? Math.round(
        commits.reduce((sum, commit) => sum + (commit.quality_score || 0), 0) /
          totalCommits
      )
    : 0;

  return {
    totalCommits,
    aiCommits,
    manualCommits,
    unknownCommits,
    qualityScore,
  };
}

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

    // Fetch synced repositories from database
    const { data: syncedRepos, error: reposError } = await supabase
      .from("external_repositories")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });

    if (reposError) {
      console.error("Error fetching synced repositories:", reposError);
      return NextResponse.json(
        { error: "Failed to fetch synced repositories" },
        { status: 500 }
      );
    }

    // For each repo, calculate commit stats and scoring
    const formattedRepos = await Promise.all(
      (syncedRepos || []).map(async (repo) => {
        const stats = await calculateCommitStats(
          supabase,
          user.id,
          repo.repo_full_name
        );

        return {
          id: repo.id,
          name: repo.repo_name,
          full_name: repo.repo_full_name,
          description: repo.description || "",
          private: repo.is_private,
          updated_at: repo.updated_at,
          language: repo.language || "",
          stars: repo.stars || 0,
          forks: repo.forks || 0,
          last_sync_at: repo.updated_at,
          stats: {
            commits: stats.totalCommits,
            aiCommits: stats.aiCommits,
            manualCommits: stats.manualCommits,
            qualityScore: stats.qualityScore,
          },
        };
      })
    );

    return NextResponse.json({ repositories: formattedRepos });
  } catch (error) {
    console.error("Synced repositories API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch synced repositories" },
      { status: 500 }
    );
  }
}
