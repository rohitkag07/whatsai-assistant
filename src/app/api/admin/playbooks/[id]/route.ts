import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireSelectedAdminBusiness } from '@/lib/admin-control';
import { serviceClientOrNull } from '@/lib/sales-server';
import { BusinessContextError } from '@/lib/whatsai-business';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const schema = z.object({
  business_id: z.string().uuid(),
  is_active: z.boolean(),
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false, error: 'Invalid playbook update.' }, { status: 400 });
  const supabase = serviceClientOrNull();
  if (!supabase) return NextResponse.json({ ok: false, error: 'Supabase unavailable.' }, { status: 503 });

  try {
    const { id } = await context.params;
    const { businessId } = await requireSelectedAdminBusiness(supabase, parsed.data.business_id);
    const result = await (supabase.from('assistant_playbooks') as any)
      .update({ is_active: parsed.data.is_active, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('business_id', businessId)
      .select('id,is_active,updated_at')
      .single();
    if (result.error) throw result.error;
    return NextResponse.json({ ok: true, playbook: result.data });
  } catch (error) {
    const status = error instanceof BusinessContextError ? error.status : 500;
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Playbook update failed.' }, { status });
  }
}
