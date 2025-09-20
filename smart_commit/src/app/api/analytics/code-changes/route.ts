import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../lib/supabase/server";
import {
  checkEndpointRateLimits,
  ENDPOINT_LIMITS,
} from "../../../lib/rateLimit";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get the current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rateLimitResult = await checkEndpointRateLimits(
      user.id,
      "analytics-code-changes",
      ENDPOINT_LIMITS.ANALYTICS
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

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get("days") || "30");
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Fetch code change patterns
    const { data: analytics, error } = await supabase
      .from("commit_analytics")
      .select("timestamp, lines_added, lines_deleted, commit_type")
      .eq("user_id", user.id)
      .gte("timestamp", startDate.toISOString())
      .order("timestamp", { ascending: true });

    if (error) {
      console.error("Analytics fetch error:", error);
      return NextResponse.json(
        { error: "Failed to fetch analytics data" },
        { status: 500 }
      );
    }

    // Group data by day for chart visualization
    const dailyData = analytics.reduce((acc: any, item) => {
      const date = new Date(item.timestamp).toDateString();
      if (!acc[date]) {
        acc[date] = {
          date,
          linesAdded: 0,
          linesDeleted: 0,
          commits: 0,
        };
      }
      acc[date].linesAdded += item.lines_added;
      acc[date].linesDeleted += item.lines_deleted;
      acc[date].commits += 1;
      return acc;
    }, {});

    // Convert to array and sort by date
    const chartData = Object.values(dailyData).sort(
      (a: any, b: any) =>
        new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Calculate summary stats
    const totalLinesAdded = analytics.reduce(
      (sum, item) => sum + item.lines_added,
      0
    );
    const totalLinesDeleted = analytics.reduce(
      (sum, item) => sum + item.lines_deleted,
      0
    );
    const totalCommits = analytics.length;

    // Commit type distribution
    const commitTypes = analytics.reduce((acc: any, item) => {
      acc[item.commit_type] = (acc[item.commit_type] || 0) + 1;
      return acc;
    }, {});

    return NextResponse.json({
      chartData,
      summary: {
        totalLinesAdded,
        totalLinesDeleted,
        totalCommits,
        netChange: totalLinesAdded - totalLinesDeleted,
      },
      commitTypes,
    });
  } catch (error) {
    console.error("Code changes API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
