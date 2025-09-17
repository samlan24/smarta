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
    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - syncDays);

    let syncedRepos = 0;
    const failedRepos: string[] = [];

    try {
      // Sync selected repositories
      for (const repoFullName of repositories) {
        try {
          await github.syncRepositoryCommits(user.id, repoFullName, sinceDate);
          syncedRepos++;
        } catch (repoError) {
          console.error(`Error syncing repository ${repoFullName}:`, repoError);
          failedRepos.push(repoFullName);
          // Continue with other repos even if one fails
        }
      }

      // Get commit statistics after sync
      const { count: totalCommits } = await supabase
        .from('external_commits')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('committed_at', sinceDate.toISOString());

      const { count: aiCommits } = await supabase
        .from('external_commits')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_ai_generated', true)
        .gte('committed_at', sinceDate.toISOString());

      const manualCommits = (totalCommits || 0) - (aiCommits || 0);

      // Update last sync timestamp
      await supabase
        .from('git_integrations')
        .update({ last_sync_at: new Date().toISOString() })
        .eq('id', integration.id);

      // Prepare response with comprehensive stats
      const response = {
        success: true,
        repositories: syncedRepos,
        commits: totalCommits || 0,
        aiCommits: aiCommits || 0,
        manualCommits: Math.max(0, manualCommits),
        syncedRepositories: syncedRepos,
        syncedCommits: totalCommits || 0,
        syncPeriod: `${syncDays} days`,
        ...(failedRepos.length > 0 && {
          warnings: `Failed to sync ${failedRepos.length} repositories: ${failedRepos.join(', ')}`
        })
      };

      return NextResponse.json(response);

    } catch (syncError) {
      console.error('Sync error:', syncError);

      // If sync completely failed, still try to update timestamp to prevent infinite retries
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
        details: syncError instanceof Error ? syncError.message : 'Unknown error'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('GitHub sync API error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}