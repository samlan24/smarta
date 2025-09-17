import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/app/lib/supabase/server';
import { GitHubService } from '@/app/lib/github';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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
    
    // Fetch user repositories from GitHub API
    const repositories = await github.getUserRepositories(1, 50); // Limit to 50 repos
    
    // Sort by updated date (most recent first) and format for UI
    const formattedRepos = repositories
      .sort((a: any, b: any) => new Date(b.updated_at || '').getTime() - new Date(a.updated_at || '').getTime())
      .map((repo: any) => ({
        id: repo.id,
        name: repo.name,
        full_name: repo.full_name,
        description: repo.description || '',
        private: repo.private,
        updated_at: repo.updated_at || '',
        language: repo.language || '',
        stars: repo.stargazers_count || 0,
        forks: repo.forks_count || 0
      }));

    return NextResponse.json({ repositories: formattedRepos });

  } catch (error) {
    console.error('GitHub repositories API error:', error);
    return NextResponse.json({ error: 'Failed to fetch repositories' }, { status: 500 });
  }
}
