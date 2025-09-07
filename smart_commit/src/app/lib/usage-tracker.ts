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

    // Use your database function to log usage
    const { error } = await supabase
      .rpc('log_api_usage', {
        p_user_id: userId,
        p_api_key_id: apiKeyId || null,
        p_endpoint: endpoint,
        p_request_size: requestSize,
        p_response_size: responseSize,
        p_tokens_used: tokensUsed,
        p_success: success,
        p_error_message: errorMessage || null,
        p_ip_address: ipAddress || null,
        p_user_agent: userAgent || null
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