import { NextRequest, NextResponse } from "next/server";
import { validateApiKey } from "../../../lib/auth";
import { createClient } from "../../../lib/supabase/server";
import {
  checkEndpointRateLimits,
  ENDPOINT_LIMITS,
} from "../../../lib/rateLimit";

export async function GET(request: NextRequest) {
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
      "templates-get",
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

    const { data: templates, error } = await supabase
      .from("user_templates")
      .select("id, name, message, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: "Failed to fetch templates" },
        { status: 500 }
      );
    }

    return NextResponse.json({ templates });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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
      "templates-create",
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
    const { name, message } = await request.json();

    // Validation
    if (!name || !message) {
      return NextResponse.json(
        { error: "Name and message are required" },
        { status: 400 }
      );
    }

    if (name.length > 100) {
      return NextResponse.json(
        { error: "Template name too long (max 100 characters)" },
        { status: 400 }
      );
    }

    if (message.length > 500) {
      return NextResponse.json(
        { error: "Template message too long (max 500 characters)" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Check template count limit
    const { count } = await supabase
      .from("user_templates")
      .select("*", { count: "exact" })
      .eq("user_id", userId);

    if (count && count >= 20) {
      return NextResponse.json(
        { error: "Maximum 20 templates allowed" },
        { status: 400 }
      );
    }

    const { data: template, error } = await supabase
      .from("user_templates")
      .insert({
        user_id: userId,
        name: name.trim(),
        message: message.trim(),
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        // Unique constraint violation
        return NextResponse.json(
          { error: "Template name already exists" },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { error: "Failed to create template" },
        { status: 500 }
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
