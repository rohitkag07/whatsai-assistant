import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';
import { requireAdminServiceClient } from '@/lib/admin-data';
import { getOpsReadiness } from '@/lib/ops-readiness';
import type { Database } from '@/types/database';
import type { AgentControlStatus } from '@/lib/command-os-policy';

export type CommandOsRiskLevel = 'L0' | 'L1' | 'L2' | 'L3' | 'L4';
export type CommandOsActionStatus = 'proposed' | 'drafted' | 'queued' | 'approved' | 'rejected' | 'executed' | 'failed' | 'cancelled';
export type CommandOsApprovalStatus = 'pending' | 'approved' | 'rejected' | 'expired' | 'cancelled';
export type CommandOsMode = 'read_only' | 'supervised' | 'paused';
export type CommandOsFounderMode = 'founder' | 'builder' | 'revenue' | 'ops' | 'sentinel';
export type CommandOsAgentKey = 'summoner' | 'sales' | 'tool_gateway' | 'content' | 'ads' | 'ghost_closer' | 'colony' | 'finance';

export type CommandOsSettings = {
  mode: CommandOsMode;
  external_comms_enabled: boolean;
  production_writes_enabled: boolean;
  deployments_enabled: boolean;
  mcp_writes_enabled: boolean;
  cron_enabled: boolean;
  notes: string | null;
  updated_at: string;
};

export type CommandOsAction = {
  id: string;
  business_id: string | null;
  business_name?: string;
  source: string;
  mode: CommandOsFounderMode | string;
  action_type: string;
  risk_level: CommandOsRiskLevel;
  status: CommandOsActionStatus;
  title: string;
  summary: string;
  reason?: string;
  evidence: unknown[];
  approval_required: boolean;
  approval_id: string | null;
  expected_impact: string | null;
  rollback_plan: string | null;
  result: string | null;
  error?: string | null;
  created_at: string;
  updated_at: string;
};

export type CommandOsApproval = {
  id: string;
  action_id: string | null;
  business_id: string | null;
  business_name?: string;
  risk_level: CommandOsRiskLevel;
  status: CommandOsApprovalStatus;
  title: string;
  reason: string;
  evidence: unknown[];
  expected_impact: string | null;
  rollback_plan: string | null;
  decision_notes: string | null;
  created_at: string;
  decided_at: string | null;
  action?: Pick<CommandOsAction, 'id' | 'title' | 'summary' | 'expected_impact' | 'rollback_plan'> | null;
};

export type CommandOsAlert = {
  id: string;
  business_id: string | null;
  business_name?: string;
  severity: 'info' | 'warning' | 'critical';
  status: 'open' | 'acknowledged' | 'resolved' | 'ignored';
  title: string;
  summary: string;
  source: string;
  evidence?: unknown[];
  created_at: string;
  resolved_at: string | null;
};

export type CommandOsHealth = {
  overall: 'healthy' | 'watch' | 'critical' | 'setup';
  stats: {
    totalClients: number;
    liveConnections: number;
    messagesToday: number;
    failedMessages24h: number;
    hotHandoffs: number;
    qualifiedLeads7d: number;
    pendingApprovals: number;
    openAlerts: number;
    actionsToday: number;
  };
  signals: Array<{
    label: string;
    value: string;
    tone: 'good' | 'watch' | 'critical' | 'neutral';
    detail: string;
  }>;
  recommendations: Array<{
    title: string;
    risk: CommandOsRiskLevel;
    mode: CommandOsFounderMode;
    summary: string;
    approvalRequired: boolean;
  }>;
};

export type CommandOsDashboard = {
  settings: CommandOsSettings;
  health: CommandOsHealth;
  persistenceReady: boolean;
  agents: CommandOsAgent[];
  recentRuns: CommandOsAgentRun[];
  pendingApprovals: CommandOsApproval[];
  recentActions: CommandOsAction[];
  openAlerts: CommandOsAlert[];
};

