'use client';

import { useState } from 'react';
import { Activity, Bot, CalendarDays, CheckCircle2, MessageSquare, Phone, RefreshCw, Save, Users } from 'lucide-react';
import { toast } from 'sonner';
import { ADMIN_MODULES, type AdminModuleId } from '@/lib/admin-modules';
import type { AdminBusiness, AdminClientDetail as ClientDetail } from '@/lib/admin-data';
import { AdminKnowledgeManager } from '@/components/admin/AdminKnowledgeManager';
import { AdminPlaybookManager } from '@/components/admin/AdminPlaybookManager';
import { AdminStatusBadge, formatAdminDate } from '@/components/admin/AdminPrimitives';
import { AdminTeamManager } from '@/components/admin/AdminTeamManager';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

export function AdminClientDetail({ detail }: { detail: ClientDetail }) {
  const [business, setBusiness] = useState(detail.business);
  const [form, setForm] = useState({
    name: detail.business.name,
    category: detail.business.category,
    city: detail.business.city || '',
    owner_name: detail.business.owner_name || '',
    owner_phone: detail.business.owner_phone || '',
    plan: detail.business.plan,
  });
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [moduleStates, setModuleStates] = useState(detail.moduleStates);
  const businesses: AdminBusiness[] = [business];

  async function saveOverview() {
    setSaving(true);
    const response = await fetch(`/api/admin/business/${business.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, city: form.city || null, owner_name: form.owner_name || null, owner_phone: form.owner_phone || null }),
    });
    const payload = await response.json().catch(() => null);
    setSaving(false);
    if (!response.ok) return toast.error(payload?.error || 'Could not update the client.');
    setBusiness((current) => ({ ...current, ...payload.business }));
    toast.success('Client profile updated.');
  }

  async function testChannel() {
    setTesting(true);
    const response = await fetch(`/api/admin/business/${business.id}/channel-test`, { method: 'POST' });
    const payload = await response.json().catch(() => null);
    setTesting(false);
    if (!response.ok) return toast.error(payload?.error || 'WhatsApp connection test failed.');
    toast.success(`Connected to ${payload.profile?.verified_name || 'Meta WhatsApp'}.`);
  }

  async function toggleModule(moduleId: AdminModuleId) {
    const next = !moduleStates[moduleId].enabled;
    const response = await fetch('/api/admin/business/modules', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ business_id: business.id, module_id: moduleId, enabled: next }),
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok) return toast.error(payload?.error || 'Could not update this module.');
    setModuleStates((current) => ({ ...current, [moduleId]: { enabled: next, updated_at: payload.updated_at, updated_by: null } }));
    toast.success(next ? 'Module enabled.' : 'Module paused.');
  }

  return (
    <Tabs defaultValue="overview" className="space-y-4">
      <div className="overflow-x-auto rounded-2xl border border-[#d8e1dd] bg-white p-2">
        <TabsList className="h-auto min-w-max justify-start bg-transparent">
          {['overview', 'channels', 'knowledge', 'playbook', 'team', 'modules'].map((tab) => (
            <TabsTrigger key={tab} value={tab} className="capitalize data-[state=active]:bg-[#e4f5ef] data-[state=active]:text-[#075e54]">{tab}</TabsTrigger>
          ))}
        </TabsList>
      </div>

      <TabsContent value="overview" className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <CountCard label="Contacts" value={detail.counts.contacts} icon={Users} />
          <CountCard label="Threads" value={detail.counts.threads} icon={MessageSquare} />
          <CountCard label="Messages" value={detail.counts.messages} icon={Activity} />
          <CountCard label="Appointments" value={detail.counts.appointments} icon={CalendarDays} />
          <CountCard label="Open handoffs" value={detail.counts.handoffs} icon={Bot} />
        </div>
        <Panel title="Client profile" description="Canonical business identity used across every admin workspace.">
          <div className="grid gap-4 p-5 sm:grid-cols-2">
            <Field label="Business name" value={form.name} onChange={(value) => setForm({ ...form, name: value })} />
            <SelectField label="Category" value={form.category} onChange={(value) => setForm({ ...form, category: value })}>
              {['real_estate', 'clinic', 'coaching', 'gym', 'local_service', 'software_saas', 'other'].map((value) => <option key={value} value={value}>{value.replaceAll('_', ' ')}</option>)}
            </SelectField>
            <Field label="City" value={form.city} onChange={(value) => setForm({ ...form, city: value })} />
            <Field label="Owner name" value={form.owner_name} onChange={(value) => setForm({ ...form, owner_name: value })} />
            <Field label="Owner phone" value={form.owner_phone} onChange={(value) => setForm({ ...form, owner_phone: value })} />
            <SelectField label="Plan" value={form.plan} onChange={(value) => setForm({ ...form, plan: value })}>{['trial', 'starter', 'growth', 'pro', 'enterprise'].map((value) => <option key={value} value={value}>{value}</option>)}</SelectField>
          </div>
          <div className="flex justify-end border-t border-[#e7ecea] p-4"><Button onClick={saveOverview} disabled={saving} className="bg-[#075e54] hover:bg-[#064e46]"><Save className="mr-2 h-4 w-4" />{saving ? 'Saving...' : 'Save profile'}</Button></div>
        </Panel>
      </TabsContent>

      <TabsContent value="channels">
        <Panel title="WhatsApp channels" description="Live Meta channel mapping. Tokens remain server-side and are never shown here.">
          {!detail.channels.length ? (
            <div className="p-8 text-center text-sm text-[#667781]">No channel is mapped to this client yet.</div>
          ) : (
            <div className="divide-y divide-[#edf1ef]">
              {detail.channels.map((channel) => (
                <article key={channel.id} className="grid min-h-[88px] gap-3 p-5 md:grid-cols-[1fr_1fr_auto] md:items-center">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#e4f5ef] text-[#075e54]"><Phone className="h-5 w-5" /></div>
                    <div><p className="font-semibold text-[#111b21]">{channel.display_name || 'WhatsApp Business'}</p><p className="text-xs text-[#667781]">{channel.phone_number || 'Phone not recorded'}</p></div>
                  </div>
                  <div><AdminStatusBadge status={channel.status} /><p className="mt-1 text-xs text-[#667781]">{channel.last_verified_at ? `Verified ${formatAdminDate(channel.last_verified_at)}` : 'Not verified yet'}</p></div>
                  {channel.is_primary ? <Button onClick={testChannel} disabled={testing} variant="outline"><RefreshCw className={cn('mr-2 h-4 w-4', testing && 'animate-spin')} />{testing ? 'Testing...' : 'Test connection'}</Button> : null}
                </article>
              ))}
            </div>
          )}
        </Panel>
      </TabsContent>

      <TabsContent value="knowledge"><Panel title="Approved replies" description="Exact client-approved facts and responses."><AdminKnowledgeManager initialItems={detail.knowledge} businesses={businesses} lockedBusinessId={business.id} /></Panel></TabsContent>
      <TabsContent value="playbook"><Panel title="Assistant playbook" description="Inspect deterministic rules and control the active playbook."><AdminPlaybookManager initialPlaybooks={detail.playbooks} businesses={businesses} lockedBusinessId={business.id} /></Panel></TabsContent>
      <TabsContent value="team"><Panel title="Client access" description="Invite owners and operators, then assign precise roles."><AdminTeamManager initialMembers={detail.members} businesses={businesses} lockedBusinessId={business.id} /></Panel></TabsContent>
      <TabsContent value="modules">
        <Panel title="Runtime modules" description="Only controls with a verified runtime contract are switchable.">
          <div className="grid gap-3 p-4 lg:grid-cols-2">
            {ADMIN_MODULES.map((module) => {
              const runtime = module.enforcement === 'runtime';
              const enabled = moduleStates[module.id].enabled;
              return (
                <article key={module.id} className="rounded-2xl border border-[#dbe3e0] bg-white p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div><h3 className="font-semibold text-[#111b21]">{module.label}</h3><p className="mt-1 text-xs leading-5 text-[#667781]">{module.description}</p></div>
                    {runtime ? (
                      <button type="button" role="switch" aria-checked={enabled} onClick={() => toggleModule(module.id)} className={cn('relative h-7 w-12 shrink-0 rounded-full transition', enabled ? 'bg-[#00a884]' : 'bg-[#c7d0cd]')}>
                        <span className={cn('absolute top-1 h-5 w-5 rounded-full bg-white shadow transition', enabled ? 'left-6' : 'left-1')} />
                      </button>
                    ) : <AdminStatusBadge status="configuration only" />}
                  </div>
                  <div className="mt-4 flex items-center gap-2 border-t border-[#edf1ef] pt-3 text-xs text-[#667781]"><CheckCircle2 className="h-3.5 w-3.5 text-[#00a884]" />{module.contract}</div>
                </article>
              );
            })}
          </div>
        </Panel>
      </TabsContent>
    </Tabs>
  );
}

function Panel({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return <section className="overflow-hidden rounded-2xl border border-[#d8e1dd] bg-white shadow-[0_12px_35px_rgba(17,27,33,0.04)]"><header className="border-b border-[#e7ecea] px-5 py-5"><h2 className="text-lg font-semibold tracking-[-0.02em]">{title}</h2><p className="mt-1 text-sm text-[#667781]">{description}</p></header>{children}</section>;
}

function CountCard({ label, value, icon: Icon }: { label: string; value: number; icon: typeof Users }) {
  return <div className="rounded-2xl border border-[#d8e1dd] bg-white p-4"><div className="flex items-center justify-between"><p className="text-xs font-medium text-[#667781]">{label}</p><Icon className="h-4 w-4 text-[#00a884]" /></div><p className="mt-3 text-2xl font-semibold tracking-[-0.04em]">{value}</p></div>;
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label className="grid gap-1.5 text-sm font-medium">{label}<Input value={value} onChange={(event) => onChange(event.target.value)} /></label>;
}

function SelectField({ label, value, onChange, children }: { label: string; value: string; onChange: (value: string) => void; children: React.ReactNode }) {
  return <label className="grid gap-1.5 text-sm font-medium">{label}<select value={value} onChange={(event) => onChange(event.target.value)} className="h-10 rounded-md border border-[#d6dfdc] bg-white px-3 text-sm capitalize">{children}</select></label>;
}
