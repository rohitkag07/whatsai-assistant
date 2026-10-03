import { NextResponse } from 'next/server';
import { z } from 'zod';
import {
  buildVisitReminderSteps,
  fallbackBookingConfirmation,
  logAgentRun,
  serviceClientOrNull,
} from '@/lib/sales-server';
import { persistLeadToAppointmentFlow } from '@/lib/whatsai-lead-flow';
import { sendWhatsAppCloudMessage } from '@/lib/whatsapp-cloud-api';
import { BusinessContextError, requireDashboardBusinessMutationContext } from '@/lib/whatsai-business';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const schema = z.object({
  business_id: z.string().optional().nullable(),
  business_channel_id: z.string().optional().nullable(),
  contact_id: z.string().optional().nullable(),
  thread_id: z.string().optional().nullable(),
  lead_id: z.string().min(1),
  builder_id: z.string().optional().nullable(),
  project_id: z.string().optional().nullable(),
  lead_name: z.string().min(2),
  phone: z.string().min(8),
  scheduled_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  scheduled_time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  locale: z.enum(['hi', 'en', 'hi-en']).default('hi-en').optional(),
  send_via_whatsapp: z.boolean().default(true).optional(),
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
  const context = await requireDashboardBusinessMutationContext(supabase, payload.business_id).catch((error) => error);
  if (context instanceof Error) {
    const status = context instanceof BusinessContextError ? context.status : 500;
    return NextResponse.json({ ok: false, error: context.message }, { status });
  }

  const scheduledAt = new Date(`${payload.scheduled_date}T${payload.scheduled_time}:00+05:30`);
  if (Number.isNaN(scheduledAt.getTime())) {
    return NextResponse.json({ ok: false, error: 'Invalid site-visit slot.' }, { status: 400 });
  }

  const builderId = context.business.builder_id ?? payload.builder_id ?? context.businessId;
  const flow = await persistLeadToAppointmentFlow(supabase, {
    businessId: context.businessId,
    builderId,
    projectId: payload.project_id,
    businessChannelId: payload.business_channel_id,
    contactId: payload.contact_id,
    threadId: payload.thread_id,
    leadId: payload.lead_id,
    phone: payload.phone,
    name: payload.lead_name,
    source: 'manual',
    appointmentAt: scheduledAt.toISOString(),
    appointmentType: 'site_visit',
  });

  if (!flow.appointment || !flow.thread || !flow.contact) {
    return NextResponse.json({ ok: false, error: 'Tenant-scoped site visit could not be persisted.' }, { status: 500 });
  }

  const confirmation = fallbackBookingConfirmation({
    date: payload.scheduled_date,
    time: payload.scheduled_time,
    locale: payload.locale,
  });
  const reminderSteps = buildVisitReminderSteps({
    leadName: payload.lead_name,
    date: payload.scheduled_date,
    time: payload.scheduled_time,
    locale: payload.locale,
  });
  const leadId = typeof flow.lead?.id === 'string' ? flow.lead.id : payload.lead_id;

  const outbound = payload.send_via_whatsapp === false
    ? { ok: false, status: 'queued' as const, error: 'send_disabled' }
    : await sendConfirmation(supabase, context.businessId, payload.phone, confirmation.bilingual);

  await (supabase.from('conversation_messages') as any).insert({
    business_id: context.businessId,
    builder_id: builderId,
    thread_id: flow.thread.id,
    contact_id: flow.contact.id,
    lead_id: leadId,
    direction: 'outbound',
    role: 'assistant',
    channel: 'whatsapp',
    message_type: 'text',
    content: confirmation.bilingual,
    body: confirmation.bilingual,
    provider_msg_id: 'messageId' in outbound ? outbound.messageId : null,
    status: outbound.status,
    agent: 'xerowa-site-visit-confirmation',
    metadata: {
      appointment_id: flow.appointment.id,
      appointment_type: 'site_visit',
      error: outbound.error,
    },
  });

  // Compatibility path: the existing sales dispatcher consumes this queue.
  // Removing it requires a dedicated, live-safe database migration.
  await (supabase.from('follow_up_queue') as any).upsert(
    reminderSteps.map((step) => ({
      builder_id: builderId,
      lead_id: leadId,
      step: `visit_reminder_${step.step}`,
      scheduled_for: step.scheduled_for,
      status: 'pending',
      payload: {
        business_id: context.businessId,
        thread_id: flow.thread?.id,
        contact_id: flow.contact?.id,
        appointment_id: flow.appointment?.id,
        visit_date: payload.scheduled_date,
        visit_time: payload.scheduled_time,
        body: step.body.bilingual,
      },
    })),
    { onConflict: 'lead_id,step' },
  );

  await logAgentRun({
    builderId,
    leadId,
    projectId: payload.project_id,
    action: 'dashboard-book-site-visit',
    input: { ...payload, business_id: context.businessId },
    output: {
      appointment: flow.appointment,
      handoff: flow.handoff,
      reminderSteps,
      outbound,
      storage: 'appointments',
    },
  });

  return NextResponse.json({
    ok: true,
    appointment: flow.appointment,
    visit: {
      ...flow.appointment,
      scheduled_date: payload.scheduled_date,
      scheduled_time: payload.scheduled_time,
      status: 'scheduled',
    },
    handoff: flow.handoff,
    response: confirmation,
    reminder_steps: reminderSteps,
    outbound,
    source: 'tenant_appointment',
  });
}

async function sendConfirmation(supabase: any, businessId: string, phone: string, body: string) {
  const channel = await (supabase.from('business_channels') as any)
    .select('channel_id,phone_number_id,config')
    .eq('business_id', businessId)
    .eq('is_active', true)
    .or('channel_type.eq.whatsapp,provider.eq.meta_whatsapp')
    .order('is_primary', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (channel.error || !channel.data) {
    return { ok: false, status: 'failed' as const, error: channel.error?.message ?? 'whatsapp_channel_missing' };
  }

  const token = channel.data.config?.whatsapp_access_token || channel.data.config?.access_token || process.env.WHATSAPP_ACCESS_TOKEN;
  return sendWhatsAppCloudMessage({
    to: phone,
    phoneNumberId: channel.data.phone_number_id || channel.data.channel_id,
    accessToken: typeof token === 'string' ? token : null,
    message: { type: 'text', body },
  });
}
