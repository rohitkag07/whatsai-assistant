'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import {
  Bot,
  CalendarCheck,
  Check,
  Eye,
  MessageCircle,
  Pause,
  Phone,
  Play,
  RefreshCw,
  Settings2,
  Sparkles,
  Users,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type {
  AdminModuleDefinition,
  AdminModuleId,
  AdminModuleState,
} from '@/lib/admin-control';
import { cn } from '@/lib/utils';

type BusinessRow = {
  id: string;
  name: string;
  category: string;
  status: string;
  plan: string;
  city: string | null;
  owner_name: string | null;
  owner_phone: string | null;
  updated_at: string;
  whatsapp_phone?: string | null;
  whatsapp_status?: string;
};

type ChannelRow = {
  id: string;
  business_id: string;
  channel_type: string;
  phone_number: string | null;
  display_name: string | null;
  status: string;
  is_primary: boolean;
  last_verified_at: string | null;
};

type Props = {
  businesses: BusinessRow[];
  selectedBusinessId: string | null;
  selectedBusiness: BusinessRow | null;
  selectedChannels: ChannelRow[];
  selectedCounts: {
    contacts: number;
    appointments: number;
    handoffs: number;
  } | null;
  overview: {
    totalClients: number;
    liveConnections: number;
    messagesSentToday: number;
    hotHandoffs: number;
  };
  moduleDefinitions: AdminModuleDefinition[];
  moduleStates: Record<AdminModuleId, AdminModuleState> | null;
};

const moduleIcon: Record<AdminModuleId, React.ComponentType<{ className?: string }>> = {
  whatsapp: Wifi,
  assistant: Bot,
  followups: RefreshCw,
  knowledge: Sparkles,
  calendar: CalendarCheck,
  handoffs: MessageCircle,
  broadcasts: MessageCircle,
};

