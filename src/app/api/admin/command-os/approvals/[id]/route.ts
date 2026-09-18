import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requirePlatformApiSession } from '@/lib/whatsai-business';
import { serviceClientOrNull } from '@/lib/sales-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const decisionSchema = z.object({
  decision: z.enum(['approved', 'rejected']),
  notes: z.string().trim().max(1000).optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requirePlatformApiSession(['admin', 'dev']);
  const { id } = await params;
  const parsed = decisionSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: 'Invalid approval decision.' }, { status: 400 });
  }

  const supabase = serviceClientOrNull();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: 'Supabase service client unavailable.' }, { status: 503 });
  }

  const decidedAt = new Date().toISOString();
  const approvalUpdate = await (supabase.from('agent_approvals') as any)
    .update({
      status: parsed.data.decision,
      decided_by: session.user.id,
      decided_at: decidedAt,
      decision_notes: parsed.data.notes ?? null,
      updated_at: decidedAt,
    })
    .eq('id', id)
    .eq('status', 'pending')
    .select('id,action_id,status')
    .maybeSingle();

  if (approvalUpdate.error) {
    return NextResponse.json({ ok: false, error: approvalUpdate.error.message }, { status: 500 });
  }

  if (!approvalUpdate.data) {
    return NextResponse.json({ ok: false, error: 'Approval is not pending or does not exist.' }, { status: 404 });
  }

  if (approvalUpdate.data.action_id) {
    const actionStatus = parsed.data.decision === 'approved' ? 'approved' : 'rejected';
    const actionUpdate = await (supabase.from('agent_actions') as any)
      .update({
        status: actionStatus,
        updated_at: decidedAt,
      })
      .eq('id', approvalUpdate.data.action_id);

    if (actionUpdate.error) {
      return NextResponse.json({ ok: false, error: actionUpdate.error.message }, { status: 500 });
    }
  }

  return NextResponse.json({
    ok: true,
    approval_id: id,
    status: parsed.data.decision,
    decided_at: decidedAt,
  });
}
