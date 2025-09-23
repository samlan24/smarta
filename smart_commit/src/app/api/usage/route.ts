import { createClient } from "../../lib/supabase/server";
import { NextResponse } from "next/server";
import { checkEndpointRateLimits, ENDPOINT_LIMITS } from "../../lib/rateLimit";
import { getUserPlan } from "../../lib/planManager";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Plan info + rate limiting
    const planInfo = await getUserPlan(user.id);
    const rateLimitResult = await checkEndpointRateLimits(
      user.id,
      "usage-dashboard",
      ENDPOINT_LIMITS.USAGE
    );
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          error: rateLimitResult.error,
          reset_time: rateLimitResult.reset_time,
          limit_type: rateLimitResult.limit_type,
        },
        { status: 429 }
      );
    }

    // Subscription info
    const { data: subscription } = await supabase
      .from("user_subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .single();

    // Query usage_logs instead of commit_analytics
    const { data: usageLogs } = await supabase
      .from("usage_logs")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    // Use UTC for all date calculations
    const nowUTC = new Date();
    nowUTC.setUTCHours(0, 0, 0, 0);

    const startOfMonthUTC = new Date(Date.UTC(nowUTC.getUTCFullYear(), nowUTC.getUTCMonth(), 1));

    // This month's logs - using UTC
    const monthlyUsageLogs = usageLogs?.filter((entry) =>
      new Date(entry.created_at) >= startOfMonthUTC
    ) || [];

    // Last 30 days in UTC
    const last30DaysUTC = new Date();
    last30DaysUTC.setUTCDate(last30DaysUTC.getUTCDate() - 30);
    last30DaysUTC.setUTCHours(0, 0, 0, 0);

    const last30DaysUsageLogs = usageLogs?.filter((entry) =>
      new Date(entry.created_at) >= last30DaysUTC
    ) || [];

    // Stats with actual usage data
    const totalRequests = usageLogs?.length || 0;
    const monthlyRequests = monthlyUsageLogs?.length || 0;

    // Actual tokens used from logs
    const totalTokens = usageLogs?.reduce(
      (sum, entry) => sum + (entry.tokens_used || 0),
      0
    ) || 0;

    // Calculate actual success rate
    const successfulRequests = usageLogs?.filter(log => log.success).length || 0;
    const successRate = totalRequests > 0 ? (successfulRequests / totalRequests) * 100 : 100;

    // Chart data (last 14 days)
    const dailyUsage = last30DaysUsageLogs.reduce((acc, entry) => {
      const entryDate = new Date(entry.created_at);
      const dateKey = entryDate.toISOString().split("T")[0];

      if (!acc[dateKey]) {
        acc[dateKey] = { date: dateKey, requests: 0, tokens: 0 };
      }
      acc[dateKey].requests += 1;
      acc[dateKey].tokens += entry.tokens_used || 0;
      return acc;
    }, {} as Record<string, { date: string; requests: number; tokens: number }>);

    const chartData = [];
    for (let i = 13; i >= 0; i--) {
      const date = new Date();
      date.setUTCDate(date.getUTCDate() - i);
      date.setUTCHours(0, 0, 0, 0);
      const dateKey = date.toISOString().split("T")[0];

      chartData.push({
        date: dateKey,
        requests: dailyUsage[dateKey]?.requests || 0,
        tokens: dailyUsage[dateKey]?.tokens || 0,
        displayDate: date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
      });
    }

    // Recent calls with actual usage data
    const recentCalls = usageLogs?.slice(0, 10).map((entry) => ({
      id: entry.id,
      created_at: entry.created_at,
      tokens_used: entry.tokens_used || 0,
      success: entry.success || false,
      request_size: entry.request_size || 0,
      endpoint: entry.endpoint, // You might want to show this too
    })) || [];

    return NextResponse.json({
      subscription: {
        plan: subscription?.plan || "free",
        usageCount: subscription?.usage_count || 0,
        usageLimit: subscription?.usage_limit || 100,
        resetDate: subscription?.reset_date,
        status: subscription?.status || "active",
      },
      planInfo: planInfo
        ? {
            planName: planInfo.planName,
            features: {
              commitGenerations: planInfo.features.commit_generations_monthly,
              templates: planInfo.features.commit_templates,
              analyticsDays: planInfo.features.analytics_days,
              githubRepos: planInfo.features.github_sync_repos,
            },
          }
        : null,
      stats: {
        totalRequests,
        monthlyRequests,
        totalTokens,
        successRate: Math.round(successRate),
        remainingQuota:
          (subscription?.usage_limit || 100) - (subscription?.usage_count || 0),
      },
      chartData,
      recentCalls,
    });
  } catch (error) {
    console.error("Usage API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch usage" },
      { status: 500 }
    );
  }
}