export type CommandOsAgentControl = {
  agent_key: CommandOsAgentKey;
  status: AgentControlStatus;
  max_risk_level: CommandOsRiskLevel;
  autonomy_enabled: boolean;
  schedule_enabled: boolean;
  allowed_tools: string[];
  notes: string | null;
  updated_at: string;
};

export type CommandOsAgentRun = {
  id: string;
  agentKey: CommandOsAgentKey;
  agentLabel: string;
  action: string;
  status: 'success' | 'partial' | 'failure';
  durationMs: number | null;
  costUsd: number | null;
  error: string | null;
  createdAt: string;
};

export type CommandOsAgent = CommandOsAgentControl & {
  label: string;
  description: string;
  category: 'core' | 'growth' | 'operations';
  launchCritical: boolean;
  port: number;
  reachable: boolean;
  healthStatus: 'ready' | 'partial' | 'blocked' | 'manual';
  healthDetail: string;
  lastRun: CommandOsAgentRun | null;
  runCount24h: number;
  failureCount24h: number;
  pendingJobs: number;
  failedJobs: number;
};

type ServiceClient = SupabaseClient<Database>;

const DEFAULT_SETTINGS: CommandOsSettings = {
  mode: 'supervised',
  external_comms_enabled: false,
  production_writes_enabled: false,
  deployments_enabled: false,
  mcp_writes_enabled: false,
  cron_enabled: true,
  notes: 'Migration pending: defaulting to supervised read/draft mode.',
  updated_at: new Date(0).toISOString(),
};

const AGENT_REGISTRY: Array<{
  key: CommandOsAgentKey;
  label: string;
  description: string;
  category: CommandOsAgent['category'];
  launchCritical: boolean;
  port: number;
  defaultControl: Omit<CommandOsAgentControl, 'agent_key' | 'updated_at'>;
}> = [
  { key: 'summoner', label: 'Summoner', description: 'WhatsApp ingress, routing, queue orchestration, and cron fan-out.', category: 'core', launchCritical: true, port: 8082, defaultControl: { status: 'enabled', max_risk_level: 'L2', autonomy_enabled: true, schedule_enabled: true, allowed_tools: ['health_check', 'dependency_check', 'queue_scan'], notes: 'Launch-critical orchestrator.' } },
  { key: 'sales', label: 'Sales & Reception', description: 'Lead qualification, approved replies, follow-ups, and appointment booking.', category: 'core', launchCritical: true, port: 8080, defaultControl: { status: 'enabled', max_risk_level: 'L2', autonomy_enabled: true, schedule_enabled: true, allowed_tools: ['health_check', 'dependency_check', 'pipeline_digest'], notes: 'Launch-critical WhatsApp receptionist workflow.' } },
  { key: 'tool_gateway', label: 'Tool Gateway', description: 'Narrow execution boundary for WhatsApp, media, Meta, and other tools.', category: 'core', launchCritical: true, port: 8081, defaultControl: { status: 'enabled', max_risk_level: 'L1', autonomy_enabled: false, schedule_enabled: true, allowed_tools: ['health_check', 'dependency_check'], notes: 'External writes remain approval-gated.' } },
  { key: 'content', label: 'Content Studio', description: 'Content calendars, rendering, scoring, and publish preparation.', category: 'growth', launchCritical: false, port: 8083, defaultControl: { status: 'paused', max_risk_level: 'L1', autonomy_enabled: false, schedule_enabled: false, allowed_tools: ['health_check', 'dependency_check', 'draft_calendar'], notes: 'Deferred; draft-first only.' } },
  { key: 'ads', label: 'Ads Optimizer', description: 'Campaign planning, audiences, insights, and optimization proposals.', category: 'growth', launchCritical: false, port: 8085, defaultControl: { status: 'paused', max_risk_level: 'L1', autonomy_enabled: false, schedule_enabled: false, allowed_tools: ['health_check', 'dependency_check', 'draft_campaign'], notes: 'Deferred; campaign writes stay gated.' } },
  { key: 'ghost_closer', label: 'Outbound Follow-up', description: 'Prospect discovery, scoring, and supervised outreach preparation.', category: 'growth', launchCritical: false, port: 8086, defaultControl: { status: 'paused', max_risk_level: 'L1', autonomy_enabled: false, schedule_enabled: false, allowed_tools: ['health_check', 'dependency_check', 'prospect_digest'], notes: 'Sending stays approval-gated.' } },
  { key: 'colony', label: 'Operations Desk', description: 'Tickets, visitors, notices, amenities, and community operations.', category: 'operations', launchCritical: false, port: 8087, defaultControl: { status: 'paused', max_risk_level: 'L1', autonomy_enabled: false, schedule_enabled: false, allowed_tools: ['health_check', 'dependency_check', 'ops_digest'], notes: 'Deferred operations module.' } },
  { key: 'finance', label: 'Finance Guard', description: 'Receipts, revenue reports, billing visibility, and payment checks.', category: 'operations', launchCritical: false, port: 8088, defaultControl: { status: 'disabled', max_risk_level: 'L0', autonomy_enabled: false, schedule_enabled: false, allowed_tools: ['health_check', 'dependency_check'], notes: 'Money-impacting actions require L4 approval.' } },
];

