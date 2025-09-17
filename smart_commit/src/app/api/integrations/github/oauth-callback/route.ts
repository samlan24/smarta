import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/app/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    
    if (!code) {
      return NextResponse.redirect(new URL('/dashboard?tab=integrations&error=no_code', request.url));
    }

    // Exchange code for access token
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code: code,
      }),
    });

    const tokenData = await tokenResponse.json();
    
    if (!tokenData.access_token) {
      return NextResponse.redirect(new URL('/dashboard?tab=integrations&error=token_exchange_failed', request.url));
    }

    // Get GitHub user info
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'SmartCommit/1.0'
      }
    });

    if (!userResponse.ok) {
      return NextResponse.redirect(new URL('/dashboard?tab=integrations&error=github_api_failed', request.url));
    }

    const githubUser = await userResponse.json();

    // Get current authenticated user (should be signed in with Google)
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.redirect(new URL('/dashboard?tab=integrations&error=not_authenticated', request.url));
    }

    // Check if integration already exists for this user
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
          platform_user_id: githubUser.id.toString(),
          username: githubUser.login,
          avatar_url: githubUser.avatar_url,
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token || null,
          is_active: true,
          connected_at: new Date().toISOString()
        })
        .eq('id', existingIntegration.id);

      if (updateError) {
        console.error('Error updating GitHub integration:', updateError);
        return NextResponse.redirect(new URL('/dashboard?tab=integrations&error=update_failed', request.url));
      }
    } else {
      // Create new integration linked to existing user
      const { error: insertError } = await supabase
        .from('git_integrations')
        .insert({
          user_id: user.id, // Link to existing Google-authenticated user
          platform: 'github',
          platform_user_id: githubUser.id.toString(),
          username: githubUser.login,
          avatar_url: githubUser.avatar_url,
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token || null,
          is_active: true,
          connected_at: new Date().toISOString()
        });

      if (insertError) {
        console.error('Error creating GitHub integration:', insertError);
        return NextResponse.redirect(new URL('/dashboard?tab=integrations&error=create_failed', request.url));
      }
    }

    // Redirect back to dashboard with success
    return NextResponse.redirect(new URL('/dashboard?tab=integrations&connected=github', request.url));

  } catch (error) {
    console.error('GitHub OAuth callback error:', error);
    console.error('Error details:', error);
    return NextResponse.redirect(new URL('/dashboard?tab=integrations&error=callback_failed', request.url));
  }
}
