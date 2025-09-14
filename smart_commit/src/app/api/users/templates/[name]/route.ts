import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../../lib/supabase/server";

export async function GET(
  request: NextRequest,
  context: Promise<{ params: { name: string } }>
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { params } = await context;
    const { data: template, error } = await supabase
      .from('user_templates')
      .select('*')
      .eq('user_id', user.id)
      .eq('name', decodeURIComponent(params.name))
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
  context: Promise<{ params: { name: string } }>
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { params } = await context;
    const { error } = await supabase
      .from('user_templates')
      .delete()
      .eq('user_id', user.id)
      .eq('name', decodeURIComponent(params.name));

    if (error) {
      return NextResponse.json({ error: "Failed to delete template" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
