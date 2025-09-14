import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: templates, error } = await supabase
      .from('user_templates')
      .select('id, name, message, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: "Failed to fetch templates" }, { status: 500 });
    }

    return NextResponse.json({ templates });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, message } = await request.json();

    // Validation
    if (!name || !message) {
      return NextResponse.json({ error: "Name and message are required" }, { status: 400 });
    }

    if (name.length > 100) {
      return NextResponse.json({ error: "Template name too long (max 100 characters)" }, { status: 400 });
    }

    if (message.length > 100) {
      return NextResponse.json({ error: "Template message too long (max 100 characters)" }, { status: 400 });
    }

    // Check template count limit
    const { count } = await supabase
      .from('user_templates')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id);

    if (count && count >= 20) {
      return NextResponse.json({ error: "Maximum 20 templates allowed" }, { status: 400 });
    }

    const { data: template, error } = await supabase
      .from('user_templates')
      .insert({
        user_id: user.id,
        name: name.trim(),
        message: message.trim()
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') { // Unique constraint violation
        return NextResponse.json({ error: "Template name already exists" }, { status: 409 });
      }
      return NextResponse.json({ error: "Failed to create template" }, { status: 500 });
    }

    return NextResponse.json({ template });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}