export async function loadCommandOsDashboard(): Promise<CommandOsDashboard> {
  const supabase = requireAdminServiceClient();
  const [settings, health, pendingApprovals, recentActions, openAlerts, controls, recentRuns, queueStats, readiness] = await Promise.all([
    loadCommandOsSettings(supabase),
    loadCommandOsHealth(supabase),
    loadPendingApprovals(supabase),
    loadRecentActions(supabase),
    loadOpenAlerts(supabase),
    loadAgentControls(supabase),
    loadRecentAgentRuns(supabase),
    loadAgentQueueStats(supabase),
    getOpsReadiness(),
  ]);

  const controlByKey = new Map(controls.map((control) => [control.agent_key, control]));
  const serviceByKey = new Map(readiness.services.map((service) => [service.key, service]));
  const agents = AGENT_REGISTRY.map<CommandOsAgent>((definition) => {
    const control = controlByKey.get(definition.key) ?? {
      agent_key: definition.key,
      ...definition.defaultControl,
      updated_at: new Date(0).toISOString(),
    };
    const service = serviceByKey.get(definition.key);
    const agentRuns = recentRuns.filter((run) => run.agentKey === definition.key);
    const queue = queueStats.get(definition.key) ?? { pending: 0, failed: 0 };
    return {
      ...control,
      label: definition.label,
      description: definition.description,
      category: definition.category,
      launchCritical: definition.launchCritical,
      port: definition.port,
      reachable: service?.reachable ?? false,
      healthStatus: service?.status ?? 'blocked',
      healthDetail: service?.detail ?? 'Service health is unavailable.',
      lastRun: agentRuns[0] ?? null,
      runCount24h: agentRuns.length,
      failureCount24h: agentRuns.filter((run) => run.status === 'failure').length,
      pendingJobs: queue.pending,
      failedJobs: queue.failed,
    };
  });

  return {
    settings,
    health,
    persistenceReady: controls.length > 0,
    agents,
    recentRuns,
    pendingApprovals,
    recentActions,
    openAlerts,
  };
}

export async function loadAgentControls(supabase: ServiceClient): Promise<CommandOsAgentControl[]> {
  const result = await (supabase.from('ai_agent_controls') as any)
    .select('agent_key,status,max_risk_level,autonomy_enabled,schedule_enabled,allowed_tools,notes,updated_at')
    .order('agent_key');

  if (isMissingTable(result.error)) return [];
  if (result.error) throw new Error(result.error.message);
  return (result.data ?? []) as CommandOsAgentControl[];
}

