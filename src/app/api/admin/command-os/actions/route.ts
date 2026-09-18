import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requirePlatformApiSession, BusinessContextError } from '@/lib/whatsai-business';
import { serviceClientOrNull } from '@/lib/sales-server';
import { requiresApproval } from '@/lib/command-os-data';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const actionSchema = z.object({
  business_id: z.string().uuid().nullable().optional(),
  mode: z.enum(['founder', 'builder', 'revenue', 'ops', 'sentinel']).default('founder'),
  action_type: z.string().trim().min(2).max(80),
  risk_level: z.enum(['L0', 'L1', 'L2', 'L3', 'L4']),
  title: z.string().trim().min(3).max(160),
  summary: z.string().trim().min(3).max(1200),
  reason: z.string().trim().max(2000).default(''),
  evidence: z.array(z.unknown()).default([]),
  expected_impact: z.string().trim().max(1200).optional(),
  rollback_plan: z.string().trim().max(1200).optional(),
  input: z.record(z.unknown()).default({}),
});

export async function POST(request: Request) {
  const parsed = actionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.flatten() }, { status: 400 });
  }

  const supabase = serviceClientOrNull();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: 'Command OS action surface unavailable.' }, { status: 503 });
  }

  try {
    const session = await requirePlatformApiSession(['admin', 'dev']);
    const settingsResult = await (supabase.from('ai_os_settings') as any)
      .select('mode')
      .eq('id', true)
      .maybeSingle();
    const osMode = settingsResult.data?.mode ?? 'supervised';

    if (osMode === 'paused') {
      return NextResponse.json({ ok: false, error: 'command_os_paused' }, { status: 423 });
    }

    const payload = parsed.data;
    const approvalRequired = osMode === 'read_only' || requiresApproval(payload.risk_level);
    const status = approvalRequired ? 'proposed' : 'executed';
    const now = new Date().toISOString();

    const actionResult = await (supabase.from('agent_actions') as any)
      .insert({
        business_id: payload.business_id ?? null,
        source: 'hermes-single-profile',
        mode: payload.mode,
        action_type: payload.action_type,
        risk_level: payload.risk_level,
        status,
        title: payload.title,
        summary: payload.summary,
        evidence: payload.evidence,
        input: payload.input,
        approval_required: approvalRequired,
        expected_impact: payload.expected_impact ?? null,
        rollback_plan: payload.rollback_plan ?? null,
        created_by: session.user.id,
        executed_by: approvalRequired ? null : session.user.id,
        executed_at: approvalRequired ? null : now,
        result: approvalRequired ? null : 'Recorded as low-risk internal/supervised action.',
      })
      .select('id,title,status,risk_level')
      .single();

    if (actionResult.error) {
      return NextResponse.json({ ok: false, error: actionResult.error.message }, { status: 500 });
    }

    let approval = null;
    if (approvalRequired) {
      const approvalResult = await (supabase.from('agent_approvals') as any)
        .insert({
          action_id: actionResult.data.id,
          business_id: payload.business_id ?? null,
          risk_level: payload.risk_level,
          title: payload.title,
          reason: payload.reason || payload.summary,
          evidence: payload.evidence,
          expected_impact: payload.expected_impact ?? null,
          rollback_plan: payload.rollback_plan ?? null,
          requested_by: session.user.id,
        })
        .select('id,status')
        .single();

      if (approvalResult.error) {
        return NextResponse.json({ ok: false, error: approvalResult.error.message }, { status: 500 });
      }

      approval = approvalResult.data;
      await (supabase.from('agent_actions') as any)
        .update({ approval_id: approval.id })
        .eq('id', actionResult.data.id);
    }

    return NextResponse.json({ ok: true, action: actionResult.data, approval });
  } catch (error) {
    const status = error instanceof BusinessContextError ? error.status : 500;
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Command OS action failed.' },
      { status },
    );
  }
}
