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

    // Last 100 usage logs
    const { data: usageLogs } = await supabase
      .from("usage_logs")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(100);

    // Use UTC for all date calculations
    const nowUTC = new Date();
    nowUTC.setUTCHours(0, 0, 0, 0);


    const startOfMonthUTC = new Date(Date.UTC(nowUTC.getUTCFullYear(), nowUTC.getUTCMonth(), 1));

    // This month’s logs
    const { data: monthlyLogs } = await supabase
      .from("usage_logs")
      .select("*")
      .eq("user_id", user.id)
      .gte("created_at", startOfMonthUTC.toISOString());

    // Last 30 days in UTC
    const last30DaysUTC = new Date();
    last30DaysUTC.setUTCDate(last30DaysUTC.getUTCDate() - 30);
    last30DaysUTC.setUTCHours(0, 0, 0, 0);

    // Debug logs
    console.log("Monthly logs count:", monthlyLogs?.length);
    console.log("Recent logs count:", usageLogs?.length);

    // Stats
    const totalRequests = usageLogs?.length || 0;
    const monthlyRequests = monthlyLogs?.length || 0;
    const totalTokens =
      usageLogs?.reduce((sum, log) => sum + (log.tokens_used || 0), 0) || 0;
    const successfulRequests =
      usageLogs?.filter((log) => log.success).length || 0;
    const successRate =
      totalRequests > 0 ? (successfulRequests / totalRequests) * 100 : 100;

    // Chart data (last 14 days)
    const recentLogs =
      usageLogs?.filter((log) => new Date(log.created_at) >= last30DaysUTC) || [];

    const dailyUsage = recentLogs.reduce((acc, log) => {
      const logDate = new Date(log.created_at);
      const dateKey = logDate.toISOString().split("T")[0];

      if (!acc[dateKey]) {
        acc[dateKey] = { date: dateKey, requests: 0, tokens: 0 };
      }
      acc[dateKey].requests += 1;
      acc[dateKey].tokens += log.tokens_used || 0;
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

    // Recent calls table data
    const recentCalls =
      usageLogs?.slice(0, 10).map((log) => ({
        id: log.id,
        created_at: log.created_at,
        tokens_used: log.tokens_used || 0,
        success: log.success,
        request_size: log.request_size || 0,
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
      rawLogs: monthlyLogs, // Temporary debug
    });
  } catch (error) {
    console.error("Usage API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch usage" },
      { status: 500 }
    );
  }
}
