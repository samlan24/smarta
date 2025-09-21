import { createClient } from '../lib/supabase/server'

export async function logApiUsage({
  userId,
  apiKeyId,
  endpoint,
  requestSize,
  responseSize,
  tokensUsed,
  success,
  errorMessage,
  ipAddress,
  userAgent
}: {
  userId: string
  apiKeyId?: string
  endpoint: string
  requestSize: number
  responseSize: number
  tokensUsed: number
  success: boolean
  errorMessage?: string
  ipAddress?: string
  userAgent?: string
}) {
  try {
    const supabase = await createClient()

    // Direct insertion instead of RPC
    const { error } = await supabase
      .from('usage_logs')
      .insert({
        user_id: userId,
        api_key_id: apiKeyId || null,
        endpoint,
        request_size: requestSize,
        response_size: responseSize,
        tokens_used: tokensUsed,
        success,
        error_message: errorMessage || null,
        ip_address: ipAddress || null,
        user_agent: userAgent || null
      })

    if (error) {
      console.error('Usage logging error:', error)
    }
  } catch (error) {
    console.error('Usage logging failed:', error)
  }
}

export async function getUserUsageStats(userId: string) {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('user_subscriptions')
      .select('usage_count, usage_limit, plan')
      .eq('user_id', userId)
      .single()

    if (error) throw error

    return data
  } catch (error) {
    console.error('Failed to get usage stats:', error)
    return null
  }
}