import { AlertTriangle, CheckCircle2, CircleDashed, Database, Radio, Server, ShieldCheck } from 'lucide-react';
import { AdminStatusBadge } from '@/components/admin/AdminPrimitives';
import type { OpsReadiness } from '@/lib/ops-readiness';
import type { WhatsAppHealth } from '@/lib/whatsapp-health';
import { cn } from '@/lib/utils';

export function AdminSystemHealth({
  readiness,
  whatsapp,
}: {
  readiness: OpsReadiness;
  whatsapp: WhatsAppHealth;
}) {
  return (
    <div className="space-y-5">
      <section className="grid gap-4 lg:grid-cols-3">
        <HealthSummary
          title="WhatsApp Cloud API"
          status={whatsapp.ok ? 'ready' : whatsapp.configured ? 'blocked' : 'not configured'}
          detail={whatsapp.ok ? `${whatsapp.profile?.verified_name || 'WhatsApp Business'} · ${whatsapp.profile?.display_phone_number || 'number connected'}` : whatsapp.error || 'Connection check unavailable.'}
          icon={Radio}
        />
        <HealthSummary
          title="Environment"
          status={readiness.envGroups.some((group) => group.status === 'blocked') ? 'blocked' : 'ready'}
          detail={`${readiness.envGroups.filter((group) => group.status === 'ready').length} of ${readiness.envGroups.length} groups ready`}
          icon={ShieldCheck}
        />
        <HealthSummary
          title="Database probes"
          status={readiness.dataProbes.some((probe) => probe.status === 'blocked') ? 'partial' : 'ready'}
          detail={`${readiness.dataProbes.filter((probe) => probe.status === 'ready').length} of ${readiness.dataProbes.length} probes passing`}
          icon={Database}
        />
      </section>

      <HealthSection title="Launch gates" description="Release-critical checks generated from the active runtime configuration.">
        <div className="grid gap-3 p-4 lg:grid-cols-2">
          {readiness.launchGates.map((gate) => <HealthRow key={gate.key} title={gate.label} status={gate.status} detail={gate.detail} />)}
        </div>
      </HealthSection>

      <HealthSection title="Environment groups" description="Presence checks only. Secret values are never rendered.">
        <div className="divide-y divide-[#edf1ef]">
          {readiness.envGroups.map((group) => (
            <div key={group.key} className="grid min-h-[76px] gap-2 px-5 py-4 md:grid-cols-[220px_110px_1fr] md:items-center">
              <p className="font-medium text-[#111b21]">{group.label}</p>
              <AdminStatusBadge status={group.status} />
              <p className="text-sm leading-5 text-[#667781]">{group.detail}</p>
            </div>
          ))}
        </div>
      </HealthSection>

      <HealthSection title="Service endpoints" description="Current health and dependency status for configured execution services.">
        <div className="grid gap-3 p-4 lg:grid-cols-2">
          {readiness.services.map((service) => <HealthRow key={service.key} title={service.label} status={service.status} detail={service.detail} />)}
        </div>
      </HealthSection>
    </div>
  );
}

function HealthSection({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return <section className="overflow-hidden rounded-2xl border border-[#d8e1dd] bg-white"><header className="border-b border-[#e7ecea] px-5 py-5"><h2 className="text-lg font-semibold tracking-[-0.02em]">{title}</h2><p className="mt-1 text-sm text-[#667781]">{description}</p></header>{children}</section>;
}

function HealthSummary({ title, status, detail, icon: Icon }: { title: string; status: string; detail: string; icon: typeof Server }) {
  const ready = status === 'ready';
  return <article className="rounded-2xl border border-[#d8e1dd] bg-white p-5"><div className="flex items-start justify-between gap-3"><div className={cn('flex h-11 w-11 items-center justify-center rounded-xl', ready ? 'bg-[#e4f5ef] text-[#075e54]' : 'bg-[#fff0dc] text-[#9a4b0f]')}><Icon className="h-5 w-5" /></div><AdminStatusBadge status={status} /></div><h3 className="mt-5 font-semibold text-[#111b21]">{title}</h3><p className="mt-1 text-sm leading-5 text-[#667781]">{detail}</p></article>;
}

function HealthRow({ title, status, detail }: { title: string; status: string; detail: string }) {
  const Icon = status === 'ready' ? CheckCircle2 : status === 'blocked' ? AlertTriangle : CircleDashed;
  return <article className="rounded-xl border border-[#dce4e1] bg-[#fbfdfc] p-4"><div className="flex items-start gap-3"><Icon className={cn('mt-0.5 h-4 w-4 shrink-0', status === 'ready' ? 'text-[#00a884]' : status === 'blocked' ? 'text-red-600' : 'text-amber-600')} /><div><div className="flex flex-wrap items-center gap-2"><h3 className="font-medium text-[#111b21]">{title}</h3><AdminStatusBadge status={status} /></div><p className="mt-2 text-xs leading-5 text-[#667781]">{detail}</p></div></div></article>;
}