export async function loadRecentAgentRuns(supabase: ServiceClient): Promise<CommandOsAgentRun[]> {
  const result = await (supabase.from('agent_runs') as any)
    .select('id,agent,action,status,duration_ms,cost_usd,error,created_at')
    .gte('created_at', hoursAgo(24))
    .order('created_at', { ascending: false })
    .limit(250);

  if (isMissingTable(result.error)) return [];
  if (result.error) throw new Error(result.error.message);

  return ((result.data ?? []) as Array<{
    id: string;
    agent: string;
    action: string;
    status: CommandOsAgentRun['status'];
    duration_ms: number | null;
    cost_usd: number | null;
    error: string | null;
    created_at: string;
  }>).map((row) => {
    const agentKey = normalizeAgentKey(row.agent);
    return {
      id: row.id,
      agentKey,
      agentLabel: AGENT_REGISTRY.find((agent) => agent.key === agentKey)?.label ?? row.agent,
      action: row.action,
      status: row.status,
      durationMs: row.duration_ms,
      costUsd: row.cost_usd,
      error: row.error,
      createdAt: row.created_at,
    };
  });
}

async function loadAgentQueueStats(supabase: ServiceClient) {
  const result = await (supabase.from('agent_dispatch_queue') as any)
    .select('target_agent,status')
    .in('status', ['pending', 'processing', 'failed'])
    .limit(500);

  const stats = new Map<CommandOsAgentKey, { pending: number; failed: number }>();
  if (isMissingTable(result.error) || result.error) return stats;

  for (const row of (result.data ?? []) as Array<{ target_agent: string; status: string }>) {
    const key = normalizeAgentKey(row.target_agent);
    const current = stats.get(key) ?? { pending: 0, failed: 0 };
    if (row.status === 'failed') current.failed += 1;
    else current.pending += 1;
    stats.set(key, current);
  }
  return stats;
}

export async function loadCommandOsSettings(supabase: ServiceClient): Promise<CommandOsSettings> {
  const result = await (supabase.from('ai_os_settings') as any)
    .select('mode,external_comms_enabled,production_writes_enabled,deployments_enabled,mcp_writes_enabled,cron_enabled,notes,updated_at')
    .eq('id', true)
    .maybeSingle();

  if (isMissingTable(result.error)) return DEFAULT_SETTINGS;
  if (result.error) throw new Error(result.error.message);
  return (result.data ?? DEFAULT_SETTINGS) as CommandOsSettings;
}

export async function loadCommandOsHealth(supabase: ServiceClient): Promise<CommandOsHealth> {
  const [
    totalClients,
    liveConnections,
    messagesToday,
    failedMessages24h,
    hotHandoffs,
    qualifiedLeads7d,
    pendingApprovals,
    openAlerts,
    actionsToday,
  ] = await Promise.all([
    countRows(supabase, 'businesses'),
    countRows(supabase, 'business_channels', (query) => query.eq('channel_type', 'whatsapp').eq('status', 'connected')),
    countRows(supabase, 'conversation_messages', (query) => query.gte('created_at', startOfTodayInIndia())),
    countRows(supabase, 'conversation_messages', (query) => query.eq('status', 'failed').gte('created_at', hoursAgo(24))),
    countRows(supabase, 'handoff_events', (query) => query.in('status', ['open', 'pending', 'acknowledged'])),
    countRows(supabase, 'leads', (query) => query.in('lead_stage', ['qualified', 'visit_scheduled', 'visited', 'negotiation']).gte('created_at', daysAgo(7))),
    countRows(supabase, 'agent_approvals', (query) => query.eq('status', 'pending')),
    countRows(supabase, 'agent_alerts', (query) => query.eq('status', 'open')),
    countRows(supabase, 'agent_actions', (query) => query.gte('created_at', startOfTodayInIndia())),
  ]);

  const critical = failedMessages24h >= 25 || openAlerts >= 3;
  const watch = critical || hotHandoffs > 0 || pendingApprovals > 0 || failedMessages24h > 0;
  const setup = totalClients === 0;
  const overall: CommandOsHealth['overall'] = setup ? 'setup' : critical ? 'critical' : watch ? 'watch' : 'healthy';

  return {
    overall,
    stats: {
      totalClients,
      liveConnections,
      messagesToday,
      failedMessages24h,
      hotHandoffs,
      qualifiedLeads7d,
      pendingApprovals,
      openAlerts,
      actionsToday,
    },
    signals: [
      { label: 'WhatsApp delivery', value: failedMessages24h ? `${failedMessages24h} failed` : 'Stable', tone: failedMessages24h >= 25 ? 'critical' : failedMessages24h > 0 ? 'watch' : 'good', detail: 'Failed message records in the last 24 hours.' },
      { label: 'Owner handoffs', value: String(hotHandoffs), tone: hotHandoffs > 0 ? 'watch' : 'good', detail: 'Open or acknowledged conversations needing a human owner.' },
      { label: 'Lead momentum', value: String(qualifiedLeads7d), tone: qualifiedLeads7d > 0 ? 'good' : 'neutral', detail: 'Qualified or later-stage leads created in the last 7 days.' },
      { label: 'AI OS approvals', value: String(pendingApprovals), tone: pendingApprovals > 0 ? 'watch' : 'good', detail: 'Supervised actions waiting for founder/admin decision.' },
    ],
    recommendations: buildRecommendations({ failedMessages24h, hotHandoffs, qualifiedLeads7d, pendingApprovals }),
  };
}

