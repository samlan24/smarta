import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../../lib/supabase/server";

interface RouteParams {
  params: Promise<{ name: string }>;
}

export async function DELETE(
  request: NextRequest,
  context: RouteParams
) {
  try {
    const { name } = await context.params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { error } = await supabase
      .from('user_templates')
      .delete()
      .eq('user_id', user.id)
      .eq('name', decodeURIComponent(name));

    if (error) {
      return NextResponse.json({ error: "Failed to delete template" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}