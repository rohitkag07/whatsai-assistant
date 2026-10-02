import { isAdminPlatformRole } from '@/lib/auth/roles';
import { resolveFoundationFlags, type FoundationContext } from '@/lib/product-foundation-flags';

export type CommandView = 'overview' | 'runs' | 'agents' | 'approvals' | 'businesses' | 'system';
export type EvidenceState = 'ready' | 'loading' | 'empty' | 'partial' | 'stale' | 'denied' | 'disconnected' | 'error' | 'unknown';
export type ApprovalState = 'pending' | 'changed' | 'expired' | 'revoked' | 'executed' | 'denied';
export type CommandBusiness = { id: string; name: string; channel: string; configuration: string; health: string };
export type TraceStep = { title: string; actor: string; state: string; at: string | null; latencyMs: number | null; summary: string; evidence: string | null };
export type CommandRun = { id: string; businessId: string; title: string; state: string; policy: string; approvalId: string | null; receipt: string | null; retries: number; recovery: string; steps: TraceStep[] };
export type CommandApproval = { id: string; businessId: string; runId: string; title: string; status: ApprovalState; risk: string; hash: string; approvedHash: string | null; expiresAt: string; reason: string; impact: string; rollback: string; before: string; after: string };
export type CommandIncident = { id: string; businessId: string; runId: string; title: string; severity: 'critical' | 'attention'; status: 'unacknowledged' | 'acknowledged'; cause: string };
export type CommandAgent = { id: string; name: string; configuration: 'configured' | 'deferred'; reachability: 'connected' | 'degraded' | 'unknown'; role: string; version: string | null; tools: string[]; risk: string; queue: number | null; lastRun: string | null };
export type CommandSnapshot = { source: 'Synthetic' | 'Unavailable'; state: EvidenceState; observedAt: string | null; businesses: CommandBusiness[]; runs: CommandRun[]; approvals: CommandApproval[]; incidents: CommandIncident[]; agents: CommandAgent[] };

export function commandEnabled(context: FoundationContext, env: Record<string, string | undefined>) {
  return resolveFoundationFlags(context, env).command && isAdminPlatformRole(context.platformRole) && env.XEROWA_COMMAND_ENABLED === '1';
}
export function commandSyntheticEnabled(context: FoundationContext, env: Record<string, string | undefined>) {
  return commandEnabled(context, env) && env.XEROWA_DESIGN_LAB_ENABLED === '1' && env.XEROWA_COMMAND_SYNTHETIC === '1' && env.NODE_ENV !== 'production' && env.VERCEL_ENV !== 'production';
}
export function approvalPresentation(approval: CommandApproval, now: string): ApprovalState {
  if (['executed', 'denied', 'revoked'].includes(approval.status)) return approval.status;
  if (approval.approvedHash && approval.approvedHash !== approval.hash) return 'changed';
  const expires = Date.parse(approval.expiresAt);
  if (!Number.isFinite(expires) || !Number.isFinite(Date.parse(now)) || expires <= Date.parse(now)) return 'expired';
  return approval.status;
}
// Fail closed on every relationship before rendering. This projection is not authorization.
export function scopedSnapshot(snapshot: CommandSnapshot, allowedBusinessIds: readonly string[]): CommandSnapshot {
  const businesses = snapshot.businesses.filter(b => allowedBusinessIds.includes(b.id)).slice(0, 100);
  const ids = new Set(businesses.map(b => b.id));
  const runs = snapshot.runs.filter(r => ids.has(r.businessId)).slice(0, 50);
  const runMap = new Map(runs.map(r => [r.id, r.businessId]));
  const approvals = snapshot.approvals.filter(a => ids.has(a.businessId) && runMap.get(a.runId) === a.businessId).slice(0, 50);
  const approvalMap = new Map(approvals.map(a => [a.id, a]));
  const capped = snapshot.businesses.length > 100 || snapshot.runs.length > 50 || snapshot.approvals.length > 50 || snapshot.incidents.length > 50;
  return { ...snapshot, state: capped && snapshot.state === 'ready' ? 'partial' : snapshot.state, businesses, runs: runs.map(r => ({ ...r, approvalId: r.approvalId && approvalMap.get(r.approvalId)?.runId === r.id ? r.approvalId : null })), approvals, incidents: snapshot.incidents.filter(i => ids.has(i.businessId) && runMap.get(i.runId) === i.businessId).slice(0, 50) };
}
export function unavailableCommand(): CommandSnapshot {
  return { source: 'Unavailable', state: 'disconnected', observedAt: null, businesses: [], runs: [], approvals: [], incidents: [], agents: supportedAgents() };
}
export function supportedAgents(): CommandAgent[] {
  return [
    { id: 'summoner', name: 'Summoner', configuration: 'configured', reachability: 'unknown', role: 'Ingress, tenant resolution and orchestration', version: null, tools: ['Route to sales', 'Route to Tool Gateway'], risk: 'Unknown · policy evidence unavailable', queue: null, lastRun: null },
    { id: 'sales', name: 'Sales assistant', configuration: 'configured', reachability: 'unknown', role: 'Qualification and accountable handoff', version: null, tools: ['Approved knowledge', 'Qualification'], risk: 'Unknown · policy evidence unavailable', queue: null, lastRun: null },
    { id: 'tool_gateway', name: 'Tool Gateway', configuration: 'configured', reachability: 'unknown', role: 'Narrow external execution boundary', version: null, tools: ['Execution receipt required'], risk: 'Unknown · policy evidence unavailable', queue: null, lastRun: null },
    { id: 'deferred', name: 'Additional agent roles', configuration: 'deferred', reachability: 'unknown', role: 'No supported service configured in this repository', version: null, tools: [], risk: 'Not configured', queue: null, lastRun: null },
  ];
}