export function AdminControlPanel({
  businesses,
  selectedBusinessId,
  selectedBusiness,
  selectedChannels,
  selectedCounts,
  overview,
  moduleDefinitions,
  moduleStates,
}: Props) {
  const router = useRouter();
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [localModuleStates, setLocalModuleStates] = useState(moduleStates);
  const selectedName = useMemo(
    () =>
      businesses.find((business) => business.id === selectedBusinessId)?.name ??
      selectedBusiness?.name ??
      'Selected client',
    [businesses, selectedBusiness, selectedBusinessId],
  );
  const primaryChannel =
    selectedChannels.find((channel) => channel.is_primary) ??
    selectedChannels[0] ??
    null;

  useEffect(() => {
    setLocalModuleStates(moduleStates);
  }, [moduleStates, selectedBusinessId]);

  async function setActiveClient(
    businessId: string,
    destination: 'dashboard' | 'settings',
  ) {
    setPendingAction(`select:${businessId}`);
    try {
      const response = await fetch('/api/admin/active-business', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ business_id: businessId }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.error || 'Client switch failed.');

      if (destination === 'dashboard') {
        router.push('/dashboard');
      } else {
        router.push(`/admin?business_id=${businessId}#client-settings`);
        router.refresh();
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Client switch failed.',
      );
    } finally {
      setPendingAction(null);
    }
  }

  async function setBotPaused(business: BusinessRow) {
    const paused = business.status !== 'paused';
    setPendingAction(`status:${business.id}`);
    try {
      const response = await fetch('/api/admin/business/status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ business_id: business.id, paused }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.error || 'Bot status failed.');
      toast.success(paused ? `${business.name} bot paused` : `${business.name} bot resumed`);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Bot status failed.');
    } finally {
      setPendingAction(null);
    }
  }

  async function toggleModule(moduleId: AdminModuleId, enabled: boolean) {
    if (!selectedBusinessId) return;
    const previous = localModuleStates;
    setPendingAction(`module:${moduleId}`);
    setLocalModuleStates((current) => {
      if (!current) return current;
      return {
        ...current,
        [moduleId]: { ...current[moduleId], enabled },
      };
    });

    try {
      const response = await fetch('/api/admin/business/modules', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business_id: selectedBusinessId,
          module_id: moduleId,
          enabled,
        }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.error || 'Feature update failed.');
      toast.success(`${moduleLabel(moduleId)} ${enabled ? 'enabled' : 'paused'}`);
      router.refresh();
    } catch (error) {
      setLocalModuleStates(previous);
      toast.error(
        error instanceof Error ? error.message : 'Feature update failed.',
      );
    } finally {
      setPendingAction(null);
    }
  }

  return (
    <div className="mx-auto max-w-[1540px] space-y-6">
      <header className="flex flex-col gap-4 border-b border-[#d8dee4] pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#008b73]">
            Agency operations
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.045em] text-[#111b21] sm:text-4xl">
            Client control room
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#667781]">
            See every client, open their workspace, and control the three services
            that affect live customer conversations.
          </p>
        </div>
        <div className="inline-flex w-fit items-center gap-2 rounded-full border border-[#b7ddd2] bg-[#edf8f4] px-3 py-2 text-xs font-semibold text-[#075e54]">
          <span className="h-2 w-2 rounded-full bg-[#00a884]" />
          Platform access active
        </div>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Platform overview">
        <OverviewMetric label="Total clients" value={overview.totalClients} icon={Users} tone="green" />
        <OverviewMetric label="Live WhatsApp" value={overview.liveConnections} icon={Wifi} tone="teal" />
        <OverviewMetric label="Messages sent today" value={overview.messagesSentToday} icon={MessageCircle} tone="blue" />
        <OverviewMetric label="Hot handoffs pending" value={overview.hotHandoffs} icon={Sparkles} tone={overview.hotHandoffs ? 'amber' : 'slate'} />
      </section>

      <section className="overflow-hidden rounded-2xl border border-[#d8dee4] bg-white shadow-[0_12px_35px_rgba(17,27,33,0.05)]">
        <div className="flex flex-col gap-2 border-b border-[#e7ebe9] px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-[-0.025em] text-[#111b21]">
              Client directory
            </h2>
            <p className="mt-1 text-sm text-[#667781]">
              Inspect a client workspace or pause its automated replies.
            </p>
          </div>
          <Badge variant="outline">{businesses.length} clients</Badge>
        </div>

        <div className="hidden overflow-x-auto md:block">
          <Table>
            <TableHeader>
              <TableRow className="bg-[#f8faf9] hover:bg-[#f8faf9]">
                <TableHead className="pl-5">Business</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>WhatsApp number</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="pr-5 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {businesses.map((business) => (
                <TableRow
                  key={business.id}
                  className={cn(
                    'h-[76px]',
                    business.id === selectedBusinessId && 'bg-[#fbfefd]',
                  )}
                >
                  <TableCell className="pl-5">
                    <div className="font-semibold text-[#111b21]">{business.name}</div>
                    <div className="mt-1 text-xs text-[#667781]">
                      {business.city || 'City not set'} · {business.plan}
                    </div>
                  </TableCell>
                  <TableCell className="capitalize text-[#44534e]">
                    {business.category.replaceAll('_', ' ')}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-sm text-[#44534e]">
                      <Phone className="h-3.5 w-3.5 text-[#00a884]" />
                      {business.whatsapp_phone || 'Not connected'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <StatusBadge business={business} />
                  </TableCell>
                  <TableCell className="pr-5">
                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={pendingAction === `select:${business.id}`}
                        onClick={() => setActiveClient(business.id, 'dashboard')}
                      >
                        <Eye className="mr-1.5 h-4 w-4" />
                        Inspect
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => setActiveClient(business.id, 'settings')}
                      >
                        <Settings2 className="mr-1.5 h-4 w-4" />
                        Settings
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant={business.status === 'paused' ? 'default' : 'ghost'}
                        disabled={pendingAction === `status:${business.id}`}
                        onClick={() => setBotPaused(business)}
                        className={business.status === 'paused' ? 'bg-[#075e54] hover:bg-[#064e46]' : 'text-[#9a4b0f] hover:bg-amber-50 hover:text-[#8a3f08]'}
                      >
                        {business.status === 'paused' ? <Play className="mr-1.5 h-4 w-4" /> : <Pause className="mr-1.5 h-4 w-4" />}
                        {business.status === 'paused' ? 'Resume' : 'Pause bot'}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="grid gap-3 p-3 md:hidden">
          {businesses.map((business) => (
            <article key={business.id} className="rounded-xl border border-[#e1e7e4] p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-[#111b21]">{business.name}</h3>
                  <p className="mt-1 text-xs capitalize text-[#667781]">
                    {business.category.replaceAll('_', ' ')} · {business.city || 'City not set'}
                  </p>
                </div>
                <StatusBadge business={business} />
              </div>
              <div className="mt-3 flex items-center gap-2 text-sm text-[#44534e]">
                <Phone className="h-4 w-4 text-[#00a884]" />
                {business.whatsapp_phone || 'WhatsApp not connected'}
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <Button type="button" size="sm" onClick={() => setActiveClient(business.id, 'dashboard')} className="bg-[#075e54] hover:bg-[#064e46]">
                  <Eye className="mr-1.5 h-4 w-4" /> Inspect
                </Button>
                <Button type="button" size="sm" variant="outline" onClick={() => setActiveClient(business.id, 'settings')}>
                  <Settings2 className="mr-1.5 h-4 w-4" /> Settings
                </Button>
                <Button type="button" size="sm" variant="ghost" onClick={() => setBotPaused(business)} className="col-span-2 text-[#9a4b0f]">
                  {business.status === 'paused' ? <Play className="mr-1.5 h-4 w-4" /> : <Pause className="mr-1.5 h-4 w-4" />}
                  {business.status === 'paused' ? 'Resume bot' : 'Pause bot'}
                </Button>
              </div>
            </article>
          ))}
        </div>

        {!businesses.length ? (
          <div className="px-5 py-14 text-center">
            <Users className="mx-auto h-8 w-8 text-[#8696a0]" />
            <h3 className="mt-3 font-semibold text-[#111b21]">No clients yet</h3>
            <p className="mt-1 text-sm text-[#667781]">
              A client appears here after their business profile is created.
            </p>
          </div>
        ) : null}
      </section>

      <section
        id="client-settings"
        className="scroll-mt-32 rounded-2xl border border-[#d8dee4] bg-white p-5 shadow-[0_12px_35px_rgba(17,27,33,0.05)] sm:p-6"
      >
        {selectedBusiness ? (
          <>
            <div className="flex flex-col gap-4 border-b border-[#e7ebe9] pb-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#008b73]">
                  Client settings
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-[-0.035em] text-[#111b21]">
                  {selectedName}
                </h2>
                <p className="mt-1 text-sm text-[#667781]">
                  {primaryChannel?.phone_number || selectedBusiness.owner_phone || 'WhatsApp number pending'}
                  {' · '}
                  {selectedBusiness.plan}
                </p>
              </div>
              <Button
                type="button"
                onClick={() => setActiveClient(selectedBusiness.id, 'dashboard')}
                className="bg-[#075e54] hover:bg-[#064e46]"
              >
                <Eye className="mr-2 h-4 w-4" />
                Inspect Client Dashboard
              </Button>
            </div>

            <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-[#111b21]">Live features</h3>
                {moduleDefinitions.map((module) => {
                  const state = localModuleStates?.[module.id];
                  const enabled = state?.enabled ?? module.defaultEnabled;
                  const Icon = moduleIcon[module.id];
                  return (
                    <div
                      key={module.id}
                      className="flex items-center justify-between gap-4 rounded-xl border border-[#e1e7e4] p-4"
                    >
                      <div className="flex min-w-0 gap-3">
                        <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', enabled ? 'bg-[#edf8f4] text-[#075e54]' : 'bg-[#f0f2f5] text-[#8696a0]')}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="font-semibold text-[#111b21]">{moduleLabel(module.id)}</div>
                          <p className="mt-1 text-xs leading-5 text-[#667781]">{operatorDescription(module.id)}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={enabled}
                        aria-label={`${enabled ? 'Disable' : 'Enable'} ${moduleLabel(module.id)}`}
                        disabled={pendingAction === `module:${module.id}`}
                        onClick={() => toggleModule(module.id, !enabled)}
                        className={cn(
                          'relative h-7 w-12 shrink-0 rounded-full border p-0.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00a884] focus-visible:ring-offset-2 disabled:opacity-60',
                          enabled ? 'border-[#00a884] bg-[#00a884]' : 'border-[#cfd8d5] bg-[#e7ebe9]',
                        )}
                      >
                        <span className={cn('flex h-5 w-5 items-center justify-center rounded-full bg-white shadow-sm transition-transform', enabled && 'translate-x-5')}>
                          {enabled ? <Check className="h-3 w-3 text-[#008b73]" /> : null}
                        </span>
                      </button>
                    </div>
                  );
                })}
              </div>

              <aside className="rounded-xl bg-[#f7faf8] p-4">
                <h3 className="text-sm font-semibold text-[#111b21]">Client snapshot</h3>
                <div className="mt-4 space-y-3">
                  <SnapshotRow label="WhatsApp" value={connectionLabel(primaryChannel?.status)} icon={primaryChannel?.status === 'connected' ? Wifi : WifiOff} />
                  <SnapshotRow label="Contacts" value={String(selectedCounts?.contacts ?? 0)} icon={Users} />
                  <SnapshotRow label="Upcoming bookings" value={String(selectedCounts?.appointments ?? 0)} icon={CalendarCheck} />
                  <SnapshotRow label="Pending handoffs" value={String(selectedCounts?.handoffs ?? 0)} icon={MessageCircle} attention={Boolean(selectedCounts?.handoffs)} />
                </div>
              </aside>
            </div>
          </>
        ) : (
          <div className="py-10 text-center">
            <Settings2 className="mx-auto h-8 w-8 text-[#8696a0]" />
            <h2 className="mt-3 font-semibold text-[#111b21]">Select a client</h2>
            <p className="mt-1 text-sm text-[#667781]">
              Choose Settings in the directory to manage that client.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}

function OverviewMetric({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  tone: 'green' | 'teal' | 'blue' | 'amber' | 'slate';
}) {
  const toneClass = {
    green: 'bg-[#e7f8ef] text-[#087d4f]',
    teal: 'bg-[#e6f7f4] text-[#075e54]',
    blue: 'bg-[#eaf2ff] text-[#315d9b]',
    amber: 'bg-[#fff0dc] text-[#a84f0f]',
    slate: 'bg-[#eef1f2] text-[#52615c]',
  }[tone];
  return (
    <Card className="border-[#d8dee4] shadow-none">
      <CardContent className="flex min-h-28 items-center gap-4 p-5">
        <div className={cn('flex h-11 w-11 items-center justify-center rounded-xl', toneClass)}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <div className="text-3xl font-semibold tracking-[-0.05em] text-[#111b21]">{value}</div>
          <div className="mt-1 text-xs text-[#667781]">{label}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function StatusBadge({ business }: { business: BusinessRow }) {
  const active = business.status !== 'paused' && business.status !== 'cancelled';
  return (
    <Badge variant={active ? 'success' : business.status === 'paused' ? 'warning' : 'outline'}>
      <span className={cn('mr-1.5 h-1.5 w-1.5 rounded-full', active ? 'bg-[#00a884]' : 'bg-current')} />
      {business.status === 'paused' ? 'Paused' : active ? 'Active' : business.status}
    </Badge>
  );
}

function SnapshotRow({
  label,
  value,
  icon: Icon,
  attention = false,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  attention?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg bg-white p-3">
      <Icon className={cn('h-4 w-4', attention ? 'text-[#b45309]' : 'text-[#008b73]')} />
      <span className="flex-1 text-xs text-[#667781]">{label}</span>
      <span className="text-sm font-semibold text-[#111b21]">{value}</span>
    </div>
  );
}

function moduleLabel(moduleId: AdminModuleId) {
  return {
    assistant: 'AI Auto-Reply',
    followups: 'Follow-up Sequences',
    whatsapp: 'WhatsApp Channel',
    knowledge: 'Knowledge Base',
    calendar: 'Appointments',
    handoffs: 'Owner Handoffs',
    broadcasts: 'Broadcasts',
  }[moduleId];
}

function operatorDescription(moduleId: AdminModuleId) {
  return {
    assistant: 'Answer new customer messages with the approved business playbook.',
    followups: 'Send scheduled reminders when a lead stops responding.',
    whatsapp: 'Receive and send customer messages through this business number.',
    knowledge: 'Use published business answers.',
    calendar: 'Allow appointment booking.',
    handoffs: 'Escalate conversations to the owner.',
    broadcasts: 'Send approved campaigns.',
  }[moduleId];
}

function connectionLabel(status?: string) {
  if (status === 'connected') return 'Connected';
  if (status === 'testing') return 'Needs check';
  if (status === 'disabled') return 'Paused';
  return 'Reconnect needed';
}