export async function loadPendingApprovals(supabase: ServiceClient): Promise<CommandOsApproval[]> {
  const result = await (supabase.from('agent_approvals') as any)
    .select('id,action_id,business_id,risk_level,status,title,reason,evidence,expected_impact,rollback_plan,decision_notes,created_at,decided_at')
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(25);

  if (isMissingTable(result.error)) return [];
  if (result.error) throw new Error(result.error.message);
  const rows = await attachBusinessNames(supabase, normalizeJsonArrays(result.data ?? []) as CommandOsApproval[]);
  const actions = await loadActionsById(supabase, rows.map((row) => row.action_id).filter((id): id is string => Boolean(id)));
  return rows.map((row) => ({ ...row, action: row.action_id ? actions.get(row.action_id) ?? null : null }));
}

export async function loadRecentActions(supabase: ServiceClient): Promise<CommandOsAction[]> {
  const result = await (supabase.from('agent_actions') as any)
    .select('id,business_id,source,mode,action_type,risk_level,status,title,summary,evidence,approval_required,approval_id,expected_impact,rollback_plan,result,error,created_at,updated_at')
    .order('created_at', { ascending: false })
    .limit(40);

  if (isMissingTable(result.error)) return [];
  if (result.error) throw new Error(result.error.message);
  return attachBusinessNames(supabase, normalizeJsonArrays(result.data ?? []) as CommandOsAction[]);
}

export async function loadOpenAlerts(supabase: ServiceClient): Promise<CommandOsAlert[]> {
  const result = await (supabase.from('agent_alerts') as any)
    .select('id,business_id,severity,status,title,summary,source,evidence,created_at,resolved_at')
    .eq('status', 'open')
    .order('created_at', { ascending: false })
    .limit(25);

  if (isMissingTable(result.error)) return [];
  if (result.error) throw new Error(result.error.message);
  return attachBusinessNames(supabase, normalizeJsonArrays(result.data ?? []) as CommandOsAlert[]);
}

export function requiresApproval(riskLevel: CommandOsRiskLevel) {
  return riskLevel === 'L3' || riskLevel === 'L4';
}

