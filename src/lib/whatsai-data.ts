import 'server-only';

import { callSalesAgent, serviceClientOrNull } from '@/lib/sales-server';
import { createClient } from '@/lib/supabase/server';
import { resolveDashboardBusiness } from '@/lib/whatsai-business';
import type { AiMode, Appointment, Business, ConversationStage, ConversationContact, ConversationMessage, ConversationStatus, ConversationThread, HandoffEvent, Lead, LeadQualificationAnswer } from '@/types/database';

export type WhatsAiReadSource = 'supabase' | 'error';

export type WhatsAiThread = {
  id: string;
  phone: string;
  contactName: string;
  profilePictureUrl: string | null;
  firstSeenAt: string;
  leadId: string | null;
  builderId: string;
  businessId: string | null;
  contactId: string | null;
  stage: ConversationStage;
  temperature: Lead['temperature'];
  assignedTo: string | null;
  assignedUserId: string | null;
  tags: string[];
  unreadCount: number;
  inboundCount: number;
  outboundCount: number;
  lastMessageAt: string;
  lastBody: string;
  status: ConversationStatus;
  aiMode: AiMode;
  summary: string | null;
  internalNote: string;
  handoffReason: string | null;
  qualification: {
    answered: number;
    total: number;
    nextQuestion: string | null;
    qualified: boolean;
    answers: Array<{
      question: string;
      answer: string;
      confidence: number | null;
    }>;
  };
  appointment: {
    id: string;
    status: Appointment['status'];
    scheduledAt: string;
    type: Appointment['appointment_type'];
    title: string;
  } | null;
  appointments: Array<{
    id: string;
    status: Appointment['status'];
    scheduledAt: string;
    type: Appointment['appointment_type'];
    title: string;
    notes: string | null;
  }>;
  hotHandoff: {
    id: string;
    reason: string;
    summary: string;
    priority: string;
    status: string;
  } | null;
  aiRecommendation: string;
};

export type WhatsAiMessage = {
  id: string;
  direction: 'inbound' | 'outbound';
  body: string;
  status: ConversationMessage['status'];
  messageType: ConversationMessage['message_type'];
  agent: string | null;
  createdAt: string;
  authorType: 'customer' | 'ai' | 'human' | 'system';
};

export type WhatsAiBusinessSummary = {
  business: Pick<Business, 'id' | 'name' | 'category' | 'status' | 'plan' | 'trial_ends_at' | 'daily_message_limit'> | null;
  metrics: {
    totalThreads: number;
    unreadThreads: number;
    hotThreads: number;
    inboundToday: number;
    outboundToday: number;
    humanHandoffs: number;
    aiPausedThreads: number;
  };
};

export type WhatsAiInboxData = {
  source: WhatsAiReadSource;
  error: string | null;
  summary: WhatsAiBusinessSummary;
  threads: WhatsAiThread[];
  selectedThread: WhatsAiThread | null;
  messages: WhatsAiMessage[];
};

type CanonicalInboxInput = {
  source: WhatsAiReadSource;
  error?: string | null;
  threads: ConversationThread[];
  messages: ConversationMessage[];
  contacts: ConversationContact[];
  leads: Lead[];
  qualificationAnswers: LeadQualificationAnswer[];
  appointments: Appointment[];
  handoffs: HandoffEvent[];
  business: WhatsAiBusinessSummary['business'];
  humanHandoffs: number;
  selectedPhone?: string | null;
};

type OperatorLeadsResponse = {
  ok: boolean;
  business: WhatsAiBusinessSummary['business'] & { builder_id?: string | null };
  threads: ConversationThread[];
  messages: ConversationMessage[];
  contacts: ConversationContact[];
  leads: Lead[];
  qualification_answers: LeadQualificationAnswer[];
  appointments: Appointment[];
  handoffs: HandoffEvent[];
};

