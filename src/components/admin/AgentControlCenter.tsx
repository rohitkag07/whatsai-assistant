'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  Activity,
  Bot,
  CheckCircle2,
  CirclePause,
  CirclePlay,
  Cpu,
  ExternalLink,
  HeartPulse,
  ListFilter,
  Power,
  Search,
  ShieldCheck,
  Timer,
  TriangleAlert,
  Wrench,
  XCircle,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AdminSection, formatAdminDate } from '@/components/admin/AdminPrimitives';
import type {
  CommandOsAgent,
  CommandOsAgentRun,
  CommandOsMode,
  CommandOsRiskLevel,
} from '@/lib/command-os-data';
import { cn } from '@/lib/utils';

export function AgentControlCenter({
  agents,
  recentRuns,
  globalMode,
  persistenceReady,
}: {
  agents: CommandOsAgent[];
  recentRuns: CommandOsAgentRun[];
  globalMode: CommandOsMode;
  persistenceReady: boolean;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<CommandOsAgent | null>(null);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'enabled' | 'paused' | 'disabled' | 'unhealthy'>('all');
  const [message, setMessage] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [isRefreshing, startTransition] = useTransition();

  const visibleAgents = useMemo(() => agents.filter((agent) => {
    const matchesQuery = `${agent.label} ${agent.description} ${agent.agent_key}`.toLowerCase().includes(query.trim().toLowerCase());
    const matchesFilter = filter === 'all'
      || agent.status === filter
      || (filter === 'unhealthy' && (!agent.reachable || agent.healthStatus === 'blocked' || agent.failureCount24h > 0));
    return matchesQuery && matchesFilter;
  }), [agents, filter, query]);

  const summary = {
    reachable: agents.filter((agent) => agent.reachable).length,
    enabled: agents.filter((agent) => agent.status === 'enabled').length,
    paused: agents.filter((agent) => agent.status === 'paused').length,
    failures: agents.reduce((total, agent) => total + agent.failureCount24h + agent.failedJobs, 0),
  };

  function refresh() {
    startTransition(() => router.refresh());
  }

  async function updateAgent(agent: CommandOsAgent, update: Record<string, unknown>) {
    setMessage(null);
    setPendingKey(`${agent.agent_key}:update`);
    const response = await fetch(`/api/admin/command-os/agents/${agent.agent_key}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(update),
    });
    const payload = await response.json().catch(() => null);
    setPendingKey(null);
    if (!response.ok) {
      setMessage({ tone: 'error', text: payload?.error || 'Agent control update failed.' });
      return;
    }
    setMessage({ tone: 'success', text: `${agent.label} controls updated.` });
    setSelected(null);
    refresh();
  }

  async function runCheck(agent: CommandOsAgent, action: 'health_check' | 'dependency_check') {
    setMessage(null);
    setPendingKey(`${agent.agent_key}:${action}`);
    const response = await fetch(`/api/admin/command-os/agents/${agent.agent_key}/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    });
    const payload = await response.json().catch(() => null);
    setPendingKey(null);
    if (!response.ok) {
      setMessage({ tone: 'error', text: payload?.error || `${agent.label} check failed.` });
      return;
    }
    setMessage({ tone: 'success', text: `${agent.label} ${action === 'health_check' ? 'health' : 'dependency'} check passed in ${payload.duration_ms}ms.` });
    refresh();
  }

  return (
    <div className="space-y-6">
      {message ? (
        <div className={cn(
          'flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm',
          message.tone === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-red-200 bg-red-50 text-red-700',
        )}>
          {message.tone === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
          {message.text}
        </div>
      ) : null}

      {!persistenceReady ? (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <div><b>Control persistence is not active.</b> Apply migration <code>023_xerowa_command_os.sql</code> before using pause, resume, risk, autonomy, schedule, or manual-run controls. The fleet below is currently a safe read-only preview.</div>
        </div>
      ) : null}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <AgentMetric icon={HeartPulse} label="Reachable services" value={`${summary.reachable}/${agents.length}`} detail="Live health endpoint response" tone="emerald" />
        <AgentMetric icon={CirclePlay} label="Enabled agents" value={summary.enabled} detail="Allowed by per-agent control" tone="blue" />
        <AgentMetric icon={CirclePause} label="Paused agents" value={summary.paused} detail="No scheduled or manual runs" tone="amber" />
        <AgentMetric icon={TriangleAlert} label="Failures (24h)" value={summary.failures} detail="Failed runs plus queue jobs" tone={summary.failures ? 'red' : 'slate'} />
      </section>

      <AdminSection
        title="Agent fleet"
        description="Manage service state, autonomy, schedule, risk ceiling, and safe diagnostic runs from one control surface."
        action={<Badge variant={globalMode === 'paused' ? 'destructive' : globalMode === 'read_only' ? 'warning' : 'success'} className="capitalize">Global: {globalMode.replace('_', ' ')}</Badge>}
      >
        <div className="border-b border-[#e7ecea] p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="relative w-full md:max-w-sm">
              <Search className="absolute left-3 top-3 h-4 w-4 text-[#86968f]" />
              <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search agents…" className="pl-9" />
            </div>
            <div className="flex flex-wrap gap-2">
              {(['all', 'enabled', 'paused', 'disabled', 'unhealthy'] as const).map((value) => (
                <Button key={value} type="button" size="sm" variant={filter === value ? 'default' : 'outline'} onClick={() => setFilter(value)} className="capitalize">
                  {value === 'all' ? <ListFilter className="mr-2 h-3.5 w-3.5" /> : null}
                  {value}
                </Button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-4 p-4 lg:grid-cols-2 2xl:grid-cols-3">
          {visibleAgents.map((agent) => (
            <AgentCard
              key={agent.agent_key}
              agent={agent}
              globalMode={globalMode}
              pending={!persistenceReady || Boolean(pendingKey) || isRefreshing}
              onConfigure={() => setSelected(agent)}
              onRun={() => runCheck(agent, 'health_check')}
              onToggle={() => updateAgent(agent, { status: agent.status === 'enabled' ? 'paused' : 'enabled' })}
            />
          ))}
          {!visibleAgents.length ? (
            <div className="col-span-full rounded-2xl border border-dashed border-[#cfd8d5] p-10 text-center text-sm text-[#667781]">No agents match this filter.</div>
          ) : null}
        </div>
      </AdminSection>

      <RecentRuns runs={recentRuns} />

      <AgentDialog
        agent={selected}
        pending={!persistenceReady || Boolean(pendingKey) || isRefreshing}
        globalMode={globalMode}
        onOpenChange={(open) => { if (!open) setSelected(null); }}
        onUpdate={updateAgent}
        onRun={runCheck}
      />
    </div>
  );
}

function AgentMetric({ icon: Icon, label, value, detail, tone }: { icon: typeof Activity; label: string; value: string | number; detail: string; tone: 'emerald' | 'blue' | 'amber' | 'red' | 'slate' }) {
  const tones = {
    emerald: 'bg-emerald-50 text-emerald-700',
    blue: 'bg-blue-50 text-blue-700',
    amber: 'bg-amber-50 text-amber-700',
    red: 'bg-red-50 text-red-700',
    slate: 'bg-slate-50 text-slate-700',
  };
  return (
    <div className="rounded-2xl border border-[#d8e1dd] bg-white p-4 shadow-[0_10px_30px_rgba(17,27,33,0.035)]">
      <div className="flex items-center justify-between"><p className="text-xs font-semibold text-[#667781]">{label}</p><span className={cn('rounded-xl p-2', tones[tone])}><Icon className="h-4 w-4" /></span></div>
      <p className="mt-2 text-2xl font-semibold tracking-[-0.045em] text-[#111b21]">{value}</p>
      <p className="mt-1 text-xs text-[#7a8984]">{detail}</p>
    </div>
  );
}

function AgentCard({ agent, globalMode, pending, onConfigure, onRun, onToggle }: { agent: CommandOsAgent; globalMode: CommandOsMode; pending: boolean; onConfigure: () => void; onRun: () => void; onToggle: () => void }) {
  const runBlocked = globalMode === 'paused' || agent.status !== 'enabled' || !agent.allowed_tools.includes('health_check');
  return (
    <article className={cn('rounded-2xl border bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-lg', agent.launchCritical ? 'border-[#9ed8c8]' : 'border-[#d8e1dd]')}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div className={cn('rounded-2xl p-2.5', agent.reachable ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500')}><Bot className="h-5 w-5" /></div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold tracking-[-0.025em] text-[#111b21]">{agent.label}</h3>{agent.launchCritical ? <Badge variant="success">MVP core</Badge> : <Badge variant="outline">Deferred</Badge>}</div>
            <p className="mt-1 text-xs text-[#7a8984]">Port {agent.port} · {agent.category}</p>
          </div>
        </div>
        <AgentStateBadge agent={agent} />
      </div>

      <p className="mt-4 min-h-10 text-sm leading-5 text-[#667781]">{agent.description}</p>
      <div className="mt-4 grid grid-cols-3 gap-2">
        <MiniStat label="Risk cap" value={agent.max_risk_level} />
        <MiniStat label="Runs 24h" value={agent.runCount24h} />
        <MiniStat label="Queue" value={agent.pendingJobs} />
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Badge variant={agent.autonomy_enabled ? 'success' : 'outline'}>{agent.autonomy_enabled ? 'Autonomy on' : 'Manual'}</Badge>
        <Badge variant={agent.schedule_enabled ? 'secondary' : 'outline'}>{agent.schedule_enabled ? 'Schedule on' : 'Schedule off'}</Badge>
        {agent.failureCount24h || agent.failedJobs ? <Badge variant="destructive">{agent.failureCount24h + agent.failedJobs} failures</Badge> : null}
      </div>
      <p className="mt-4 truncate text-xs text-[#86968f]">Last run: {agent.lastRun ? `${agent.lastRun.action} · ${formatAdminDate(agent.lastRun.createdAt)}` : 'No run recorded in 24h'}</p>
      <div className="mt-4 grid grid-cols-3 gap-2">
        <Button size="sm" variant="outline" onClick={onConfigure}><Wrench className="mr-1.5 h-3.5 w-3.5" />Manage</Button>
        <Button size="sm" variant="outline" disabled={pending || runBlocked} onClick={onRun}><HeartPulse className="mr-1.5 h-3.5 w-3.5" />Check</Button>
        <Button size="sm" disabled={pending || agent.status === 'disabled'} variant={agent.status === 'enabled' ? 'outline' : 'default'} onClick={onToggle}>
          {agent.status === 'enabled' ? <CirclePause className="mr-1.5 h-3.5 w-3.5" /> : <CirclePlay className="mr-1.5 h-3.5 w-3.5" />}{agent.status === 'enabled' ? 'Pause' : 'Resume'}
        </Button>
      </div>
    </article>
  );
}

function AgentStateBadge({ agent }: { agent: CommandOsAgent }) {
  if (agent.status === 'disabled') return <Badge variant="destructive">Disabled</Badge>;
  if (agent.status === 'paused') return <Badge variant="warning">Paused</Badge>;
  return <Badge variant={agent.reachable ? 'success' : 'outline'}>{agent.reachable ? 'Online' : 'Unreachable'}</Badge>;
}

function MiniStat({ label, value }: { label: string; value: string | number }) {
  return <div className="rounded-xl bg-[#f5f8f7] px-3 py-2"><p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#86968f]">{label}</p><p className="mt-1 text-sm font-semibold text-[#23312d]">{value}</p></div>;
}

function AgentDialog({ agent, pending, globalMode, onOpenChange, onUpdate, onRun }: { agent: CommandOsAgent | null; pending: boolean; globalMode: CommandOsMode; onOpenChange: (open: boolean) => void; onUpdate: (agent: CommandOsAgent, update: Record<string, unknown>) => Promise<void>; onRun: (agent: CommandOsAgent, action: 'health_check' | 'dependency_check') => Promise<void> }) {
  if (!agent) return null;
  return (
    <Dialog open={Boolean(agent)} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3"><div className="rounded-2xl bg-[#e7f6f1] p-2.5 text-[#007c67]"><Cpu className="h-5 w-5" /></div><div><DialogTitle>{agent.label}</DialogTitle><DialogDescription>{agent.description}</DialogDescription></div></div>
        </DialogHeader>

        <div className="grid gap-3 sm:grid-cols-3">
          <MiniStat label="Service" value={agent.reachable ? 'Reachable' : 'Unreachable'} />
          <MiniStat label="Runs / failures" value={`${agent.runCount24h} / ${agent.failureCount24h}`} />
          <MiniStat label="Queue / failed" value={`${agent.pendingJobs} / ${agent.failedJobs}`} />
        </div>
        <div className="rounded-2xl border border-[#d8e1dd] bg-[#f8faf9] p-4 text-sm leading-6 text-[#52615c]">{agent.healthDetail}</div>

        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-[#111b21]">Operational state</h4>
          <div className="grid gap-2 sm:grid-cols-3">
            <Button variant={agent.status === 'enabled' ? 'default' : 'outline'} disabled={pending} onClick={() => onUpdate(agent, { status: 'enabled' })}><CirclePlay className="mr-2 h-4 w-4" />Enabled</Button>
            <Button variant={agent.status === 'paused' ? 'default' : 'outline'} disabled={pending} onClick={() => onUpdate(agent, { status: 'paused' })}><CirclePause className="mr-2 h-4 w-4" />Paused</Button>
            <Button variant={agent.status === 'disabled' ? 'destructive' : 'outline'} disabled={pending} onClick={() => onUpdate(agent, { status: 'disabled' })}><Power className="mr-2 h-4 w-4" />Disabled</Button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-semibold text-[#111b21]">Risk ceiling</label>
            <Select value={agent.max_risk_level} onValueChange={(value) => onUpdate(agent, { max_risk_level: value as CommandOsRiskLevel })} disabled={pending}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{(['L0', 'L1', 'L2', 'L3', 'L4'] as const).map((risk) => <SelectItem key={risk} value={risk}>{risk} — {risk === 'L0' ? 'observe' : risk === 'L1' ? 'draft' : risk === 'L2' ? 'internal reversible' : risk === 'L3' ? 'external approval' : 'critical approval'}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <ControlToggle label="Autonomy" detail="Allow scheduled L0-L2 work within risk ceiling" value={agent.autonomy_enabled} disabled={pending || agent.status !== 'enabled'} onClick={() => onUpdate(agent, { autonomy_enabled: !agent.autonomy_enabled })} />
            <ControlToggle label="Schedule" detail="Allow cron and queued runs" value={agent.schedule_enabled} disabled={pending || agent.status !== 'enabled'} onClick={() => onUpdate(agent, { schedule_enabled: !agent.schedule_enabled })} />
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-[#111b21]">Allowed tools</h4>
          <div className="mt-2 flex flex-wrap gap-2">{agent.allowed_tools.map((tool) => <Badge key={tool} variant="outline"><ShieldCheck className="mr-1 h-3 w-3" />{tool.replaceAll('_', ' ')}</Badge>)}</div>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <Button variant="outline" disabled={pending || globalMode === 'paused' || agent.status !== 'enabled' || !agent.allowed_tools.includes('health_check')} onClick={() => onRun(agent, 'health_check')}><HeartPulse className="mr-2 h-4 w-4" />Run health check</Button>
          <Button variant="outline" disabled={pending || globalMode === 'paused' || agent.status !== 'enabled' || !agent.allowed_tools.includes('dependency_check')} onClick={() => onRun(agent, 'dependency_check')}><ExternalLink className="mr-2 h-4 w-4" />Check dependencies</Button>
        </div>
        <p className="text-xs leading-5 text-[#7a8984]">These are L0 diagnostic runs only. Customer messages, deployments, billing, migrations, and other production mutations are not exposed here.</p>
      </DialogContent>
    </Dialog>
  );
}

function ControlToggle({ label, detail, value, disabled, onClick }: { label: string; detail: string; value: boolean; disabled: boolean; onClick: () => void }) {
  return <button type="button" disabled={disabled} onClick={onClick} className="flex w-full items-center justify-between rounded-xl border border-[#d8e1dd] p-3 text-left disabled:opacity-50"><span><span className="block text-sm font-medium text-[#111b21]">{label}</span><span className="block text-xs text-[#7a8984]">{detail}</span></span><Badge variant={value ? 'success' : 'outline'}>{value ? 'ON' : 'OFF'}</Badge></button>;
}

function RecentRuns({ runs }: { runs: CommandOsAgentRun[] }) {
  return (
    <AdminSection title="Recent agent runs" description="Unified 24-hour activity across service agents and dashboard diagnostics." action={<Badge variant="outline">{runs.length} runs</Badge>}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="border-b border-[#e7ecea] bg-[#f8faf9] text-xs uppercase tracking-[0.08em] text-[#7a8984]"><tr><th className="px-5 py-3">Agent</th><th className="px-5 py-3">Action</th><th className="px-5 py-3">Status</th><th className="px-5 py-3">Duration</th><th className="px-5 py-3">Time</th></tr></thead>
          <tbody className="divide-y divide-[#e7ecea]">
            {runs.slice(0, 30).map((run) => <tr key={run.id} className="hover:bg-[#fbfdfc]"><td className="px-5 py-3 font-medium text-[#111b21]">{run.agentLabel}</td><td className="px-5 py-3 text-[#52615c]">{run.action}</td><td className="px-5 py-3"><Badge variant={run.status === 'success' ? 'success' : run.status === 'partial' ? 'warning' : 'destructive'}>{run.status}</Badge></td><td className="px-5 py-3 text-[#667781]"><Timer className="mr-1 inline h-3.5 w-3.5" />{run.durationMs === null ? '—' : `${run.durationMs}ms`}</td><td className="px-5 py-3 text-[#667781]">{formatAdminDate(run.createdAt)}</td></tr>)}
            {!runs.length ? <tr><td colSpan={5} className="px-5 py-10 text-center text-[#667781]">No agent runs recorded in the last 24 hours.</td></tr> : null}
          </tbody>
        </table>
      </div>
    </AdminSection>
  );
}