function buildRecommendations(stats: {
  failedMessages24h: number;
  hotHandoffs: number;
  qualifiedLeads7d: number;
  pendingApprovals: number;
}): CommandOsHealth['recommendations'] {
  const recommendations: CommandOsHealth['recommendations'] = [];

  if (stats.failedMessages24h > 0) {
    recommendations.push({ title: 'Investigate WhatsApp delivery failures', risk: 'L0', mode: 'ops', summary: 'Inspect failed message metadata, affected tenants, Meta/template status, and queue behavior before proposing a fix.', approvalRequired: false });
  }
  if (stats.hotHandoffs > 0) {
    recommendations.push({ title: 'Prepare owner handoff digest', risk: 'L1', mode: 'ops', summary: 'Summarize pending customer conversations and draft owner-ready replies without sending them.', approvalRequired: false });
  }
  if (stats.qualifiedLeads7d > 0) {
    recommendations.push({ title: 'Review qualified lead follow-up opportunities', risk: 'L1', mode: 'revenue', summary: 'Rank high-intent leads and draft personalized follow-up suggestions for approval.', approvalRequired: false });
  }
  if (stats.pendingApprovals > 0) {
    recommendations.push({ title: 'Clear pending supervised decisions', risk: 'L3', mode: 'founder', summary: 'Review external-impact or critical actions waiting for a founder/admin decision.', approvalRequired: true });
  }
  if (!recommendations.length) {
    recommendations.push({ title: 'No risky action recommended', risk: 'L0', mode: 'founder', summary: 'System looks calm. Continue monitoring and avoid busywork until stronger evidence appears.', approvalRequired: false });
  }

  return recommendations;
}

async function loadActionsById(supabase: ServiceClient, ids: string[]) {
  const unique = [...new Set(ids.filter(Boolean))];
  if (!unique.length) return new Map<string, CommandOsApproval['action']>();
  const result = await (supabase.from('agent_actions') as any)
    .select('id,title,summary,expected_impact,rollback_plan')
    .in('id', unique);
  return new Map<string, CommandOsApproval['action']>(
    ((result.data ?? []) as NonNullable<CommandOsApproval['action']>[]).map((row) => [row.id, row]),
  );
}

async function attachBusinessNames<T extends { business_id: string | null; business_name?: string }>(supabase: ServiceClient, rows: T[]) {
  const ids = [...new Set(rows.map((row) => row.business_id).filter((id): id is string => Boolean(id)))];
  if (!ids.length) return rows;
  const result = await (supabase.from('businesses') as any).select('id,name').in('id', ids);
  const names = new Map<string, string>(((result.data ?? []) as Array<{ id: string; name: string }>).map((row) => [row.id, row.name]));
  return rows.map((row) => ({ ...row, business_name: row.business_id ? names.get(row.business_id) ?? 'Unknown client' : undefined }));
}

async function countRows(supabase: ServiceClient, table: string, refine: (query: any) => any = (query) => query) {
  const query = (supabase.from(table) as any).select('id', { count: 'exact', head: true });
  const { count, error } = await refine(query);
  if (isMissingTable(error)) return 0;
  if (error) return 0;
  return count ?? 0;
}

function normalizeJsonArrays<T extends Record<string, any>>(rows: T[]) {
  return rows.map((row) => ({ ...row, evidence: Array.isArray(row.evidence) ? row.evidence : [] }));
}

function isMissingTable(error: unknown) {
  if (!error || typeof error !== 'object') return false;
  const message = 'message' in error && typeof error.message === 'string' ? error.message : '';
  const code = 'code' in error && typeof error.code === 'string' ? error.code : '';
  return code === '42P01' || message.includes('does not exist') || message.includes('Could not find the table');
}

function startOfTodayInIndia() {
  const now = new Date();
  const indiaOffsetMs = 5.5 * 60 * 60 * 1000;
  const indiaNow = new Date(now.getTime() + indiaOffsetMs);
  indiaNow.setUTCHours(0, 0, 0, 0);
  return new Date(indiaNow.getTime() - indiaOffsetMs).toISOString();
}

function hoursAgo(hours: number) {
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
}

function daysAgo(days: number) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

function normalizeAgentKey(raw: string): CommandOsAgentKey {
  const value = raw.toLowerCase().replaceAll('-', '_');
  if (value.includes('summoner')) return 'summoner';
  if (value.includes('content')) return 'content';
  if (value.includes('ghost')) return 'ghost_closer';
  if (value.includes('ads')) return 'ads';
  if (value.includes('colony')) return 'colony';
  if (value.includes('finance')) return 'finance';
  if (value.includes('tool_gateway') || value.includes('gateway')) return 'tool_gateway';
  return 'sales';
}