export async function loadOperatorLeadsData({ businessId }: { businessId?: string } = {}): Promise<WhatsAiInboxData> {
  const tenantClient = serviceClientOrNull();
  if (!tenantClient) {
    return buildOperatorLeadError('Your lead pipeline is temporarily unavailable. Please try again.');
  }

  let business;
  try {
    business = await resolveDashboardBusiness(tenantClient, businessId);
  } catch (error) {
    return buildOperatorLeadError(
      error instanceof Error ? error.message : 'The dashboard business context could not be resolved.',
    );
  }

  const builderId = business.builder_id ?? process.env.DEFAULT_BUILDER_ID ?? null;
  const response = await callSalesAgent<OperatorLeadsResponse>(
    '/operator/leads/list',
    {
      business_id: business.id,
      builder_id: builderId,
      limit: 120,
    },
    { auditMode: 'summary' },
  );

  if (!response?.ok) {
    return buildOperatorLeadError(
      'Live lead data could not be loaded. Please try again shortly.',
    );
  }

  return buildCanonicalInbox({
    source: 'supabase',
    threads: response.threads,
    messages: response.messages,
    contacts: response.contacts,
    leads: response.leads,
    qualificationAnswers: response.qualification_answers,
    appointments: response.appointments,
    handoffs: response.handoffs,
    business: response.business,
    humanHandoffs: response.handoffs.length,
  });
}

export async function loadWhatsAiInboxData({ businessId, selectedPhone = null }: { businessId: string; selectedPhone?: string | null }): Promise<WhatsAiInboxData> {
  const client = await getReadClientOrNull();
  if (!client) {
    return buildCanonicalInbox({
      source: 'error',
      error: 'Your customer inbox is temporarily unavailable. Please refresh the page.',
      threads: [],
      messages: [],
      contacts: [],
      leads: [],
      qualificationAnswers: [],
      appointments: [],
      handoffs: [],
      business: null,
      humanHandoffs: 0,
      selectedPhone,
    });
  }

  const [threadsResult, messagesResult, contactsResult, appointmentsResult, businessResult, handoffsResult] = await Promise.all([
    (client.from('conversation_threads') as any).select('*').eq('business_id', businessId).order('last_message_at', { ascending: false, nullsFirst: false }).limit(200),
    (client.from('conversation_messages') as any).select('*').eq('business_id', businessId).order('created_at', { ascending: false }).limit(1000),
    (client.from('conversation_contacts') as any).select('*').eq('business_id', businessId).order('last_message_at', { ascending: false, nullsFirst: false }).limit(500),
    (client.from('appointments') as any).select('*').eq('business_id', businessId).order('scheduled_at', { ascending: false }).limit(300),
    (client.from('businesses') as any).select('id,name,category,status,plan,trial_ends_at,daily_message_limit').eq('id', businessId).maybeSingle(),
    (client.from('handoff_events') as any).select('*').eq('business_id', businessId).in('status', ['open', 'pending']).limit(200),
  ]);

  const fatalError = threadsResult.error || messagesResult.error || contactsResult.error;
  if (fatalError) {
    return buildCanonicalInbox({
      source: 'error',
      error: fatalError.message ?? 'Customer conversations could not be loaded.',
      threads: [],
      messages: [],
      contacts: [],
      leads: [],
      qualificationAnswers: [],
      appointments: [],
      handoffs: [],
      business: null,
      humanHandoffs: 0,
      selectedPhone,
    });
  }

  const scopedThreads = (threadsResult.data ?? []) as ConversationThread[];
  const scopedContacts = (contactsResult.data ?? []) as ConversationContact[];
  const threadIds = scopedThreads.map((thread) => thread.id);
  const leadIds = Array.from(new Set([...scopedThreads.map((thread) => thread.lead_id), ...scopedContacts.map((contact) => contact.lead_id)].filter(Boolean))) as string[];
  const qualificationResult = threadIds.length
    ? await (client.from('lead_qualification_answers') as any).select('*').in('thread_id', threadIds).order('extracted_at', { ascending: false }).limit(1000)
    : { data: [], error: null };
  const leadsResult = leadIds.length
    ? await (client.from('leads') as any).select('*').in('id', leadIds).order('created_at', { ascending: false }).limit(300)
    : { data: [], error: null };

  return buildCanonicalInbox({
    source: 'supabase',
    threads: (threadsResult.data ?? []) as ConversationThread[],
    messages: (messagesResult.data ?? []) as ConversationMessage[],
    contacts: (contactsResult.data ?? []) as ConversationContact[],
    leads: (leadsResult.data ?? []) as Lead[],
    qualificationAnswers: qualificationResult.error ? [] : ((qualificationResult.data ?? []) as LeadQualificationAnswer[]),
    appointments: appointmentsResult.error ? [] : ((appointmentsResult.data ?? []) as Appointment[]),
    handoffs: handoffsResult.error ? [] : ((handoffsResult.data ?? []) as HandoffEvent[]),
    business: businessResult.error ? null : (businessResult.data ?? null),
    humanHandoffs: handoffsResult.error ? 0 : (handoffsResult.data ?? []).length,
    selectedPhone,
  });
}

