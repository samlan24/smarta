import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/app/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all integrations for the user
    const { data: integrations, error } = await supabase
      .from('git_integrations')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true);

    if (error) {
      console.error('Error fetching integrations:', error);
      return NextResponse.json({ error: 'Failed to fetch integrations' }, { status: 500 });
    }

    // Format response by platform
    const result: Record<string, any> = {};
    
    for (const integration of integrations || []) {
      result[integration.platform] = {
        id: integration.id,
        platform: integration.platform,
        username: integration.username,
        avatar_url: integration.avatar_url,
        connected_at: integration.connected_at,
        last_sync_at: integration.last_sync_at,
        is_active: integration.is_active
      };
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error('Integration status API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
