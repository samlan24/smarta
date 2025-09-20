import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/app/lib/supabase/server';
import { checkEndpointRateLimits, ENDPOINT_LIMITS } from '../../../../lib/rateLimit';
import { makeGitHubAPICall } from '../../../../lib/githubRateLimit';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rateLimitResult = await checkEndpointRateLimits(user.id, 'github-integration', ENDPOINT_LIMITS.INTEGRATIONS);
if (!rateLimitResult.allowed) {
  return NextResponse.json(
    {
      error: rateLimitResult.error,
      reset_time: rateLimitResult.reset_time,
      limit_type: rateLimitResult.limit_type
    },
    { status: 429 }
  );
}

    // Get GitHub provider token from user metadata
// Get GitHub provider token from user metadata
const githubToken = user.user_metadata?.provider_token;
if (!githubToken) {
  return NextResponse.json({
    error: 'No GitHub token found. Please use OAuth flow.',
    requiresOAuth: true
  }, { status: 200 }); // Changed from 400 to 200
}

    // Fetch GitHub user info
    let githubUser;
try {
  githubUser = await makeGitHubAPICall<any>(
    () => fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${githubToken}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'SmartCommit/1.0'
      }
    }),
    'core'
  );
} catch (error) {
  console.error('GitHub API error:', error);

  if (error instanceof Error && error.message.includes('rate limit')) {
    return NextResponse.json({
      error: 'GitHub API rate limit exceeded. Please try again later.'
    }, { status: 429 });
  }

  return NextResponse.json({
    error: 'Failed to fetch GitHub user info'
  }, { status: 400 });
}

    // Check if integration already exists
    const { data: existingIntegration } = await supabase
      .from('git_integrations')
      .select('*')
      .eq('user_id', user.id)
      .eq('platform', 'github')
      .single();

    if (existingIntegration) {
      // Update existing integration
      const { error: updateError } = await supabase
        .from('git_integrations')
        .update({
          username: githubUser.login,
          avatar_url: githubUser.avatar_url,
          access_token: githubToken,
          is_active: true,
          connected_at: new Date().toISOString()
        })
        .eq('id', existingIntegration.id);

      if (updateError) {
        console.error('Error updating GitHub integration:', updateError);
        return NextResponse.json({ error: 'Failed to update integration' }, { status: 500 });
      }
    } else {
      // Create new integration
      const { error: insertError } = await supabase
        .from('git_integrations')
        .insert({
          user_id: user.id,
          platform: 'github',
          platform_user_id: githubUser.id.toString(),
          username: githubUser.login,
          avatar_url: githubUser.avatar_url,
          access_token: githubToken,
          is_active: true,
          connected_at: new Date().toISOString()
        });

      if (insertError) {
        console.error('Error creating GitHub integration:', insertError);
        return NextResponse.json({ error: 'Failed to create integration' }, { status: 500 });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'GitHub integration connected successfully',
      user: {
        username: githubUser.login,
        avatar_url: githubUser.avatar_url
      }
    });

  } catch (error) {
    console.error('GitHub connect API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