function buildOperatorLeadError(error: string): WhatsAiInboxData {
  return buildCanonicalInbox({
    source: 'error',
    error,
    threads: [],
    messages: [],
    contacts: [],
    leads: [],
    qualificationAnswers: [],
    appointments: [],
    handoffs: [],
    business: null,
    humanHandoffs: 0,
  });
}

function buildCanonicalInbox({ source, error = null, threads, messages, contacts, leads, qualificationAnswers, appointments, handoffs, business, humanHandoffs, selectedPhone }: CanonicalInboxInput): WhatsAiInboxData {
  const contactsById = new Map(contacts.map((contact) => [contact.id, contact]));
  const leadsById = new Map(leads.map((lead) => [lead.id, lead]));
  const messagesByThread = new Map<string, ConversationMessage[]>();
  const qualificationsByThread = groupBy(qualificationAnswers, 'thread_id');
  const appointmentsByThread = groupBy(
    appointments.filter((appointment) => appointment.thread_id),
    'thread_id',
  );
  const handoffsByThread = groupBy(
    handoffs.filter((handoff) => handoff.thread_id),
    'thread_id',
  );

  for (const message of messages) {
    if (!message.thread_id) continue;
    messagesByThread.set(message.thread_id, [...(messagesByThread.get(message.thread_id) ?? []), message]);
  }

  const mappedThreads = threads.map((thread) => buildCanonicalThread(thread, messagesByThread.get(thread.id) ?? [], contactsById, leadsById, business?.id ?? thread.business_id ?? null, qualificationsByThread.get(thread.id) ?? [], appointmentsByThread.get(thread.id) ?? [], handoffsByThread.get(thread.id) ?? [])).sort((left, right) => right.lastMessageAt.localeCompare(left.lastMessageAt));

  const selected = pickSelectedThread(mappedThreads, selectedPhone);
  const selectedMessages = selected ? (messagesByThread.get(selected.id) ?? []).sort((left, right) => left.created_at.localeCompare(right.created_at)).map(mapCanonicalMessage) : [];
  const today = new Date().toISOString().slice(0, 10);

  return {
    source,
    error,
    summary: {
      business,
      metrics: {
        totalThreads: mappedThreads.length,
        unreadThreads: mappedThreads.filter((thread) => thread.unreadCount > 0).length,
        hotThreads: mappedThreads.filter((thread) => thread.temperature === 'hot').length,
        inboundToday: messages.filter((message) => message.direction === 'inbound' && message.created_at.startsWith(today)).length,
        outboundToday: messages.filter((message) => message.direction === 'outbound' && message.created_at.startsWith(today)).length,
        humanHandoffs,
        aiPausedThreads: mappedThreads.filter((thread) => thread.aiMode === 'manual' || thread.aiMode === 'paused').length,
      },
    },
    threads: mappedThreads,
    selectedThread: selected,
    messages: selectedMessages,
  };
}

