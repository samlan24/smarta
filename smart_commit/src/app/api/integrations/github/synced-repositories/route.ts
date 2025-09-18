import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/app/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch synced repositories from database
    const {
      data: syncedRepos,
      error: reposError,
    } = await supabase
      .from('external_repositories')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    if (reposError) {
      console.error('Error fetching synced repositories:', reposError);
      return NextResponse.json(
        { error: 'Failed to fetch synced repositories' },
        { status: 500 }
      );
    }

    // Map over repos to fetch commit counts concurrently
    const formattedRepos = await Promise.all(
      (syncedRepos || []).map(async (repo) => {
        // Fetch total commits count
        const { count: commits, error: commitsError } = await supabase
          .from('external_commits')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('repo_full_name', repo.repo_full_name);

        if (commitsError) {
          console.error(
            `Error fetching commits count for repo ${repo.repo_full_name}:`,
            commitsError
          );
        }

        // Fetch AI commits count
        const { count: aiCommits, error: aiCommitsError } = await supabase
          .from('external_commits')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('repo_full_name', repo.repo_full_name)
          .eq('is_ai_generated', true);

        if (aiCommitsError) {
          console.error(
            `Error fetching AI commits count for repo ${repo.repo_full_name}:`,
            aiCommitsError
          );
        }

        const totalCommits = commits || 0;
        const totalAiCommits = aiCommits || 0;
        const manualCommits = totalCommits - totalAiCommits;

        return {
          id: repo.id,
          name: repo.repo_name,
          full_name: repo.repo_full_name,
          description: repo.description || '',
          private: repo.is_private,
          updated_at: repo.updated_at,
          language: repo.language || '',
          stars: repo.stars || 0,
          forks: repo.forks || 0,
          last_sync_at: repo.updated_at,
          stats: {
            commits: totalCommits,
            aiCommits: totalAiCommits,
            manualCommits,
          },
        };
      })
    );

    return NextResponse.json({ repositories: formattedRepos });
  } catch (error) {
    console.error('Synced repositories API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch synced repositories' },
      { status: 500 }
    );
  }
}
