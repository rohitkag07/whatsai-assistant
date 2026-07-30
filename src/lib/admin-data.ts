import 'server-only';

import { serviceClientOrNull } from '@/lib/sales-server';
import type { AdminModuleId, AdminModuleState } from '@/lib/admin-modules';
import { getAdminModuleStates } from '@/lib/admin-control';

export type AdminBusiness = {
  id: string;
  name: string;
  category: string;
  status: string;
  plan: string;
  city: string | null;
  owner_name: string | null;
  owner_phone: string | null;
  created_at: string;
  updated_at: string;
  metadata?: Record<string, unknown> | null;
  whatsapp_phone?: string | null;
  whatsapp_status?: string;
};

export type AdminChannel = {
  id: string;
  business_id: string;
  channel_type: string | null;
  phone_number: string | null;
  phone_number_id: string | null;
  display_name: string | null;
  status: string;
  is_primary: boolean;
  last_verified_at: string | null;
};

export type AdminMessage = {
  id: string;
  business_id: string | null;
  business_name: string;
  contact_id: string | null;
  contact_name: string | null;
  contact_phone: string | null;
  direction: 'inbound' | 'outbound';
  body: string | null;
  message_type: string;
  status: string;
  agent: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type AdminKnowledgeItem = {
  id: string;
  business_id: string;
  business_name: string;
  playbook_id: string | null;
  title: string;
  type: string;
  question: string | null;
  content: string;
  keywords: string[];
  locale: string;
  status: string;
  is_active: boolean;
  updated_at: string;
};

export type AdminPlaybook = {
  id: string;
  business_id: string;
  business_name: string;
  name: string;
  vertical: string;
  is_active: boolean;
  playbook_version: number;
  qualification_questions: unknown[];
  keyword_replies: unknown[];
  handoff_rules: Record<string, unknown>;
  fallback_reply: string;
  created_at: string;
  updated_at: string;
};

export type AdminTeamMember = {
  id: string;
  business_id: string;
  business_name: string;
  user_id: string;
  email: string;
  display_name: string | null;
  role: string;
  active: boolean;
  created_at: string;
};

export type AdminClientDetail = {
  business: AdminBusiness;
  channels: AdminChannel[];
  knowledge: AdminKnowledgeItem[];
  playbooks: AdminPlaybook[];
  members: AdminTeamMember[];
  moduleStates: Record<AdminModuleId, AdminModuleState>;
  counts: {
    contacts: number;
    threads: number;
    messages: number;
    appointments: number;
    handoffs: number;
  };
};

type ServiceClient = NonNullable<ReturnType<typeof serviceClientOrNull>>;

export function requireAdminServiceClient() {
  const supabase = serviceClientOrNull();
  if (!supabase) {
    throw new Error('Supabase service connection is not configured.');
  }
  return supabase;
}

export async function loadAdminBusinesses(): Promise<AdminBusiness[]> {
  const supabase = requireAdminServiceClient();
  const [businessesResult, channelsResult] = await Promise.all([
    (supabase.from('businesses') as any)
      .select('id,name,category,status,plan,city,owner_name,owner_phone,created_at,updated_at,metadata')
      .order('created_at', { ascending: false })
      .limit(500),
    (supabase.from('business_channels') as any)
      .select('id,business_id,channel_type,phone_number,phone_number_id,display_name,status,is_primary,last_verified_at')
      .eq('channel_type', 'whatsapp')
      .order('is_primary', { ascending: false }),
  ]);

  if (businessesResult.error) throw new Error(businessesResult.error.message);
  const channels = (channelsResult.data ?? []) as AdminChannel[];
  const channelByBusiness = new Map<string, AdminChannel>();

  for (const channel of channels) {
    const current = channelByBusiness.get(channel.business_id);
    if (!current || channel.is_primary) channelByBusiness.set(channel.business_id, channel);
  }

  return ((businessesResult.data ?? []) as AdminBusiness[]).map((business) => {
    const channel = channelByBusiness.get(business.id);
    return {
      ...business,
      whatsapp_phone: channel?.phone_number ?? business.owner_phone,
      whatsapp_status: channel?.status ?? 'not_connected',
    };
  });
}

export async function loadAdminOverview() {
  const supabase = requireAdminServiceClient();
  const businesses = await loadAdminBusinesses();
  const [messagesSentToday, hotHandoffs, activity] = await Promise.all([
    countRows(supabase, 'conversation_messages', (query) =>
      query.eq('direction', 'outbound').gte('created_at', startOfTodayInIndia()),
    ),
    countRows(supabase, 'handoff_events', (query) =>
      query.in('status', ['open', 'pending', 'acknowledged']),
    ),
    loadAdminMessages(20),
  ]);

  return {
    businesses,
    activity,
    stats: {
      totalClients: businesses.length,
      liveConnections: businesses.filter(
        (business) => business.whatsapp_status === 'connected',
      ).length,
      messagesSentToday,
      hotHandoffs,
    },
  };
}

export async function loadAdminMessages(limit = 100): Promise<AdminMessage[]> {
  const supabase = requireAdminServiceClient();
  const result = await (supabase.from('conversation_messages') as any)
    .select('id,business_id,contact_id,direction,body,message_type,status,agent,metadata,created_at')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (result.error) throw new Error(result.error.message);
  const rows = (result.data ?? []) as Array<Omit<AdminMessage, 'business_name' | 'contact_name' | 'contact_phone'>>;
  const [businessMap, contactMap] = await Promise.all([
    loadBusinessNameMap(supabase, rows.map((row) => row.business_id)),
    loadContactMap(supabase, rows.map((row) => row.contact_id)),
  ]);

  return rows.map((row) => {
    const contact = row.contact_id ? contactMap.get(row.contact_id) : null;
    return {
      ...row,
      metadata: isRecord(row.metadata) ? row.metadata : {},
      business_name: row.business_id
        ? businessMap.get(row.business_id) ?? 'Unknown business'
        : 'Unassigned',
      contact_name: contact?.name ?? null,
      contact_phone: contact?.phone ?? null,
    };
  });
}

export async function loadAdminKnowledge(): Promise<AdminKnowledgeItem[]> {
  const supabase = requireAdminServiceClient();
  const result = await (supabase.from('assistant_knowledge_items') as any)
    .select('id,business_id,playbook_id,title,type,question,content,keywords,locale,status,is_active,updated_at')
    .order('updated_at', { ascending: false })
    .limit(500);

  if (result.error) throw new Error(result.error.message);
  const rows = (result.data ?? []) as Array<Omit<AdminKnowledgeItem, 'business_name'>>;
  const businessMap = await loadBusinessNameMap(supabase, rows.map((row) => row.business_id));

  return rows.map((row) => ({
    ...row,
    content: row.content ?? '',
    keywords: Array.isArray(row.keywords) ? row.keywords : [],
    business_name: businessMap.get(row.business_id) ?? 'Unknown business',
  }));
}

export async function loadAdminPlaybooks(): Promise<AdminPlaybook[]> {
  const supabase = requireAdminServiceClient();
  const result = await (supabase.from('assistant_playbooks') as any)
    .select('id,business_id,name,vertical,is_active,playbook_version,qualification_questions,keyword_replies,handoff_rules,fallback_reply,created_at,updated_at')
    .order('updated_at', { ascending: false })
    .limit(500);

  if (result.error) throw new Error(result.error.message);
  const rows = (result.data ?? []) as Array<Omit<AdminPlaybook, 'business_name'>>;
  const businessMap = await loadBusinessNameMap(supabase, rows.map((row) => row.business_id));

  return rows.map((row) => ({
    ...row,
    qualification_questions: Array.isArray(row.qualification_questions)
      ? row.qualification_questions
      : [],
    keyword_replies: Array.isArray(row.keyword_replies) ? row.keyword_replies : [],
    handoff_rules: isRecord(row.handoff_rules) ? row.handoff_rules : {},
    business_name: businessMap.get(row.business_id) ?? 'Unknown business',
  }));
}

export async function loadAdminWebhookEvents(): Promise<AdminMessage[]> {
  const rows = await loadAdminMessages(250);
  return rows
    .filter((message) => message.direction === 'inbound')
    .slice(0, 50);
}

export async function loadAdminTeam(): Promise<AdminTeamMember[]> {
  const supabase = requireAdminServiceClient();
  const result = await (supabase.from('business_members') as any)
    .select('id,business_id,user_id,display_name,role,active,created_at')
    .order('created_at', { ascending: false })
    .limit(500);

  if (result.error) throw new Error(result.error.message);
  const rows = (result.data ?? []) as Array<Omit<AdminTeamMember, 'business_name' | 'email'>>;
  const [businessMap, userMap] = await Promise.all([
    loadBusinessNameMap(supabase, rows.map((row) => row.business_id)),
    loadAuthUserMap(supabase),
  ]);

  return rows.map((row) => ({
    ...row,
    business_name: businessMap.get(row.business_id) ?? 'Unknown business',
    email: userMap.get(row.user_id) ?? 'Email unavailable',
  }));
}

export async function loadAdminClientDetail(businessId: string): Promise<AdminClientDetail | null> {
  const supabase = requireAdminServiceClient();
  const businessResult = await (supabase.from('businesses') as any)
    .select('id,name,category,status,plan,city,owner_name,owner_phone,created_at,updated_at,metadata')
    .eq('id', businessId)
    .maybeSingle();

  if (businessResult.error) throw new Error(businessResult.error.message);
  if (!businessResult.data) return null;

  const [channelsResult, knowledge, playbooks, allMembers, contacts, threads, messages, appointments, handoffs] =
    await Promise.all([
      (supabase.from('business_channels') as any)
        .select('id,business_id,channel_type,phone_number,phone_number_id,display_name,status,is_primary,last_verified_at')
        .eq('business_id', businessId)
        .order('is_primary', { ascending: false }),
      loadAdminKnowledge(),
      loadAdminPlaybooks(),
      loadAdminTeam(),
      countRows(supabase, 'conversation_contacts', (query) => query.eq('business_id', businessId)),
      countRows(supabase, 'conversation_threads', (query) => query.eq('business_id', businessId)),
      countRows(supabase, 'conversation_messages', (query) => query.eq('business_id', businessId)),
      countRows(supabase, 'appointments', (query) =>
        query.eq('business_id', businessId).in('status', ['scheduled', 'confirmed']),
      ),
      countRows(supabase, 'handoff_events', (query) =>
        query.eq('business_id', businessId).in('status', ['open', 'pending', 'acknowledged']),
      ),
    ]);

  const business = businessResult.data as AdminBusiness;
  return {
    business,
    channels: (channelsResult.data ?? []) as AdminChannel[],
    knowledge: knowledge.filter((item) => item.business_id === businessId),
    playbooks: playbooks.filter((item) => item.business_id === businessId),
    members: allMembers.filter((item) => item.business_id === businessId),
    moduleStates: getAdminModuleStates(business.metadata),
    counts: { contacts, threads, messages, appointments, handoffs },
  };
}

async function loadBusinessNameMap(supabase: ServiceClient, ids: Array<string | null>) {
  const unique = uniqueStrings(ids);
  if (!unique.length) return new Map<string, string>();
  const result = await (supabase.from('businesses') as any)
    .select('id,name')
    .in('id', unique);
  return new Map<string, string>(
    ((result.data ?? []) as Array<{ id: string; name: string }>).map((row) => [
      row.id,
      row.name,
    ]),
  );
}

async function loadContactMap(supabase: ServiceClient, ids: Array<string | null>) {
  const unique = uniqueStrings(ids);
  if (!unique.length) {
    return new Map<string, { name: string | null; phone: string | null }>();
  }
  const result = await (supabase.from('conversation_contacts') as any)
    .select('id,name,phone')
    .in('id', unique);
  return new Map<string, { name: string | null; phone: string | null }>(
    ((result.data ?? []) as Array<{ id: string; name: string | null; phone: string | null }>).map(
      (row) => [row.id, { name: row.name, phone: row.phone }],
    ),
  );
}

async function loadAuthUserMap(supabase: ServiceClient) {
  const map = new Map<string, string>();
  for (let page = 1; page <= 10; page += 1) {
    const result = await supabase.auth.admin.listUsers({ page, perPage: 100 });
    if (result.error) break;
    for (const user of result.data.users) {
      if (user.email) map.set(user.id, user.email);
    }
    if (result.data.users.length < 100) break;
  }
  return map;
}

async function countRows(
  supabase: ServiceClient,
  table: string,
  refine: (query: any) => any,
) {
  const query = (supabase.from(table) as any).select('id', {
    count: 'exact',
    head: true,
  });
  const { count } = await refine(query);
  return count ?? 0;
}

function startOfTodayInIndia() {
  const now = new Date();
  const indiaOffsetMs = 5.5 * 60 * 60 * 1000;
  const indiaNow = new Date(now.getTime() + indiaOffsetMs);
  indiaNow.setUTCHours(0, 0, 0, 0);
  return new Date(indiaNow.getTime() - indiaOffsetMs).toISOString();
}

function uniqueStrings(values: Array<string | null>) {
  return [...new Set(values.filter((value): value is string => Boolean(value)))];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}