function buildCanonicalThread(thread: ConversationThread, rows: ConversationMessage[], contactsById: Map<string, ConversationContact>, leadsById: Map<string, Lead>, businessId: string | null, qualificationRows: LeadQualificationAnswer[], appointmentRows: Appointment[], handoffRows: HandoffEvent[]): WhatsAiThread {
  const sorted = [...rows].sort((left, right) => right.created_at.localeCompare(left.created_at));
  const last = sorted[0];
  const contact = thread.contact_id ? (contactsById.get(thread.contact_id) ?? null) : null;
  const lead = (thread.lead_id ? leadsById.get(thread.lead_id) : null) ?? (contact?.lead_id ? leadsById.get(contact.lead_id) : null) ?? null;
  const inboundCount = rows.filter((row) => row.direction === 'inbound').length;
  const outboundCount = rows.filter((row) => row.direction === 'outbound').length;
  const lastBody = last?.body ?? thread.summary ?? 'No messages yet';
  const phone = contact?.phone ?? lead?.phone ?? 'unknown';
  const metadata = asRecord(thread.metadata);
  const contactMetadata = asRecord(contact?.metadata);
  const metadataQualification = asRecord(metadata.qualification_step);
  const metadataAppointment = asRecord(metadata.appointment_status);
  const metadataHandoff = asRecord(metadata.hot_handoff);
  const latestAppointment = [...appointmentRows].sort((left, right) => right.scheduled_at.localeCompare(left.scheduled_at))[0] ?? null;
  const latestHandoff = [...handoffRows].sort((left, right) => right.created_at.localeCompare(left.created_at))[0] ?? null;
  const sortedAppointments = [...appointmentRows].sort((left, right) => right.scheduled_at.localeCompare(left.scheduled_at));
  const qualificationTotal = numberValue(metadataQualification.total) || Math.max(qualificationRows.length, 4);
  const qualificationAnswered = numberValue(metadataQualification.answered) || qualificationRows.length;

  return {
    id: thread.id,
    phone,
    contactName: contact?.name ?? lead?.name ?? (phone === 'unknown' ? 'WhatsApp Contact' : `WhatsApp ${phone.slice(-4)}`),
    profilePictureUrl: stringValue(
      contactMetadata.profile_picture_url ??
      contactMetadata.profile_pic_url ??
      contactMetadata.avatar_url,
    ) || null,
    firstSeenAt: contact?.created_at ?? thread.created_at,
    leadId: thread.lead_id ?? contact?.lead_id ?? lead?.id ?? null,
    builderId: thread.builder_id ?? contact?.builder_id ?? lead?.builder_id ?? businessId ?? '',
    businessId: thread.business_id ?? contact?.business_id ?? businessId,
    contactId: thread.contact_id ?? contact?.id ?? null,
    stage: thread.stage ?? contact?.stage ?? stageFromLegacyLead(lead?.lead_stage),
    temperature: lead?.temperature ?? contact?.temperature ?? (thread.unread_count > 0 ? 'warm' : 'cold'),
    assignedTo: thread.assigned_to ?? lead?.assigned_to ?? null,
    assignedUserId: thread.assigned_user_id ?? null,
    tags: [lead?.source ?? contact?.source ?? 'whatsapp', lead?.budget_range ?? null, thread.status === 'pending_human' || thread.ai_mode === 'manual' || thread.ai_mode === 'paused' ? 'human-control' : null, ...(Array.isArray(contact?.tags) ? contact.tags : [])].filter(Boolean) as string[],
    unreadCount: thread.unread_count ?? 0,
    inboundCount,
    outboundCount,
    lastMessageAt: thread.last_message_at ?? last?.created_at ?? thread.created_at,
    lastBody,
    status: thread.status,
    aiMode: thread.ai_mode,
    summary: thread.summary,
    internalNote: stringValue(metadata.internal_note ?? contactMetadata.internal_note),
    handoffReason: stringValue(metadata.handoff_reason ?? latestHandoff?.reason ?? metadataHandoff.reason),
    qualification: {
      answered: qualificationAnswered,
      total: qualificationTotal,
      nextQuestion: stringValue(metadataQualification.next_question),
      qualified: Boolean(metadataQualification.qualified) || qualificationAnswered >= Math.min(qualificationTotal, 3),
      answers: [...qualificationRows]
        .sort((left, right) => left.extracted_at.localeCompare(right.extracted_at))
        .map((answer) => ({
          question: humanizeKey(answer.question_key),
          answer: answer.answer_value,
          confidence: answer.confidence,
        })),
    },
    appointment: latestAppointment
      ? {
          id: latestAppointment.id,
          status: latestAppointment.status,
          scheduledAt: latestAppointment.scheduled_at,
          type: latestAppointment.appointment_type,
          title: latestAppointment.title,
        }
      : metadataAppointment.id
        ? {
            id: stringValue(metadataAppointment.id) || 'metadata-appointment',
            status: (stringValue(metadataAppointment.status) || 'scheduled') as Appointment['status'],
            scheduledAt: stringValue(metadataAppointment.scheduled_at) || thread.last_message_at || thread.created_at,
            type: (stringValue(metadataAppointment.type) || 'site_visit') as Appointment['appointment_type'],
            title: 'Appointment',
          }
        : null,
    appointments: sortedAppointments.map((appointment) => ({
      id: appointment.id,
      status: appointment.status,
      scheduledAt: appointment.scheduled_at,
      type: appointment.appointment_type,
      title: appointment.title,
      notes: appointment.notes,
    })),
    hotHandoff: latestHandoff
      ? {
          id: latestHandoff.id,
          reason: latestHandoff.reason,
          summary: latestHandoff.summary,
          priority: latestHandoff.priority,
          status: latestHandoff.status,
        }
      : metadataHandoff.id
        ? {
            id: stringValue(metadataHandoff.id) || 'metadata-handoff',
            reason: stringValue(metadataHandoff.reason) || 'Hot lead needs handoff',
            summary: stringValue(metadataHandoff.summary) || stringValue(metadata.handoff_reason),
            priority: stringValue(metadataHandoff.priority) || 'high',
            status: stringValue(metadataHandoff.status) || 'pending',
          }
        : null,
    aiRecommendation: buildRecommendation({
      stage: thread.stage ?? contact?.stage ?? stageFromLegacyLead(lead?.lead_stage),
      qualificationAnswered,
      qualificationTotal,
      latestAppointment,
      latestHandoff,
    }),
  };
}

