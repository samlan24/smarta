import { NextRequest, NextResponse } from "next/server";
import { validateApiKey } from "../../lib/auth";
import GeminiClient from "../../lib/GeminiClient";
import { AnalyticsParser } from "../../lib/analytics-parser";
import { createClient } from "../../lib/supabase/server";
import { checkCommitGenerationLimits } from "../../lib/rateLimit";
import { extractRequestMetadata, logApiUsage } from "../../lib/rateLimit";

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  let userId: string | null = null;
  let requestSize = 0;

  try {
    // Get API key from Authorization header
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Missing or invalid Authorization header" },
        { status: 401 }
      );
    }

    const apiKey = authHeader.replace("Bearer ", "");

    const authResult = await validateApiKey(apiKey);
    if (!authResult.valid) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    if (!authResult.userId) {
      return NextResponse.json(
        { error: "Invalid authentication" },
        { status: 401 }
      );
    }
    userId = authResult.userId;

    if (!userId) {
      return NextResponse.json(
        { error: "Invalid authentication" },
        { status: 401 }
      );
    }

    const requestMetadata = extractRequestMetadata(request);

    // Parse request body early to get sizes
    const body = await request.json();
    const { diff, options = {} } = body;

    requestSize = JSON.stringify(body).length;

    const rateLimitResult = await checkCommitGenerationLimits(userId);
    if (!rateLimitResult.allowed) {
      // Log the rate limit hit with actual request size
      await logApiUsage({
        userId,
        endpoint: "/api/generate-commit",
        requestSize,
        responseSize: 0,
        tokensUsed: Math.ceil(requestSize / 4),
        success: false,
        errorMessage: rateLimitResult.error,
        ...requestMetadata,
      });

      return NextResponse.json(
        {
          error: rateLimitResult.error,
          reset_time: rateLimitResult.reset_time,
          limit_type: rateLimitResult.limit_type,
          upgrade_required: rateLimitResult.upgrade_required || false,
          remaining: rateLimitResult.remaining_monthly,
        },
        { status: 429 }
      );
    }

    if (!diff || typeof diff !== "string") {
      return NextResponse.json(
        { error: "Git diff is required" },
        { status: 400 }
      );
    }

    const geminiClient = new GeminiClient(process.env.GEMINI_API_KEY!);
    const commitMessage = await geminiClient.generateCommitMessage(diff, {
      ...options,
      maxLength: options.maxLength || 72,
    });

    const analysis = geminiClient.analyzeChanges(diff);

    // Parse git diff for analytics
    const analytics = AnalyticsParser.parseGitDiff(diff);
    const commitType = AnalyticsParser.extractCommitType(commitMessage);
    const repositoryName = AnalyticsParser.extractRepositoryName(diff);

    // Store analytics data
    if (typeof userId === "string") {
      try {
        const supabase = await createClient();
        const { data: analyticsData, error: analyticsError } = await supabase
          .from("commit_analytics")
          .insert({
            user_id: userId,
            files_changed: analytics.filesChanged,
            lines_added: analytics.linesAdded,
            lines_deleted: analytics.linesDeleted,
            commit_type: AnalyticsParser.extractCommitType(commitMessage),
            repository_name: AnalyticsParser.extractRepositoryName(diff),
            timestamp: new Date().toISOString(),
          });
      } catch (analyticsError) {
        console.error("Failed to store analytics:", analyticsError);
        // Don't fail the main request if analytics fails
      }
    }

    const responseSize = commitMessage.length;
    const finalTokensUsed = Math.ceil((requestSize + responseSize) / 4);

    // Log successful usage
    if (typeof userId === "string") {
      await logApiUsage({
        userId,
        endpoint: "/api/generate-commit",
        requestSize,
        responseSize,
        tokensUsed: finalTokensUsed,
        success: true,
        ...requestMetadata,
      });
    }

    const responseTime = Date.now() - startTime;

    return NextResponse.json({
      commitMessage,
      analysis: {
        filesChanged: analysis.files.length,
        suggestedType: analysis.suggestedType,
        suggestedScope: analysis.suggestedScope,
        isBreakingChange: analysis.isBreakingChange,
        totalFiles: analysis.stats.totalFiles,
        totalAdditions: analysis.stats.totalAdditions,
        totalDeletions: analysis.stats.totalDeletions,
      },
      metadata: {
        tokensUsed: finalTokensUsed,
        responseTime,
        remaining_commits: rateLimitResult.remaining_monthly || 0,
      },
    });
  } catch (error) {
    console.error("Commit generation error:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    // Calculate request size for error logging
    let errorRequestSize = requestSize;
    if (errorRequestSize === 0) {
      try {
        const body = await request.clone().json();
        errorRequestSize = JSON.stringify(body).length;
      } catch {
        errorRequestSize = 0;
      }
    }

    // Log failed usage if we have userId
    if (typeof userId === "string") {
      const requestMetadata = extractRequestMetadata(request);
      await logApiUsage({
        userId,
        endpoint: "/api/generate-commit",
        requestSize: errorRequestSize,
        responseSize: 0,
        tokensUsed: Math.ceil(errorRequestSize / 4),
        success: false,
        errorMessage,
        ...requestMetadata,
      });
    }

    return NextResponse.json(
      { error: "Failed to generate commit message" },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({ status: "ok", service: "commit-generation" });
}