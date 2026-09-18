import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requirePlatformApiSession } from '@/lib/whatsai-business';
import { serviceClientOrNull } from '@/lib/sales-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const agentKeySchema = z.enum(['summoner', 'sales', 'tool_gateway', 'content', 'ads', 'ghost_closer', 'colony', 'finance']);
const updateSchema = z.object({
  status: z.enum(['enabled', 'paused', 'disabled']).optional(),
  max_risk_level: z.enum(['L0', 'L1', 'L2', 'L3', 'L4']).optional(),
  autonomy_enabled: z.boolean().optional(),
  schedule_enabled: z.boolean().optional(),
}).refine((value) => Object.keys(value).length > 0, 'At least one control must be updated.');

export async function PATCH(request: Request, { params }: { params: Promise<{ key: string }> }) {
  const session = await requirePlatformApiSession(['admin', 'dev']);
  const { key: rawKey } = await params;
  const key = agentKeySchema.safeParse(rawKey);
  const update = updateSchema.safeParse(await request.json().catch(() => null));

  if (!key.success || !update.success) {
    return NextResponse.json({ ok: false, error: 'Invalid agent control update.' }, { status: 400 });
  }

  const supabase = serviceClientOrNull();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: 'Supabase service client unavailable.' }, { status: 503 });
  }

  const payload = {
    agent_key: key.data,
    ...update.data,
    ...(update.data.status && update.data.status !== 'enabled'
      ? { autonomy_enabled: false, schedule_enabled: false }
      : {}),
    updated_by: session.user.id,
    updated_at: new Date().toISOString(),
  };

  const result = await (supabase.from('ai_agent_controls') as any)
    .upsert(payload, { onConflict: 'agent_key' })
    .select('agent_key,status,max_risk_level,autonomy_enabled,schedule_enabled,allowed_tools,notes,updated_at')
    .single();

  if (result.error) {
    return NextResponse.json({ ok: false, error: result.error.message }, { status: 500 });
  }

  await (supabase.from('agent_actions') as any).insert({
    source: 'command-os-dashboard',
    mode: 'founder',
    action_type: 'agent_control_update',
    title: `Updated ${key.data} controls`,
    summary: JSON.stringify(update.data),
    risk_level: 'L2',
    status: 'executed',
    approval_required: false,
    evidence: [],
    input: update.data,
    output: result.data,
    created_by: session.user.id,
    executed_by: session.user.id,
    executed_at: new Date().toISOString(),
    result: 'Agent control updated from Command OS.',
  });

  return NextResponse.json({ ok: true, control: result.data });
}
