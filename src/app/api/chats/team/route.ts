import { NextResponse } from 'next/server';
import { serviceClientOrNull } from '@/lib/sales-server';
import { BusinessContextError, requireDashboardBusinessContext } from '@/lib/whatsai-business';

export async function GET(request: Request) {
  const supabase = serviceClientOrNull();
  if (!supabase) return NextResponse.json({ ok: false, error: 'Supabase service client unavailable.' }, { status: 502 });
  try {
    const { businessId } = await requireDashboardBusinessContext(supabase, new URL(request.url).searchParams.get('business_id'));
    const { data, error } = await (supabase.from('business_members') as any).select('user_id, display_name, role').eq('business_id', businessId).eq('active', true).order('role');
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, members: data ?? [] });
  } catch (error) {
    const status = error instanceof BusinessContextError ? error.status : 500;
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'team_members_failed' }, { status });
  }
}
