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

    // Query commit analytics instead of usage logs
    const { data: commitAnalytics } = await supabase
      .from("commit_analytics")
      .select("*")
      .eq("user_id", user.id)
      .order("timestamp", { ascending: false });

    // Use UTC for all date calculations
    const nowUTC = new Date();
    nowUTC.setUTCHours(0, 0, 0, 0);

    const startOfMonthUTC = new Date(Date.UTC(nowUTC.getUTCFullYear(), nowUTC.getUTCMonth(), 1));

    // This month’s logs - using UTC
    const monthlyCommitAnalytics = commitAnalytics?.filter((entry) =>
      new Date(entry.timestamp) >= startOfMonthUTC
    ) || [];

    // Last 30 days in UTC
    const last30DaysUTC = new Date();
    last30DaysUTC.setUTCDate(last30DaysUTC.getUTCDate() - 30);
    last30DaysUTC.setUTCHours(0, 0, 0, 0);

    const last30DaysCommitAnalytics = commitAnalytics?.filter((entry) =>
      new Date(entry.timestamp) >= last30DaysUTC
    ) || [];

    // Debug logs
    console.log("Monthly logs count:", monthlyCommitAnalytics?.length);
    console.log("Recent logs count:", commitAnalytics?.length);

    // Stats
    const totalRequests = commitAnalytics?.length || 0;
    const monthlyRequests = monthlyCommitAnalytics?.length || 0;
    // Tokens are not stored in commit_analytics, so we estimate based on lines changed
    const totalTokens =
      commitAnalytics?.reduce(
        (sum, entry) => sum + (entry.lines_added || 0) + (entry.lines_deleted || 0),
        0
      ) || 0;
    // For success rate, since we don't have failure logs, assume 100% for now
    const successRate = 100;

    // Chart data (last 14 days)
    const dailyUsage = last30DaysCommitAnalytics.reduce((acc, entry) => {
      const entryDate = new Date(entry.timestamp);
      const dateKey = entryDate.toISOString().split("T")[0];

      if (!acc[dateKey]) {
        acc[dateKey] = { date: dateKey, requests: 0, tokens: 0 };
      }
      acc[dateKey].requests += 1;
      // Estimate tokens: 1 token per line changed
      acc[dateKey].tokens += (entry.lines_added || 0) + (entry.lines_deleted || 0);
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

    // Recent calls table data - we don't have token info per commit, so we use lines changed
    const recentCalls = commitAnalytics?.slice(0, 10).map((entry) => ({
      id: entry.id,
      created_at: entry.timestamp,
      tokens_used: (entry.lines_added || 0) + (entry.lines_deleted || 0),
      success: true, // Assume all are successful
      request_size: 0, // Not stored
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
      rawLogs: monthlyCommitAnalytics, // Temporary debug
    });
  } catch (error) {
    console.error("Usage API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch usage" },
      { status: 500 }
    );
  }
}
