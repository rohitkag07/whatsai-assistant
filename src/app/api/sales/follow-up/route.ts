import { NextResponse } from 'next/server';
import { z } from 'zod';
import { callSalesAgent, fallbackFollowUp, logAgentRun, serviceClientOrNull } from '@/lib/sales-server';
import { BusinessContextError, requireDashboardBusinessMutationContext } from '@/lib/whatsai-business';

type LegacyMessageWriter = {
  from(table: 'follow_up_queue' | 'whatsapp_messages'): {
    upsert(values: Record<string, unknown>, options: { onConflict: string }): PromiseLike<unknown>;
    insert(values: Record<string, unknown>): PromiseLike<unknown>;
  };
};

const schema = z.object({
  lead_id: z.string().optional(),
  builder_id: z.string().optional(),
  project_id: z.string().optional(),
  lead_name: z.string().min(2),
  lead_stage: z.enum(['new', 'qualified', 'visit_scheduled', 'visited', 'negotiation', 'booked', 'lost']),
  budget_range: z.string().nullable().optional(),
  purpose: z.string().nullable().optional(),
  locale: z.enum(['hi', 'en', 'hi-en']).default('hi-en').optional(),
  trigger: z.string().optional(),
  phone: z.string().optional(),
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.flatten() }, { status: 400 });
  }

  const payload = parsed.data;
  const supabase = serviceClientOrNull();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: 'Supabase service client unavailable.' }, { status: 503 });
  }
  const context = await requireDashboardBusinessMutationContext(supabase).catch((error) => error);
  if (context instanceof Error) {
    const status = context instanceof BusinessContextError ? context.status : 500;
    return NextResponse.json({ ok: false, error: context.message }, { status });
  }
  if (payload.builder_id && context.business.builder_id !== payload.builder_id) {
    return NextResponse.json({ ok: false, error: 'business_context_mismatch' }, { status: 403 });
  }

  const agentResponse = await callSalesAgent<{ ok: boolean; response: Record<string, unknown> }>('/follow-up', payload);
  const response = agentResponse?.response ?? fallbackFollowUp({
    leadName: payload.lead_name,
    leadStage: payload.lead_stage,
    budgetRange: payload.budget_range ?? null,
    locale: payload.locale,
  });

  if (payload.builder_id && payload.lead_id) {
    const legacyWriter = supabase as unknown as LegacyMessageWriter;
    await legacyWriter.from('follow_up_queue').upsert({
      builder_id: payload.builder_id,
      lead_id: payload.lead_id,
      step: `phase2_followup_${payload.lead_stage}`,
      scheduled_for: new Date().toISOString(),
      status: 'pending',
      payload: {
        trigger: payload.trigger ?? 'dashboard',
        body: response,
      },
    }, { onConflict: 'lead_id,step' });

    if (payload.phone) {
      await legacyWriter.from('whatsapp_messages').insert({
        builder_id: payload.builder_id,
        lead_id: payload.lead_id,
        direction: 'outbound',
        phone: payload.phone,
        body: String((response as { bilingual?: string }).bilingual ?? ''),
        message_type: 'text',
        status: 'queued',
        agent: 'sales-agent-proxy',
      });
    }
  }

  await logAgentRun({
    builderId: payload.builder_id,
    leadId: payload.lead_id,
    projectId: payload.project_id,
    action: 'dashboard-follow-up',
    input: payload as Record<string, unknown>,
    output: { response, source: agentResponse ? 'agent' : 'fallback' },
  });

  return NextResponse.json({
    ok: true,
    response,
    source: agentResponse ? 'agent' : 'fallback',
  });
}
