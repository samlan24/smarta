import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/app/lib/supabase/server';
import { GitHubService } from '@/app/lib/github';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { repositories, syncDays = 30 } = await request.json();

    // Get user's GitHub integration
    const { data: integration, error: integrationError } = await supabase
      .from('git_integrations')
      .select('*')
      .eq('user_id', user.id)
      .eq('platform', 'github')
      .eq('is_active', true)
      .single();

    if (integrationError || !integration) {
      return NextResponse.json({ error: 'GitHub integration not found' }, { status: 404 });
    }

    // Validate repositories input
    if (!repositories || repositories.length === 0) {
      return NextResponse.json({
        error: 'Please select repositories to sync',
        requiresRepoSelection: true
      }, { status: 400 });
    }

    // Limit to maximum 3 repositories
    if (repositories.length > 3) {
      return NextResponse.json({
        error: 'Maximum 3 repositories allowed for sync'
      }, { status: 400 });
    }

    const github = new GitHubService(integration.access_token);

    // *** NEW: Sync repositories first to populate external_repositories ***
    await github.syncUserRepositories(user.id);

    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - syncDays);

    let syncedRepos = 0;
    const failedRepos: string[] = [];

    // Array to hold per-repo sync stats
    const repoStats: Array<{
      repoFullName: string;
      commits: number;
      aiCommits: number;
      manualCommits: number;
    }> = [];

    try {
      // Sync selected repositories commits
      for (const repoFullName of repositories) {
        try {
          await github.syncRepositoryCommits(user.id, repoFullName, sinceDate);
          syncedRepos++;

          // Query commit counts scoped to this repo
          const { count: totalCommits } = await supabase
            .from('external_commits')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .eq('repo_full_name', repoFullName) // match repo_full_name column
            .gte('committed_at', sinceDate.toISOString());

          const { count: aiCommits } = await supabase
            .from('external_commits')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .eq('repo_full_name', repoFullName)
            .eq('is_ai_generated', true)
            .gte('committed_at', sinceDate.toISOString());

          const manualCommits = (totalCommits || 0) - (aiCommits || 0);

          repoStats.push({
            repoFullName,
            commits: totalCommits || 0,
            aiCommits: aiCommits || 0,
            manualCommits: Math.max(0, manualCommits),
          });

        } catch (repoError) {
          console.error(`Error syncing repository ${repoFullName}:`, repoError);
          failedRepos.push(repoFullName);
          // Continue with other repos even if one fails
        }
      }

      // Aggregate totals from repoStats
      const totalCommitsAllRepos = repoStats.reduce((sum, r) => sum + r.commits, 0);
      const aiCommitsAllRepos = repoStats.reduce((sum, r) => sum + r.aiCommits, 0);
      const manualCommitsAllRepos = repoStats.reduce((sum, r) => sum + r.manualCommits, 0);

      // Update last sync timestamp on integration
      await supabase
        .from('git_integrations')
        .update({ last_sync_at: new Date().toISOString() })
        .eq('id', integration.id);

      // Return response with repo stats and overall stats
      const response = {
        success: true,
        repositories: syncedRepos,
        commits: totalCommitsAllRepos,
        aiCommits: aiCommitsAllRepos,
        manualCommits: manualCommitsAllRepos,
        syncedRepositories: syncedRepos,
        syncedCommits: totalCommitsAllRepos,
        syncPeriod: `${syncDays} days`,
        repoStats,
        ...(failedRepos.length > 0 && {
          warnings: `Failed to sync ${failedRepos.length} repositories: ${failedRepos.join(', ')}`
        }),
      };

      return NextResponse.json(response);

    } catch (syncError) {
      console.error('Sync error:', syncError);

      // On failure still update timestamp once to avoid infinite retry
      try {
        await supabase
          .from('git_integrations')
          .update({ last_sync_at: new Date().toISOString() })
          .eq('id', integration.id);
      } catch (timestampError) {
        console.error('Failed to update timestamp:', timestampError);
      }

      return NextResponse.json({
        error: 'Sync failed',
        details: syncError instanceof Error ? syncError.message : 'Unknown error',
      }, { status: 500 });
    }

  } catch (error) {
    console.error('GitHub sync API error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
