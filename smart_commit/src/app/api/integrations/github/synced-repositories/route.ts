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

    // Fetch synced repositories from database
    const { data: syncedRepos, error: reposError } = await supabase
      .from('external_repositories')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    if (reposError) {
      console.error('Error fetching synced repositories:', reposError);
      return NextResponse.json({ error: 'Failed to fetch synced repositories' }, { status: 500 });
    }

    // Format for your frontend
    const formattedRepos = (syncedRepos || []).map((repo) => ({
      id: repo.id,
      name: repo.repo_name,
      full_name: repo.repo_full_name,
      description: repo.description || '',
      private: repo.is_private,
      updated_at: repo.updated_at,
      language: repo.language || '',
      stars: repo.stars || 0,
      forks: repo.forks || 0,
      last_sync_at: repo.updated_at // or use last_sync_at if you have that column
    }));

    return NextResponse.json({ repositories: formattedRepos });

  } catch (error) {
    console.error('Synced repositories API error:', error);
    return NextResponse.json({ error: 'Failed to fetch synced repositories' }, { status: 500 });
  }
}