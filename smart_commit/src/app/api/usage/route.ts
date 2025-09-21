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

    // Get user subscription info
    const { data: subscription } = await supabase
      .from("user_subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .single();

    // Get usage logs for stats
    const { data: usageLogs } = await supabase
      .from("usage_logs")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(100); // Last 100 requests

    // Get this month's usage
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { data: monthlyLogs } = await supabase
      .from("usage_logs")
      .select("*")
      .eq("user_id", user.id)
      .gte("created_at", startOfMonth.toISOString());

    // Calculate stats
    const totalRequests = usageLogs?.length || 0;
    const monthlyRequests = monthlyLogs?.length || 0;
    const totalTokens =
      usageLogs?.reduce((sum, log) => sum + (log.tokens_used || 0), 0) || 0;
    const successfulRequests =
      usageLogs?.filter((log) => log.success).length || 0;
    const successRate =
      totalRequests > 0 ? (successfulRequests / totalRequests) * 100 : 100;

    // Group by date for chart (last 30 days)
    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);

    const recentLogs =
      usageLogs?.filter((log) => new Date(log.created_at) >= last30Days) || [];

    // In your /api/usage endpoint, replace the chart data logic:
    const dailyUsage = recentLogs.reduce((acc, log) => {
      // Use consistent date handling
      const logDate = new Date(log.created_at);
      const dateKey = logDate.toISOString().split("T")[0];

      if (!acc[dateKey]) {
        acc[dateKey] = { date: dateKey, requests: 0, tokens: 0 };
      }
      acc[dateKey].requests += 1;
      acc[dateKey].tokens += log.tokens_used || 0;
      return acc;
    }, {});

    // Ensure we get the last 14 days regardless of data gaps
    const chartData = [];
    for (let i = 13; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateKey = date.toISOString().split("T")[0];

      chartData.push(
        dailyUsage[dateKey] || {
          date: dateKey,
          requests: 0,
          tokens: 0,
        }
      );
    }

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
      recentCalls: usageLogs?.slice(0, 10) || [],
    });
  } catch (error) {
    console.error("Usage API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch usage" },
      { status: 500 }
    );
  }
}
