import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../lib/supabase/server";
import { checkFeatureAccess, getUserPlan } from "../../../lib/planManager";
import { checkEndpointRateLimits, ENDPOINT_LIMITS } from "../../../lib/rateLimit";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user from session
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate limiting
    const rateLimitResult = await checkEndpointRateLimits(
      user.id,
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

    // Get templates
    const { data: templates, error } = await supabase
      .from("user_templates")
      .select("id, name, message, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: "Failed to fetch templates" },
        { status: 500 }
      );
    }

    // Get plan info
    const planInfo = await getUserPlan(user.id);

    return NextResponse.json({
      templates,
      planInfo: planInfo ? {
        planName: planInfo.planName,
        templateLimit: planInfo.features.commit_templates
      } : null
    });

  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user from session
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate limiting
    const rateLimitResult = await checkEndpointRateLimits(
      user.id,
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

    // Check plan limits
    const templateCheck = await checkFeatureAccess(user.id, 'commit_templates', 1);
    if (!templateCheck.allowed) {
      return NextResponse.json(
        {
          error: templateCheck.error,
          upgrade_required: templateCheck.upgrade_required,
          current_usage: templateCheck.current_usage,
          limit: templateCheck.limit,
          feature: "templates",
        },
        { status: templateCheck.upgrade_required ? 402 : 429 }
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

    // Create template
    const { data: template, error } = await supabase
      .from("user_templates")
      .insert({
        user_id: user.id,
        name: name.trim(),
        message: message.trim(),
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
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