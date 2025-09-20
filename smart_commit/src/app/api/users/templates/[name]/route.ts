import { NextRequest, NextResponse } from "next/server";
import { validateApiKey } from "../../../../lib/auth";
import { createClient } from "../../../../lib/supabase/server";
import {
  checkEndpointRateLimits,
  ENDPOINT_LIMITS,
} from "../../../../lib/rateLimit";
interface RouteParams {
  params: Promise<{ name: string }>;
}

export async function GET(request: NextRequest, context: RouteParams) {
  try {
    const { name } = await context.params;

    // Get API key from Authorization header
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Missing or invalid Authorization header" },
        { status: 401 }
      );
    }

    const apiKey = authHeader.replace("Bearer ", "");

    // Validate API key
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

    const userId = authResult.userId;
    const rateLimitResult = await checkEndpointRateLimits(
      userId,
      "template-get",
      ENDPOINT_LIMITS.TEMPLATES
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
    const supabase = await createClient();

    const { data: template, error } = await supabase
      .from("user_templates")
      .select("*")
      .eq("user_id", userId)
      .eq("name", decodeURIComponent(name))
      .single();

    if (error || !template) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ template });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, context: RouteParams) {
  try {
    const { name } = await context.params;

    // Get API key from Authorization header
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Missing or invalid Authorization header" },
        { status: 401 }
      );
    }

    const apiKey = authHeader.replace("Bearer ", "");

    // Validate API key
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

    const userId = authResult.userId;
    const rateLimitResult = await checkEndpointRateLimits(
      userId,
      "template-delete",
      ENDPOINT_LIMITS.TEMPLATES
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
    const supabase = await createClient();

    const { error } = await supabase
      .from("user_templates")
      .delete()
      .eq("user_id", userId)
      .eq("name", decodeURIComponent(name));

    if (error) {
      return NextResponse.json(
        { error: "Failed to delete template" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
