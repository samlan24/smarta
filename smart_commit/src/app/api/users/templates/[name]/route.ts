import { NextRequest, NextResponse } from "next/server";
import { validateApiKey } from "../../../../lib/auth";
import { createClient } from "../../../../lib/supabase/server";

interface RouteParams {
  params: Promise<{ name: string }>;
}

export async function GET(
  request: NextRequest,
  context: RouteParams
) {
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
    const supabase = await createClient();

    const { data: template, error } = await supabase
      .from('user_templates')
      .select('*')
      .eq('user_id', userId)
      .eq('name', decodeURIComponent(name))
      .single();

    if (error || !template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    return NextResponse.json({ template });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  context: RouteParams
) {
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
    const supabase = await createClient();

    const { error } = await supabase
      .from('user_templates')
      .delete()
      .eq('user_id', userId)
      .eq('name', decodeURIComponent(name));

    if (error) {
      return NextResponse.json({ error: "Failed to delete template" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}