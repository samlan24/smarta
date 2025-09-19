// lib/rateLimit.ts
import { createClient } from './supabase/server'
import { NextRequest } from 'next/server'

interface RateLimitResult {
  allowed: boolean
  error?: string
  remaining_monthly?: number
  remaining_daily?: number
  remaining_hourly?: number
  reset_time?: string
  limit_type?: 'hourly' | 'daily' | 'monthly'
  plan?: string
}

interface UsageLogParams {
  userId: string
  endpoint: string
  apiKeyId?: string
  success?: boolean
  tokensUsed?: number
  requestSize?: number
  responseSize?: number
  errorMessage?: string
  ipAddress?: string
  userAgent?: string
}

/**
 * Check rate limits for commit generation endpoint
 */
export async function checkCommitGenerationLimits(userId: string): Promise<RateLimitResult> {
  const supabase = await createClient()

  const { data, error } = await supabase.rpc('check_commit_generation_limits', {
    p_user_id: userId,
  })

  if (error) {
    console.error('Error checking commit generation limits:', error)
    return { allowed: false, error: 'Rate limit check failed' }
  }

  return data
}

/**
 * Check rate limits for other endpoints with configurable limits
 */
export async function checkEndpointRateLimits(
  userId: string,
  endpoint: string,
  options: {
    hourlyLimitFree?: number
    hourlyLimitPro?: number
    dailyLimitFree?: number
    dailyLimitPro?: number
  } = {}
): Promise<RateLimitResult> {
  const supabase = await createClient()

  const { data, error } = await supabase.rpc('check_endpoint_rate_limits', {
    p_user_id: userId,
    p_endpoint: endpoint,
    p_hourly_limit_free: options.hourlyLimitFree || 50,
    p_hourly_limit_pro: options.hourlyLimitPro || 200,
    p_daily_limit_free: options.dailyLimitFree || 200,
    p_daily_limit_pro: options.dailyLimitPro || 1000,
  })

  if (error) {
    console.error('Error checking endpoint rate limits:', error)
    return { allowed: false, error: 'Rate limit check failed' }
  }

  return data
}

/**
 * Log API usage after successful/failed requests
 */
export async function logApiUsage(params: UsageLogParams): Promise<string | null> {
  const supabase = await createClient()

  const { data, error } = await supabase.rpc('log_api_usage', {
    p_user_id: params.userId,
    p_endpoint: params.endpoint,
    p_api_key_id: params.apiKeyId || null,
    p_success: params.success ?? true,
    p_tokens_used: params.tokensUsed || null,
    p_request_size: params.requestSize || null,
    p_response_size: params.responseSize || null,
    p_error_message: params.errorMessage || null,
    p_ip_address: params.ipAddress || null,
    p_user_agent: params.userAgent || null,
  })

  if (error) {
    console.error('Error logging API usage:', error)
    return null
  }

  return data // Returns the log ID
}

/**
 * Helper to extract request metadata for logging
 */
export function extractRequestMetadata(request: NextRequest) {
  return {
    ipAddress:
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "",
    userAgent: request.headers.get("user-agent") || "",
  };
}

/**
 * Rate limiting middleware for commit generation with auth support
 */
export async function withCommitRateLimit(
  request: NextRequest,
  handler: (authResult: { userId: string; apiKeyId?: string }) => Promise<Response>
): Promise<Response> {
  // Import here to avoid circular dependency
  const { authenticate } = await import('./authHelpers')

  const authResult = await authenticate(request)
  if (!authResult) {
    return new Response(
      JSON.stringify({ error: 'Authentication required' }),
      { status: 401, headers: { 'Content-Type': 'application/json' }}
    )
  }

  const rateLimitResult = await checkCommitGenerationLimits(authResult.userId)

  if (!rateLimitResult.allowed) {
    const metadata = extractRequestMetadata(request)

    // Log the rate limit hit
    await logApiUsage({
      userId: authResult.userId,
      apiKeyId: authResult.apiKeyId,
      endpoint: 'generate-commit',
      success: false,
      errorMessage: rateLimitResult.error,
      ...metadata
    })

    return new Response(
      JSON.stringify({
        error: rateLimitResult.error,
        reset_time: rateLimitResult.reset_time,
        limit_type: rateLimitResult.limit_type
      }),
      {
        status: 429,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }

  return handler({
    userId: authResult.userId,
    apiKeyId: authResult.apiKeyId
  })
}

/**
 * Generic rate limiting middleware for other endpoints with auth support
 */
export async function withRateLimit(
  request: NextRequest,
  endpoint: string,
  handler: (authResult: { userId: string; apiKeyId?: string }) => Promise<Response>,
  limits?: {
    hourlyLimitFree?: number
    hourlyLimitPro?: number
    dailyLimitFree?: number
    dailyLimitPro?: number
  }
): Promise<Response> {
  // Import here to avoid circular dependency
  const { authenticate } = await import('./authHelpers')

  const authResult = await authenticate(request)
  if (!authResult) {
    return new Response(
      JSON.stringify({ error: 'Authentication required' }),
      { status: 401, headers: { 'Content-Type': 'application/json' }}
    )
  }

  const rateLimitResult = await checkEndpointRateLimits(authResult.userId, endpoint, limits)

  if (!rateLimitResult.allowed) {
    const metadata = extractRequestMetadata(request)

    // Log the rate limit hit
    await logApiUsage({
      userId: authResult.userId,
      apiKeyId: authResult.apiKeyId,
      endpoint,
      success: false,
      errorMessage: rateLimitResult.error,
      ...metadata
    })

    return new Response(
      JSON.stringify({
        error: rateLimitResult.error,
        reset_time: rateLimitResult.reset_time,
        limit_type: rateLimitResult.limit_type
      }),
      {
        status: 429,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }

  return handler({
    userId: authResult.userId,
    apiKeyId: authResult.apiKeyId
  })
}

// Predefined endpoint limits for easy reuse
export const ENDPOINT_LIMITS = {
  TEMPLATES: {
    hourlyLimitFree: 30,
    hourlyLimitPro: 100,
    dailyLimitFree: 100,
    dailyLimitPro: 500,
  },
  ANALYTICS: {
    hourlyLimitFree: 20,
    hourlyLimitPro: 100,
    dailyLimitFree: 100,
    dailyLimitPro: 500,
  },
  API_KEYS: {
    hourlyLimitFree: 10,
    hourlyLimitPro: 50,
    dailyLimitFree: 50,
    dailyLimitPro: 200,
  },
  USAGE: {
    hourlyLimitFree: 30,
    hourlyLimitPro: 100,
    dailyLimitFree: 100,
    dailyLimitPro: 500,
  },
  INTEGRATIONS: {
    hourlyLimitFree: 20,
    hourlyLimitPro: 100,
    dailyLimitFree: 100,
    dailyLimitPro: 500,
  }
}