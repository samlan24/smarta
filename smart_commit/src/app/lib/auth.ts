import { createClient } from '../lib/supabase/server'

export async function validateApiKey(apiKey: string) {
  try {
    const supabase = await createClient()

    // Use your database function to get user by their API key
    const { data, error } = await supabase
      .rpc('get_user_by_api_key', { p_api_key: apiKey })

    if (error || !data || data.length === 0) {
      return { valid: false, error: 'Invalid API key' }
    }

    const userData = data[0]

    if (!userData.can_use_api) {
      return {
        valid: false,
        error: userData.subscription_status === 'active'
          ? 'Rate limit exceeded'
          : 'Subscription inactive'
      }
    }

    return {
      valid: true,
       userId: userData.result_user_id,
      subscriptionStatus: userData.subscription_status
    }
  } catch (error) {
    console.error('API key validation error:', error)
    return { valid: false, error: 'Validation failed' }
  }
}