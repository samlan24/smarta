import { createClient } from "../../../lib/supabase/server";
import { NextResponse } from "next/server";
import {
  checkEndpointRateLimits,
  ENDPOINT_LIMITS,
} from "../../../lib/rateLimit";

export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rateLimitResult = await checkEndpointRateLimits(
      user.id,
      "api-key-generate",
      ENDPOINT_LIMITS.API_KEYS
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

    // Generate new API key using your database function
    const { data: apiKeyData, error } = await supabase.rpc("generate_api_key");

    if (error) throw error;

    // Insert the new API key
    const { data: newKey, error: insertError } = await supabase
      .from("user_api_keys")
      .insert({
        user_id: user.id,
        api_key: apiKeyData,
        name: "CLI Key",
      })
      .select("id, api_key, name, created_at")
      .single();

    if (insertError) throw insertError;

    return NextResponse.json({ apiKey: newKey });
  } catch (error) {
    console.error("API key generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate API key" },
      { status: 500 }
    );
  }
}

// Get user's existing API keys
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

    const rateLimitResult = await checkEndpointRateLimits(
      user.id,
      "api-key-list",
      ENDPOINT_LIMITS.API_KEYS
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

    const { data: keys, error } = await supabase
      .from("user_api_keys")
      .select("id, api_key, name, is_active, last_used_at, created_at")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ apiKeys: keys });
  } catch (error) {
    console.error("API keys fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch API keys" },
      { status: 500 }
    );
  }
}
