// lib/planManager.ts
import { createClient } from './supabase/server';

export interface PlanFeatures {
  commit_generations_monthly: number;
  commit_templates: number; // -1 means unlimited
  analytics_days: number; // -1 means unlimited
  analytics_repos: number; // -1 means unlimited
  github_sync_repos: number;
  github_sync_auto: boolean;
  api_calls_monthly: number;
  export_data: boolean;
  priority_support: boolean;
  team_features: boolean;
  rate_limits: {
    generate_commit_hourly: number;
    generate_commit_daily: number;
    templates_hourly: number;
    analytics_hourly: number;
  };
}

export interface PlanInfo {
  planId: string;
  planName: string;
  features: PlanFeatures;
  usage_count: number;
  usage_limit: number;
  reset_date: string;
}

/**
 * Get user's current plan and features
 */
export async function getUserPlan(userId: string): Promise<PlanInfo | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('user_subscriptions')
    .select(`
      plan,
      usage_count,
      usage_limit,
      reset_date,
      subscription_plans(
        name,
        features
      )
    `)
    .eq('user_id', userId)
    .eq('status', 'active')
    .single();

  if (error || !data || !data.subscription_plans || data.subscription_plans.length === 0) {
    // Return default free plan
    return {
      planId: 'free',
      planName: 'Free',
      features: getDefaultFreePlanFeatures(),
      usage_count: 0,
      usage_limit: 500,
      reset_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    };
  }

  // Handle subscription_plans as array and get the first (should be only) item
  const planData = data.subscription_plans[0] as { name: string; features: PlanFeatures };

  return {
    planId: data.plan,
    planName: planData.name,
    features: planData.features,
    usage_count: data.usage_count,
    usage_limit: data.usage_limit,
    reset_date: data.reset_date
  };
}

/**
 * Check if user can perform a specific action
 */
export async function checkFeatureAccess(
  userId: string,
  feature: keyof PlanFeatures,
  requestedAmount: number = 1
): Promise<{
  allowed: boolean;
  error?: string;
  upgrade_required?: boolean;
  current_usage?: number;
  limit?: number;
}> {
  const planInfo = await getUserPlan(userId);
  if (!planInfo) {
    return { allowed: false, error: 'Unable to determine plan' };
  }

  const featureLimit = planInfo.features[feature];

  // Handle unlimited features (-1)
  if (featureLimit === -1) {
    return { allowed: true };
  }

  // Handle boolean features
  if (typeof featureLimit === 'boolean') {
    return {
      allowed: featureLimit,
      error: !featureLimit ? `${feature} not available in ${planInfo.planName} plan` : undefined,
      upgrade_required: !featureLimit && planInfo.planId === 'free'
    };
  }

  // Handle numeric features that need current usage check
  if (feature === 'commit_templates') {
    const currentUsage = await getCurrentTemplateCount(userId);
    const allowed = currentUsage + requestedAmount <= (featureLimit as number);

    return {
      allowed,
      error: !allowed ? `Template limit reached (${featureLimit} templates for ${planInfo.planName} plan)` : undefined,
      upgrade_required: !allowed && planInfo.planId === 'free',
      current_usage: currentUsage,
      limit: featureLimit as number
    };
  }

  return { allowed: true };
}

/**
 * Check monthly usage limits (for commit generations)
 */
export async function checkMonthlyUsageLimit(
  userId: string
): Promise<{
  allowed: boolean;
  error?: string;
  upgrade_required?: boolean;
  remaining?: number;
  used?: number;
  limit?: number;
}> {
  const planInfo = await getUserPlan(userId);
  if (!planInfo) {
    return { allowed: false, error: 'Unable to determine plan' };
  }

  const monthlyLimit = planInfo.features.commit_generations_monthly;
  const used = planInfo.usage_count;
  const remaining = monthlyLimit - used;

  if (used >= monthlyLimit) {
    return {
      allowed: false,
      error: `Monthly commit generation limit reached (${monthlyLimit} commits for ${planInfo.planName} plan)`,
      upgrade_required: planInfo.planId === 'free',
      remaining: 0,
      used,
      limit: monthlyLimit
    };
  }

  return {
    allowed: true,
    remaining,
    used,
    limit: monthlyLimit
  };
}

/**
 * Get plan-specific rate limits
 */
export async function getPlanRateLimits(
  userId: string,
  limitType: 'generate_commit_hourly' | 'generate_commit_daily' | 'templates_hourly' | 'analytics_hourly'
): Promise<number> {
  const planInfo = await getUserPlan(userId);
  if (!planInfo) {
    return getDefaultFreePlanFeatures().rate_limits[limitType];
  }

  return planInfo.features.rate_limits[limitType];
}

/**
 * Get analytics limits for user
 */
export async function getAnalyticsLimits(userId: string): Promise<{
  maxDays: number;
  maxRepos: number;
  canExport: boolean;
}> {
  const planInfo = await getUserPlan(userId);
  if (!planInfo) {
    const defaultFeatures = getDefaultFreePlanFeatures();
    return {
      maxDays: defaultFeatures.analytics_days,
      maxRepos: defaultFeatures.analytics_repos,
      canExport: defaultFeatures.export_data
    };
  }

  return {
    maxDays: planInfo.features.analytics_days === -1 ? 365 : planInfo.features.analytics_days,
    maxRepos: planInfo.features.analytics_repos === -1 ? 999 : planInfo.features.analytics_repos,
    canExport: planInfo.features.export_data
  };
}

/**
 * Helper functions
 */
async function getCurrentTemplateCount(userId: string): Promise<number> {
  const supabase = await createClient();

  const { count } = await supabase
    .from('user_templates')
    .select('*', { count: 'exact' })
    .eq('user_id', userId);

  return count || 0;
}

function getDefaultFreePlanFeatures(): PlanFeatures {
  return {
    commit_generations_monthly: 500,
    commit_templates: 3,
    analytics_days: 14,
    analytics_repos: 3,
    github_sync_repos: 3,
    github_sync_auto: false,
    api_calls_monthly: 200,
    export_data: false,
    priority_support: false,
    team_features: false,
    rate_limits: {
      generate_commit_hourly: 100,
      generate_commit_daily: 100,
      templates_hourly: 100,
      analytics_hourly: 100
    }
  };
}