function mapCanonicalMessage(message: ConversationMessage): WhatsAiMessage {
  return {
    id: message.id,
    direction: message.direction,
    body: message.body ?? `[${message.message_type}]`,
    status: message.status,
    messageType: message.message_type,
    agent: message.agent,
    createdAt: message.created_at,
    authorType: detectAuthorType(message),
  };
}

export function buildOwnerSummaryText(data: WhatsAiInboxData) {
  const { metrics } = data.summary;
  const hot = data.threads
    .filter((thread) => thread.temperature === 'hot')
    .slice(0, 3)
    .map((thread) => `- ${thread.contactName} (${thread.phone}): ${thread.lastBody.slice(0, 90)}`)
    .join('\n');

  return ['XeroWA AI Daily Summary', `Total conversations: ${metrics.totalThreads}`, `Unread threads: ${metrics.unreadThreads}`, `Hot leads: ${metrics.hotThreads}`, `AI paused threads: ${metrics.aiPausedThreads}`, `Inbound today: ${metrics.inboundToday}`, `Outbound today: ${metrics.outboundToday}`, hot ? `\nTop hot leads:\n${hot}` : '\nTop hot leads: none right now'].join('\n');
}

async function getReadClientOrNull(): Promise<any> {
  const serviceClient = serviceClientOrNull();
  if (serviceClient) return serviceClient;

  try {
    return await createClient();
  } catch {
    return null;
  }
}

function pickSelectedThread(threads: WhatsAiThread[], selectedPhone?: string | null) {
  if (!threads.length || !selectedPhone) return null;
  const key = normalizePhoneKey(selectedPhone);
  return threads.find((thread) => normalizePhoneKey(thread.phone) === key || thread.id === selectedPhone) ?? null;
}

function detectAuthorType(message: ConversationMessage): WhatsAiMessage['authorType'] {
  if (message.direction === 'inbound') return 'customer';
  const agent = String(message.agent ?? '').toLowerCase();
  if (agent.includes('operator') || agent.includes('human') || agent.includes('owner')) return 'human';
  if (agent.includes('system')) return 'system';
  return 'ai';
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function stringValue(value: unknown) {
  return typeof value === 'string' ? value : '';
}

function numberValue(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function humanizeKey(value: string) {
  return value
    .replaceAll('_', ' ')
    .replaceAll('-', ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function buildRecommendation({
  stage,
  qualificationAnswered,
  qualificationTotal,
  latestAppointment,
  latestHandoff,
}: {
  stage: ConversationStage;
  qualificationAnswered: number;
  qualificationTotal: number;
  latestAppointment: Appointment | null;
  latestHandoff: HandoffEvent | null;
}) {
  if (latestHandoff) {
    return 'Reply personally now. This customer needs a human decision before the conversation can move forward.';
  }
  if (latestAppointment?.status === 'scheduled') {
    return 'Confirm the appointment details and keep the customer ready with a short reminder.';
  }
  if (stage === 'negotiating') {
    return 'Review the customer requirement and send the strongest approved offer or callback option.';
  }
  if (qualificationAnswered < qualificationTotal) {
    return 'Let XeroWA AI complete the remaining qualification questions before stepping in.';
  }
  if (stage === 'booked') {
    return 'The customer is booked. Focus on confirmation and a smooth service experience.';
  }
  return 'No immediate owner action is required. XeroWA AI can continue handling this conversation.';
}

function normalizePhoneKey(value: string | null | undefined) {
  return String(value || '').replace(/\D/g, '');
}

function stageFromLegacyLead(stage: Lead['lead_stage'] | undefined): ConversationStage {
  if (stage === 'qualified' || stage === 'visit_scheduled' || stage === 'visited') return 'interested';
  if (stage === 'negotiation') return 'negotiating';
  if (stage === 'booked' || stage === 'lost' || stage === 'new') return stage;
  return 'cold';
}

function groupBy<T extends Record<string, any>>(rows: T[], key: keyof T) {
  const groups = new Map<string, T[]>();
  for (const row of rows) {
    const value = row[key];
    if (typeof value !== 'string' || !value) continue;
    groups.set(value, [...(groups.get(value) ?? []), row]);
  }
  return groups;
}
