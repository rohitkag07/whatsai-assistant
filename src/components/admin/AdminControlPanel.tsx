'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState, type FormEvent } from 'react';
import {
  Activity,
  CalendarDays,
  CheckCircle2,
  CircleOff,
  KeyRound,
  MessageCircle,
  RadioTower,
  RefreshCw,
  ShieldCheck,
  SlidersHorizontal,
  UserPlus,
  Users,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import type { AdminModuleDefinition, AdminModuleId, AdminModuleState } from '@/lib/admin-control';

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
};

type ChannelRow = {
  id: string;
  channel_type: string;
  phone_number: string | null;
  phone_number_id: string | null;
  display_name: string | null;
  status: string;
  is_primary: boolean;
  last_verified_at: string | null;
};

type MemberRow = {
  id: string;
  user_id: string;
  display_name: string | null;
  role: string;
  active: boolean;
  created_at: string;
};

type Counts = {
  contacts: number;
  threads: number;
  appointments: number;
  handoffs: number;
  knowledge: number;
};

type Props = {
  businesses: BusinessRow[];
  selectedBusinessId: string | null;
  selectedBusiness: BusinessRow | null;
  channels: ChannelRow[];
  members: MemberRow[];
  counts: Counts | null;
  moduleDefinitions: AdminModuleDefinition[];
  moduleStates: Record<AdminModuleId, AdminModuleState> | null;
};

const iconByModule: Record<AdminModuleId, React.ComponentType<{ className?: string }>> = {
  whatsapp: RadioTower,
  assistant: MessageCircle,
  knowledge: KeyRound,
  calendar: CalendarDays,
  handoffs: ShieldCheck,
  followups: RefreshCw,
  broadcasts: Activity,
};

const roleOptions = ['owner', 'manager', 'agent', 'client', 'admin', 'dev'];

