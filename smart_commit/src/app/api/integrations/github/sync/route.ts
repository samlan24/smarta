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

    const github = new GitHubService(integration.access_token);
    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - syncDays);

    let syncedRepos = 0;
    let syncedCommits = 0;

    try {
      // Sync repositories first
      await github.syncUserRepositories(user.id);
      
      // If specific repositories requested, sync only those
      if (repositories && repositories.length > 0) {
        for (const repoFullName of repositories) {
          await github.syncRepositoryCommits(user.id, repoFullName, sinceDate);
          syncedRepos++;
        }
      } else {
        // Sync all user repositories
        const { data: userRepos } = await supabase
          .from('external_repositories')
          .select('repo_full_name')
          .eq('user_id', user.id)
          .eq('integration_id', integration.id);

        for (const repo of userRepos || []) {
          await github.syncRepositoryCommits(user.id, repo.repo_full_name, sinceDate);
          syncedRepos++;
        }
      }

      // Count total synced commits
      const { count } = await supabase
        .from('external_commits')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('committed_at', sinceDate.toISOString());

      syncedCommits = count || 0;

      return NextResponse.json({
        success: true,
        syncedRepositories: syncedRepos,
        syncedCommits,
        syncPeriod: `${syncDays} days`
      });

    } catch (syncError) {
      console.error('Sync error:', syncError);
      return NextResponse.json({ 
        error: 'Sync failed', 
        details: syncError instanceof Error ? syncError.message : 'Unknown error'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('GitHub sync API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
