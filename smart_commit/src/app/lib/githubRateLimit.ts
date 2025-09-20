import { createClient } from './supabase/server';

interface GitHubRateLimitResult {
  allowed: boolean;
  error?: string;
  remaining?: number;
  reset_time?: string;
  requests_used?: number;
  requests_limit?: number;
}

/**
 * Check GitHub API rate limits before making API calls
 */
export async function checkGitHubAPILimits(
  endpointType: 'core' | 'search' | 'graphql' = 'core'
): Promise<GitHubRateLimitResult> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc('check_github_api_limits', {
    p_endpoint_type: endpointType,
  });

  if (error) {
    console.error('Error checking GitHub API limits:', error);
    return { allowed: false, error: 'Rate limit check failed' };
  }

  return data;
}

/**
 * Update GitHub rate limit info from API response headers
 */
export async function updateGitHubRateLimitFromHeaders(
  headers: Headers,
  endpointType: 'core' | 'search' | 'graphql' = 'core'
): Promise<void> {
  const supabase = await createClient();

  const remaining = headers.get('x-ratelimit-remaining');
  const limit = headers.get('x-ratelimit-limit');
  const resetTime = headers.get('x-ratelimit-reset');

  if (remaining && limit && resetTime) {
    const used = parseInt(limit) - parseInt(remaining);
    const reset = new Date(parseInt(resetTime) * 1000);

    await supabase
      .from('external_api_limits')
      .upsert({
        api_provider: 'github',
        rate_limit_type: endpointType,
        requests_used: used,
        requests_limit: parseInt(limit),
        reset_time: reset.toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'api_provider,rate_limit_type'
      });
  }
}

/**
 * Wrapper for GitHub API calls with automatic rate limiting
 */
export async function makeGitHubAPICall<T>(
  apiCall: () => Promise<Response>,
  endpointType: 'core' | 'search' | 'graphql' = 'core'
): Promise<T> {
  // Check rate limits first
  const rateLimitCheck = await checkGitHubAPILimits(endpointType);

  if (!rateLimitCheck.allowed) {
    throw new Error(rateLimitCheck.error || 'GitHub API rate limit exceeded');
  }

  // Make the API call
  const response = await apiCall();

  // Update our rate limit tracking from response headers
  await updateGitHubRateLimitFromHeaders(response.headers, endpointType);

  // Handle GitHub API errors
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));

    if (response.status === 403 && errorData.message?.includes('rate limit')) {
      throw new Error('GitHub API rate limit exceeded');
    }

    throw new Error(`GitHub API error: ${response.status} ${errorData.message || 'Unknown error'}`);
  }

  return response.json();
}

/**
 * Get current GitHub API rate limit status
 */
export async function getGitHubRateLimitStatus(): Promise<Record<string, any>> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('external_api_limits')
    .select('*')
    .eq('api_provider', 'github');

  if (error) {
    console.error('Error fetching GitHub rate limits:', error);
    return {};
  }

  const result: Record<string, any> = {};

  for (const limit of data || []) {
    result[limit.rate_limit_type] = {
      used: limit.requests_used,
      limit: limit.requests_limit,
      remaining: limit.requests_limit - limit.requests_used,
      resetTime: limit.reset_time,
      percentage: Math.round((limit.requests_used / limit.requests_limit) * 100)
    };
  }

  return result;
}