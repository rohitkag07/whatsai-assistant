import { NextResponse } from 'next/server';
import { z } from 'zod';
import { serviceClientOrNull } from '@/lib/sales-server';
import { BusinessContextError, requireDashboardBusinessContext } from '@/lib/whatsai-business';

const schema = z.object({ business_id: z.string().uuid(), assigned_user_id: z.string().uuid().nullable() });

export async function PATCH(request: Request, { params }: { params: Promise<{ threadId: string }> }) {
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ ok: false, error: parsed.error.flatten() }, { status: 400 });
  const { threadId } = await params;
  const supabase = serviceClientOrNull();
  if (!supabase) return NextResponse.json({ ok: false, error: 'Supabase service client unavailable.' }, { status: 502 });
  const payload = parsed.data;
  const context = await requireDashboardBusinessContext(supabase, payload.business_id).catch((error) => error);
  if (context instanceof Error) {
    const status = context instanceof BusinessContextError ? context.status : 500;
    return NextResponse.json({ ok: false, error: context.message }, { status });
  }
  const businessId = context.businessId;
  let displayName: string | null = null;
  if (payload.assigned_user_id) {
    const { data: member, error } = await (supabase.from('business_members') as any).select('display_name').eq('business_id', businessId).eq('user_id', payload.assigned_user_id).eq('active', true).maybeSingle();
    if (error || !member) return NextResponse.json({ ok: false, error: 'Team member not found for this business.' }, { status: 404 });
    displayName = member.display_name || 'Team member';
  }
  const { data, error } = await (supabase.from('conversation_threads') as any)
    .update({ assigned_user_id: payload.assigned_user_id, assigned_to: displayName, updated_at: new Date().toISOString() })
    .eq('id', threadId).eq('business_id', businessId).select().maybeSingle();
  if (error || !data) return NextResponse.json({ ok: false, error: error?.message || 'Thread not found for this business.' }, { status: 404 });
  return NextResponse.json({ ok: true, thread: data });
}