export function AdminControlPanel({
  businesses,
  selectedBusinessId,
  selectedBusiness,
  channels,
  members,
  counts,
  moduleDefinitions,
  moduleStates,
}: Props) {
  const router = useRouter();
  const [pendingModule, setPendingModule] = useState<string | null>(null);
  const [pendingMember, setPendingMember] = useState<string | null>(null);
  const [memberError, setMemberError] = useState<string | null>(null);
  const [moduleError, setModuleError] = useState<string | null>(null);

  const selectedName = useMemo(
    () => businesses.find((business) => business.id === selectedBusinessId)?.name ?? selectedBusiness?.name ?? null,
    [businesses, selectedBusiness, selectedBusinessId],
  );

  async function toggleModule(moduleId: AdminModuleId, enabled: boolean) {
    if (!selectedBusinessId) return;
    setPendingModule(moduleId);
    setModuleError(null);
    const response = await fetch('/api/admin/business/modules', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ business_id: selectedBusinessId, module_id: moduleId, enabled }),
    });
    const payload = await response.json().catch(() => null);
    setPendingModule(null);
    if (!response.ok) {
      setModuleError(payload?.error || 'Module update failed.');
      return;
    }
    router.refresh();
  }

  async function addMember(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedBusinessId) return;
    const form = new FormData(event.currentTarget);
    setPendingMember('new');
    setMemberError(null);
    const response = await fetch('/api/admin/business/members', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        business_id: selectedBusinessId,
        user_id: String(form.get('user_id') || ''),
        display_name: String(form.get('display_name') || ''),
        role: String(form.get('role') || 'client'),
      }),
    });
    const payload = await response.json().catch(() => null);
    setPendingMember(null);
    if (!response.ok) {
      setMemberError(payload?.error || 'Member create failed.');
      return;
    }
    event.currentTarget.reset();
    router.refresh();
  }

  async function updateMember(memberId: string, patch: { role?: string; active?: boolean }) {
    if (!selectedBusinessId) return;
    setPendingMember(memberId);
    setMemberError(null);
    const response = await fetch('/api/admin/business/members', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ business_id: selectedBusinessId, member_id: memberId, ...patch }),
    });
    const payload = await response.json().catch(() => null);
    setPendingMember(null);
    if (!response.ok) {
      setMemberError(payload?.error || 'Member update failed.');
      return;
    }
    router.refresh();
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(300px,360px)_1fr]">
      <section className="space-y-4">
        <div>
          <p className="text-sm font-medium text-[#075e54]">Client control center</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#111b21]">Admin dashboard</h1>
          <p className="mt-3 text-sm leading-6 text-[#667781]">
            Platform-only controls for XeroWA clients. Tenant rows load only after a business is selected.
          </p>
        </div>

        <div className="space-y-2">
          {businesses.map((business) => {
            const active = business.id === selectedBusinessId;
            return (
              <Link
                key={business.id}
                href={`/admin?business_id=${business.id}`}
                className={cn(
                  'block rounded-lg border p-4 transition-colors',
                  active ? 'border-[#00a884] bg-[#edf8f4]' : 'border-[#d8dee4] bg-white hover:border-[#00a884]',
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-[#111b21]">{business.name}</div>
                    <div className="mt-1 text-xs text-[#667781]">{business.city || 'City not set'} · {business.category}</div>
                  </div>
                  <Badge variant={business.status === 'active' ? 'success' : 'outline'}>{business.status}</Badge>
                </div>
                <div className="mt-3 flex items-center justify-between text-xs text-[#667781]">
                  <span>{business.plan}</span>
                  <span>{business.owner_name || 'Owner pending'}</span>
                </div>
              </Link>
            );
          })}
          {!businesses.length ? (
            <div className="rounded-lg border border-dashed border-[#d8dee4] bg-white p-5 text-sm text-[#667781]">
              No businesses found for admin review.
            </div>
          ) : null}
        </div>
      </section>

      <section className="space-y-5">
        {!selectedBusinessId ? (
          <div className="rounded-lg border border-dashed border-[#b8d8ce] bg-white p-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#edf8f4] text-[#075e54]">
              <SlidersHorizontal className="h-5 w-5" />
            </div>
            <h2 className="mt-5 text-xl font-semibold text-[#111b21]">Select a client before tenant data loads</h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-[#667781]">
              Channels, members, operational toggles, and tenant metrics appear only after a client is selected.
            </p>
          </div>
        ) : null}

        {selectedBusinessId && !selectedBusiness ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive">
            Selected business was not found. Choose another client from the list.
          </div>
        ) : null}

        {selectedBusiness ? (
          <>
            <div className="flex flex-col gap-3 rounded-lg border border-[#d8dee4] bg-white p-5 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs font-medium uppercase text-[#667781]">Selected client</p>
                <h2 className="mt-1 text-xl font-semibold text-[#111b21]">{selectedName}</h2>
                <p className="mt-1 text-sm text-[#667781]">{selectedBusiness.owner_phone || 'Owner phone pending'} · {selectedBusiness.plan}</p>
              </div>
              <Badge variant="success" className="w-fit">explicit business selected</Badge>
            </div>

            {counts ? (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                <Metric label="Contacts" value={counts.contacts} />
                <Metric label="Threads" value={counts.threads} />
                <Metric label="Appointments" value={counts.appointments} />
                <Metric label="Handoffs" value={counts.handoffs} />
                <Metric label="Knowledge" value={counts.knowledge} />
              </div>
            ) : null}

            <div className="grid gap-4 lg:grid-cols-2">
              <Card className="shadow-none">
                <CardHeader>
                  <CardTitle className="text-base">Channel Status</CardTitle>
                  <CardDescription>Only non-secret identifiers are shown. Credentials stay server-side.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {channels.map((channel) => (
                    <div key={channel.id} className="rounded-lg border border-[#e5e9e7] p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="text-sm font-medium text-[#111b21]">{channel.display_name || channel.channel_type}</div>
                          <div className="mt-1 text-xs text-[#667781]">{channel.phone_number || 'Phone pending'} · ID {channel.phone_number_id || 'pending'}</div>
                        </div>
                        <Badge variant={channel.status === 'connected' ? 'success' : channel.status === 'error' ? 'destructive' : 'outline'}>{channel.status}</Badge>
                      </div>
                      <div className="mt-3 text-xs text-[#667781]">{channel.is_primary ? 'Primary channel' : 'Secondary channel'} · verified {channel.last_verified_at || 'never'}</div>
                    </div>
                  ))}
                  {!channels.length ? (
                    <div className="rounded-lg border border-dashed border-[#d8dee4] p-5 text-sm text-[#667781]">No channels configured for this business.</div>
                  ) : null}
                </CardContent>
              </Card>

              <Card className="shadow-none">
                <CardHeader>
                  <CardTitle className="text-base">Operational Modules</CardTitle>
                  <CardDescription>Durable per-business switches with actor and timestamp metadata.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {moduleError ? <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{moduleError}</div> : null}
                  {moduleDefinitions.map((module) => {
                    const state = moduleStates?.[module.id];
                    const enabled = state?.enabled ?? module.defaultEnabled;
                    const Icon = iconByModule[module.id];
                    return (
                      <div key={module.id} className="flex items-start justify-between gap-3 rounded-lg border border-[#e5e9e7] p-4">
                        <div className="flex gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#edf8f4] text-[#075e54]">
                            <Icon className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-[#111b21]">{module.label}</div>
                            <div className="mt-1 text-xs leading-5 text-[#667781]">{module.description}</div>
                            <div className="mt-2 text-[11px] text-[#8696a0]">{module.contract}</div>
                          </div>
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          variant={enabled ? 'outline' : 'default'}
                          disabled={pendingModule === module.id}
                          onClick={() => toggleModule(module.id, !enabled)}
                          className="min-w-24"
                        >
                          {pendingModule === module.id ? 'Saving' : enabled ? 'Enabled' : 'Disabled'}
                        </Button>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </div>

            <Card className="shadow-none">
              <CardHeader>
                <CardTitle className="text-base">Membership Management</CardTitle>
                <CardDescription>Add users by Supabase user ID, change role, or deactivate access for this selected business.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                {memberError ? <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{memberError}</div> : null}
                <form onSubmit={addMember} className="grid gap-3 lg:grid-cols-[1fr_1fr_180px_auto]">
                  <Input name="user_id" placeholder="Supabase user UUID" required />
                  <Input name="display_name" placeholder="Display name" required />
                  <Select name="role" defaultValue="client">
                    <SelectTrigger>
                      <SelectValue placeholder="Role" />
                    </SelectTrigger>
                    <SelectContent>
                      {roleOptions.map((role) => <SelectItem key={role} value={role}>{role}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Button type="submit" disabled={pendingMember === 'new'}>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Add
                  </Button>
                </form>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>User ID</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {members.map((member) => (
                      <TableRow key={member.id}>
                        <TableCell className="font-medium">{member.display_name || 'Unnamed user'}</TableCell>
                        <TableCell className="max-w-[180px] truncate text-xs text-[#667781]">{member.user_id}</TableCell>
                        <TableCell>
                          <Select value={member.role} onValueChange={(role) => updateMember(member.id, { role })} disabled={pendingMember === member.id}>
                            <SelectTrigger className="h-9 w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {roleOptions.map((role) => <SelectItem key={role} value={role}>{role}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Badge variant={member.active ? 'success' : 'outline'}>
                            {member.active ? <CheckCircle2 className="mr-1 h-3 w-3" /> : <CircleOff className="mr-1 h-3 w-3" />}
                            {member.active ? 'active' : 'inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={pendingMember === member.id}
                            onClick={() => updateMember(member.id, { active: !member.active })}
                          >
                            {member.active ? 'Deactivate' : 'Activate'}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {!members.length ? (
                  <div className="flex items-center gap-2 rounded-lg border border-dashed border-[#d8dee4] p-5 text-sm text-[#667781]">
                    <Users className="h-4 w-4" />
                    No members are attached to this business yet.
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </>
        ) : null}
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-[#d8dee4] bg-white p-4">
      <div className="text-xs font-medium uppercase text-[#667781]">{label}</div>
      <div className="mt-2 text-2xl font-semibold text-[#111b21]">{value}</div>
    </div>
  );
}
