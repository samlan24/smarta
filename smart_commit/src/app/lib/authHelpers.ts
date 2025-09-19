// lib/authHelpers.ts
import { NextRequest } from 'next/server'
import { createClient } from './supabase/server'
import { validateApiKey } from './auth'

interface AuthResult {
  userId: string
  authType: 'session' | 'api_key'
  apiKeyId?: string
}

/**
 * Get current user from session
 */
export async function getCurrentUser(request?: NextRequest) {
  const supabase = await createClient()

  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return null
  }

  return user
}

/**
 * Get user ID from session - throws if not authenticated
 */
export async function requireAuth(): Promise<string> {
  const user = await getCurrentUser()

  if (!user) {
    throw new Error('Authentication required')
  }

  return user.id
}

/**
 * Authenticate via session or API key
 */
export async function authenticate(request: NextRequest): Promise<AuthResult | null> {
  // First try API key authentication
  const apiKey = request.headers.get('authorization')?.replace('Bearer ', '') ||
                request.headers.get('x-api-key')

  if (apiKey) {
    const apiResult = await validateApiKey(apiKey)
    if (apiResult.valid && apiResult.userId) {
      return {
        userId: apiResult.userId,
        authType: 'api_key',
        // You might want to also return the API key ID for logging
      }
    }
  }

  // Fall back to session authentication
  const user = await getCurrentUser(request)
  if (user) {
    return {
      userId: user.id,
      authType: 'session'
    }
  }

  return null
}

/**
 * Create authenticated response helper that works with both session and API key
 */
export async function withAuth<T>(
  request: NextRequest,
  handler: (authResult: AuthResult) => Promise<T>
): Promise<T | Response> {
  try {
    const authResult = await authenticate(request)

    if (!authResult) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    return await handler(authResult)
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Authentication failed' }),
      {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}

/**
 * Session-only authentication (for dashboard routes)
 */
export async function withSessionAuth<T>(
  handler: (userId: string) => Promise<T>
): Promise<T | Response> {
  try {
    const userId = await requireAuth()
    return await handler(userId)
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Session authentication required' }),
      {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}