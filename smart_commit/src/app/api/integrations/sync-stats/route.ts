import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/app/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get repository count
    const { count: repoCount, error: repoError } = await supabase
      .from('external_repositories')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    if (repoError) {
      console.error('Error fetching repository count:', repoError);
      return NextResponse.json({ error: 'Failed to fetch repository stats' }, { status: 500 });
    }

    // Get total commit count
    const { count: totalCommits, error: commitError } = await supabase
      .from('external_commits')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    if (commitError) {
      console.error('Error fetching commit count:', commitError);
      return NextResponse.json({ error: 'Failed to fetch commit stats' }, { status: 500 });
    }

    // Get AI commits count
    const { count: aiCommits, error: aiCommitError } = await supabase
      .from('external_commits')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_ai_generated', true);

    if (aiCommitError) {
      console.error('Error fetching AI commit count:', aiCommitError);
    }

    // Calculate manual commits
    const manualCommits = (totalCommits || 0) - (aiCommits || 0);

    // Get commits from last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { count: recentCommits, error: recentCommitError } = await supabase
      .from('external_commits')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('committed_at', thirtyDaysAgo.toISOString());

    if (recentCommitError) {
      console.error('Error fetching recent commits:', recentCommitError);
    }

    const syncStats = {
      repositories: repoCount || 0,
      commits: totalCommits || 0,
      aiCommits: aiCommits || 0,
      manualCommits: Math.max(0, manualCommits),
      syncedRepositories: repoCount || 0,
      syncedCommits: recentCommits || 0,
      syncPeriod: 'Last 30 days'
    };

    return NextResponse.json(syncStats);

  } catch (error) {
    console.error('Sync stats API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}