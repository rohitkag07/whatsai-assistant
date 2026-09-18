'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  PauseCircle,
  PlayCircle,
  ShieldCheck,
  XCircle,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AdminSection, formatAdminDate } from '@/components/admin/AdminPrimitives';
import { AgentControlCenter } from '@/components/admin/AgentControlCenter';
import type {
  CommandOsAction,
  CommandOsAlert,
  CommandOsApproval,
  CommandOsDashboard,
  CommandOsHealth,
  CommandOsSettings,
} from '@/lib/command-os-data';
import { cn } from '@/lib/utils';

export function CommandOsConsole({ dashboard }: { dashboard: CommandOsDashboard }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function refresh() {
    startTransition(() => router.refresh());
  }

  async function updateSettings(update: Partial<CommandOsSettings>) {
    setError(null);
    const response = await fetch('/api/admin/command-os/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(update),
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      setError(payload?.error || 'Command OS settings update failed.');
      return;
    }
    refresh();
  }

  async function decideApproval(id: string, decision: 'approved' | 'rejected') {
    setError(null);
    const response = await fetch(`/api/admin/command-os/approvals/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ decision }),
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      setError(payload?.error || 'Approval decision failed.');
      return;
    }
    refresh();
  }

  return (
    <div className="space-y-6">
      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {typeof error === 'string' ? error : JSON.stringify(error)}
        </div>
      ) : null}

      <HealthStrip health={dashboard.health} />

      <AgentControlCenter
        agents={dashboard.agents}
        recentRuns={dashboard.recentRuns}
        globalMode={dashboard.settings.mode}
        persistenceReady={dashboard.persistenceReady}
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(360px,0.75fr)]">
        <div className="space-y-6">
          <SettingsPanel settings={dashboard.settings} pending={pending} onUpdate={updateSettings} />
          <ApprovalsPanel approvals={dashboard.pendingApprovals} pending={pending} onDecide={decideApproval} />
          <ActionsPanel actions={dashboard.recentActions} />
        </div>
        <div className="space-y-6">
          <RecommendationsPanel recommendations={dashboard.health.recommendations} />
          <AlertsPanel alerts={dashboard.openAlerts} />
        </div>
      </div>
    </div>
  );
}

function HealthStrip({ health }: { health: CommandOsHealth }) {
  const tone = {
    healthy: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    watch: 'border-amber-200 bg-amber-50 text-amber-800',
    critical: 'border-red-200 bg-red-50 text-red-800',
    setup: 'border-slate-200 bg-slate-50 text-slate-700',
  }[health.overall];

  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
      <div className={cn('rounded-2xl border p-4', tone)}>
        <div className="flex items-center gap-2 text-sm font-semibold capitalize">
          <ShieldCheck className="h-4 w-4" /> {health.overall}
        </div>
        <p className="mt-2 text-xs leading-5 opacity-80">Supervised single-profile operating status.</p>
      </div>
      <HealthMetric label="Clients" value={health.stats.totalClients} detail={`${health.stats.liveConnections} live WhatsApp`} />
      <HealthMetric label="Messages today" value={health.stats.messagesToday} detail={`${health.stats.failedMessages24h} failed in 24h`} />
      <HealthMetric label="Handoffs" value={health.stats.hotHandoffs} detail="Need owner attention" />
      <HealthMetric label="Approvals" value={health.stats.pendingApprovals} detail={`${health.stats.actionsToday} actions today`} />
    </section>
  );
}

function HealthMetric({ label, value, detail }: { label: string; value: number | string; detail: string }) {
  return (
    <div className="rounded-2xl border border-[#d8e1dd] bg-white p-4 shadow-[0_10px_30px_rgba(17,27,33,0.035)]">
      <p className="text-xs font-semibold text-[#667781]">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-[-0.045em] text-[#111b21]">{value}</p>
      <p className="mt-1 text-xs text-[#7a8984]">{detail}</p>
    </div>
  );
}

function SettingsPanel({
  settings,
  pending,
  onUpdate,
}: {
  settings: CommandOsSettings;
  pending: boolean;
  onUpdate: (update: Partial<CommandOsSettings>) => Promise<void>;
}) {
  const paused = settings.mode === 'paused';
  const readOnly = settings.mode === 'read_only';

  return (
    <AdminSection title="Kill switch & autonomy" description="Same Hermes profile, but writes are constrained by this supervised policy layer.">
      <div className="space-y-4 p-5">
        <div className="flex flex-wrap gap-2">
          <Button disabled={pending || settings.mode === 'supervised'} onClick={() => onUpdate({ mode: 'supervised' })}>
            <PlayCircle className="mr-2 h-4 w-4" /> Supervised on
          </Button>
          <Button disabled={pending || readOnly} variant="outline" onClick={() => onUpdate({ mode: 'read_only', external_comms_enabled: false, production_writes_enabled: false, deployments_enabled: false, mcp_writes_enabled: false })}>
            <ShieldCheck className="mr-2 h-4 w-4" /> Read-only
          </Button>
          <Button disabled={pending || paused} variant="destructive" onClick={() => onUpdate({ mode: 'paused', external_comms_enabled: false, production_writes_enabled: false, deployments_enabled: false, mcp_writes_enabled: false })}>
            <PauseCircle className="mr-2 h-4 w-4" /> Pause all
          </Button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <ToggleRow label="External communication" value={settings.external_comms_enabled} onClick={() => onUpdate({ external_comms_enabled: !settings.external_comms_enabled })} pending={pending || settings.mode !== 'supervised'} />
          <ToggleRow label="Production writes" value={settings.production_writes_enabled} onClick={() => onUpdate({ production_writes_enabled: !settings.production_writes_enabled })} pending={pending || settings.mode !== 'supervised'} />
          <ToggleRow label="Deployments" value={settings.deployments_enabled} onClick={() => onUpdate({ deployments_enabled: !settings.deployments_enabled })} pending={pending || settings.mode !== 'supervised'} />
          <ToggleRow label="MCP write tools" value={settings.mcp_writes_enabled} onClick={() => onUpdate({ mcp_writes_enabled: !settings.mcp_writes_enabled })} pending={pending || settings.mode !== 'supervised'} />
          <ToggleRow label="Cron/Sentinel" value={settings.cron_enabled} onClick={() => onUpdate({ cron_enabled: !settings.cron_enabled })} pending={pending} />
        </div>

        <p className="text-xs text-[#667781]">Last updated {formatAdminDate(settings.updated_at)}. L3/L4 actions still require explicit approval even when toggles are on.</p>
      </div>
    </AdminSection>
  );
}

function ToggleRow({ label, value, pending, onClick }: { label: string; value: boolean; pending: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      disabled={pending}
      onClick={onClick}
      className="flex items-center justify-between rounded-2xl border border-[#d8e1dd] bg-[#fbfdfc] px-4 py-3 text-left text-sm transition hover:border-[#8fd2c0] disabled:opacity-50"
    >
      <span className="font-medium text-[#111b21]">{label}</span>
      <Badge variant={value ? 'success' : 'outline'}>{value ? 'ON' : 'OFF'}</Badge>
    </button>
  );
}

function ApprovalsPanel({ approvals, pending, onDecide }: { approvals: CommandOsApproval[]; pending: boolean; onDecide: (id: string, decision: 'approved' | 'rejected') => Promise<void> }) {
  return (
    <AdminSection title="Needs approval" description="External-impact and critical actions stop here until founder/admin decides.">
      <div className="divide-y divide-[#e7ecea]">
        {approvals.length ? approvals.map((approval) => (
          <article key={approval.id} className="space-y-3 p-5">
            <div className="flex flex-wrap items-center gap-2">
              <RiskBadge risk={approval.risk_level} />
              <Badge variant="warning"><Clock3 className="mr-1 h-3 w-3" /> Pending</Badge>
            </div>
            <div>
              <h3 className="font-semibold tracking-[-0.02em] text-[#111b21]">{approval.title}</h3>
              <p className="mt-1 text-sm leading-6 text-[#667781]">{approval.action?.summary ?? approval.reason}</p>
            </div>
            {approval.action?.expected_impact ? <p className="text-xs text-[#52615c]"><b>Impact:</b> {approval.action.expected_impact}</p> : null}
            {approval.action?.rollback_plan ? <p className="text-xs text-[#52615c]"><b>Rollback:</b> {approval.action.rollback_plan}</p> : null}
            <div className="flex gap-2">
              <Button disabled={pending} size="sm" onClick={() => onDecide(approval.id, 'approved')}><CheckCircle2 className="mr-2 h-4 w-4" /> Approve</Button>
              <Button disabled={pending} size="sm" variant="outline" onClick={() => onDecide(approval.id, 'rejected')}><XCircle className="mr-2 h-4 w-4" /> Reject</Button>
            </div>
          </article>
        )) : (
          <div className="p-6 text-sm text-[#667781]">No pending approvals. Hermes can keep preparing drafts and L0-L2 internal work.</div>
        )}
      </div>
    </AdminSection>
  );
}

function RecommendationsPanel({ recommendations }: { recommendations: CommandOsHealth['recommendations'] }) {
  return (
    <AdminSection title="Founder recommendations" description="The current best next actions, tagged by mode and risk.">
      <div className="space-y-3 p-5">
        {recommendations.map((item) => (
          <div key={`${item.title}-${item.risk}`} className="rounded-2xl border border-[#d8e1dd] bg-[#fbfdfc] p-4">
            <div className="flex flex-wrap items-center gap-2"><RiskBadge risk={item.risk} /><Badge variant="outline" className="capitalize">{item.mode}</Badge></div>
            <h3 className="mt-3 font-semibold text-[#111b21]">{item.title}</h3>
            <p className="mt-1 text-sm leading-6 text-[#667781]">{item.summary}</p>
          </div>
        ))}
      </div>
    </AdminSection>
  );
}

function AlertsPanel({ alerts }: { alerts: CommandOsAlert[] }) {
  return (
    <AdminSection title="Sentinel alerts" description="Normal should be silent; abnormal gets surfaced here.">
      <div className="divide-y divide-[#e7ecea]">
        {alerts.length ? alerts.map((alert) => (
          <article key={alert.id} className="p-5">
            <div className="flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-amber-600" /><Badge variant={alert.severity === 'critical' ? 'destructive' : alert.severity === 'warning' ? 'warning' : 'outline'}>{alert.severity}</Badge></div>
            <h3 className="mt-3 font-semibold text-[#111b21]">{alert.title}</h3>
            <p className="mt-1 text-sm leading-6 text-[#667781]">{alert.summary}</p>
            <p className="mt-2 text-xs text-[#86968f]">{alert.business_name ?? 'Platform'} · {formatAdminDate(alert.created_at)}</p>
          </article>
        )) : <div className="p-6 text-sm text-[#667781]">No open alerts.</div>}
      </div>
    </AdminSection>
  );
}

function ActionsPanel({ actions }: { actions: CommandOsAction[] }) {
  return (
    <AdminSection title="Audit trail" description="Recent proposed, approved, rejected, and low-risk executed AI OS actions.">
      <div className="divide-y divide-[#e7ecea]">
        {actions.length ? actions.map((action) => (
          <article key={action.id} className="p-5">
            <div className="flex flex-wrap items-center gap-2"><RiskBadge risk={action.risk_level} /><StatusBadge status={action.status} /><Badge variant="outline" className="capitalize">{action.mode}</Badge></div>
            <h3 className="mt-3 font-semibold text-[#111b21]">{action.title}</h3>
            <p className="mt-1 text-sm leading-6 text-[#667781]">{action.summary}</p>
            <p className="mt-2 text-xs text-[#86968f]">{action.business_name ?? 'Platform'} · {formatAdminDate(action.created_at)}</p>
          </article>
        )) : <div className="p-6 text-sm text-[#667781]">No Command OS actions recorded yet.</div>}
      </div>
    </AdminSection>
  );
}

function RiskBadge({ risk }: { risk: string }) {
  const variant = risk === 'L4' || risk === 'L3' ? 'destructive' : risk === 'L2' ? 'warning' : 'success';
  return <Badge variant={variant}>{risk}</Badge>;
}

function StatusBadge({ status }: { status: string }) {
  const variant = status === 'approved' || status === 'executed' ? 'success' : status === 'rejected' || status === 'failed' ? 'destructive' : 'outline';
  return <Badge variant={variant} className="capitalize">{status}</Badge>;
}
