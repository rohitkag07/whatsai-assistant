import { NextResponse } from 'next/server';
import { z } from 'zod';
import { logAgentRun, serviceClientOrNull } from '@/lib/sales-server';
import { BusinessContextError, requireDashboardBusinessContext } from '@/lib/whatsai-business';

const schema = z.object({
  id: z.string().min(1),
  business_id: z.string().optional().nullable(),
  lead_id: z.string().optional().nullable(),
  feedback: z.string().min(2),
  interest_level: z.enum(['very_high', 'high', 'medium', 'low']),
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.flatten() }, { status: 400 });
  }

  const supabase = serviceClientOrNull();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: 'Supabase service client unavailable.' }, { status: 503 });
  }

  const payload = parsed.data;
  const context = await requireDashboardBusinessContext(supabase, payload.business_id).catch((error) => error);
  if (context instanceof Error) {
    const status = context instanceof BusinessContextError ? context.status : 500;
    return NextResponse.json({ ok: false, error: context.message }, { status });
  }

  const existing = await (supabase.from('appointments') as any)
    .select('id,thread_id,contact_id,title,appointment_type,scheduled_at,status,notes')
    .eq('id', payload.id)
    .eq('business_id', context.businessId)
    .eq('appointment_type', 'site_visit')
    .maybeSingle();

  if (existing.error) {
    return NextResponse.json({ ok: false, error: existing.error.message }, { status: 400 });
  }
  if (!existing.data) {
    return NextResponse.json({ ok: false, error: 'Tenant-scoped site visit not found.' }, { status: 404 });
  }

  const notes = [
    existing.data.notes,
    `Post-visit interest: ${payload.interest_level}`,
    `Post-visit feedback: ${payload.feedback}`,
  ].filter(Boolean).join('\n');

  const updated = await (supabase.from('appointments') as any)
    .update({ status: 'completed', notes, updated_at: new Date().toISOString() })
    .eq('id', payload.id)
    .eq('business_id', context.businessId)
    .select('id,thread_id,contact_id,title,appointment_type,scheduled_at,status,notes')
    .single();

  if (updated.error || !updated.data) {
    return NextResponse.json({ ok: false, error: updated.error?.message ?? 'Feedback update failed.' }, { status: 400 });
  }

  if (existing.data.thread_id && (payload.interest_level === 'very_high' || payload.interest_level === 'high')) {
    await (supabase.from('handoff_events') as any).insert({
      business_id: context.businessId,
      thread_id: existing.data.thread_id,
      reason: 'site_visit_feedback_owner_followup',
      priority: payload.interest_level === 'very_high' ? 'high' : 'medium',
      status: 'pending',
      summary: payload.feedback,
    });
  }

  const builderId = context.business.builder_id ?? context.businessId;
  await logAgentRun({
    builderId,
    leadId: payload.lead_id,
    action: 'dashboard-site-visit-feedback',
    input: { ...payload, business_id: context.businessId },
    output: { appointment: updated.data },
  });

  return NextResponse.json({ ok: true, appointment: updated.data, visit: updated.data });
}
