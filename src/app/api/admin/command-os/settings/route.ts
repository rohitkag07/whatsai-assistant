import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requirePlatformApiSession, BusinessContextError } from '@/lib/whatsai-business';
import { serviceClientOrNull } from '@/lib/sales-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const schema = z.object({
  mode: z.enum(['read_only', 'supervised', 'paused']).optional(),
  external_comms_enabled: z.boolean().optional(),
  production_writes_enabled: z.boolean().optional(),
  deployments_enabled: z.boolean().optional(),
  mcp_writes_enabled: z.boolean().optional(),
  cron_enabled: z.boolean().optional(),
});

export async function PATCH(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.flatten() }, { status: 400 });
  }

  const supabase = serviceClientOrNull();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: 'Command OS settings unavailable.' }, { status: 503 });
  }

  try {
    const session = await requirePlatformApiSession(['admin', 'dev']);
    const payload = parsed.data;
    const update = {
      ...payload,
      updated_by: session.user.id,
      updated_at: new Date().toISOString(),
    };

    const result = await (supabase.from('ai_os_settings') as any)
      .upsert({ id: true, ...update }, { onConflict: 'id' })
      .select('mode,external_comms_enabled,production_writes_enabled,deployments_enabled,mcp_writes_enabled,cron_enabled,notes,updated_at')
      .single();

    if (result.error) {
      return NextResponse.json({ ok: false, error: result.error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, settings: result.data });
  } catch (error) {
    const status = error instanceof BusinessContextError ? error.status : 500;
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Command OS settings update failed.' },
      { status },
    );
  }
}
