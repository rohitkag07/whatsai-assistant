'use client';

import { useMemo, useState } from 'react';
import { MailPlus, Search, UserRound } from 'lucide-react';
import { toast } from 'sonner';
import { AdminEmptyState, AdminStatusBadge } from '@/components/admin/AdminPrimitives';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import type { AdminBusiness, AdminTeamMember } from '@/lib/admin-data';

export function AdminTeamManager({
  initialMembers,
  businesses,
  lockedBusinessId,
}: {
  initialMembers: AdminTeamMember[];
  businesses: AdminBusiness[];
  lockedBusinessId?: string;
}) {
  const [members, setMembers] = useState(initialMembers);
  const [query, setQuery] = useState('');
  const [businessId, setBusinessId] = useState(lockedBusinessId || 'all');
  const [inviteOpen, setInviteOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [invite, setInvite] = useState({
    business_id: lockedBusinessId || businesses[0]?.id || '',
    email: '',
    display_name: '',
    role: 'client',
  });

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return members.filter((member) => {
      if (businessId !== 'all' && member.business_id !== businessId) return false;
      return !needle || [member.display_name, member.email, member.business_name, member.role]
        .some((value) => value?.toLowerCase().includes(needle));
    });
  }, [businessId, members, query]);

  async function submitInvite() {
    if (saving) return;
    setSaving(true);
    try {
      const response = await fetch('/api/admin/business/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invite),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.error || 'Could not invite this member.');
      const business = businesses.find((item) => item.id === invite.business_id);
      setMembers((current) => [{
        ...payload.member,
        business_id: invite.business_id,
        business_name: business?.name || 'Unknown business',
        email: invite.email,
      }, ...current.filter((member) => member.id !== payload.member.id)]);
      setInviteOpen(false);
      setInvite((current) => ({ ...current, email: '', display_name: '', role: 'client' }));
      toast.success('Team member invited and access assigned.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not invite this member.');
    } finally {
      setSaving(false);
    }
  }

  async function updateMember(member: AdminTeamMember, update: { role?: string; active?: boolean }) {
    const response = await fetch('/api/admin/business/members', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ business_id: member.business_id, member_id: member.id, ...update }),
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok) return toast.error(payload?.error || 'Could not update member access.');
    setMembers((current) => current.map((row) => row.id === member.id ? { ...row, ...update } : row));
    toast.success('Team access updated.');
  }

  return (
    <>
      <div className="grid gap-3 border-b border-[#e7ecea] bg-[#fbfdfc] p-4 md:grid-cols-[1fr_230px_auto]">
        <label className="relative">
          <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-[#86968f]" />
          <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search team member or email" className="h-10 bg-white pl-9" />
        </label>
        {!lockedBusinessId ? (
          <select value={businessId} onChange={(event) => setBusinessId(event.target.value)} className="h-10 rounded-md border border-[#d6dfdc] bg-white px-3 text-sm">
            <option value="all">All clients</option>
            {businesses.map((business) => <option key={business.id} value={business.id}>{business.name}</option>)}
          </select>
        ) : <div />}
        <Button onClick={() => setInviteOpen(true)} className="bg-[#075e54] hover:bg-[#064e46]"><MailPlus className="mr-2 h-4 w-4" />Invite member</Button>
      </div>
      {!filtered.length ? (
        <div className="p-5"><AdminEmptyState title="No team members found" description="Invite an owner, manager, or agent and assign their client access." /></div>
      ) : (
        <div className="divide-y divide-[#edf1ef]">
          {filtered.map((member) => (
            <article key={member.id} className="grid min-h-[76px] gap-3 px-4 py-4 md:grid-cols-[1fr_1fr_180px_110px] md:items-center">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#e8f6f1] text-[#075e54]"><UserRound className="h-4 w-4" /></div>
                <div className="min-w-0"><p className="truncate text-sm font-semibold text-[#111b21]">{member.display_name || 'Unnamed member'}</p><p className="truncate text-xs text-[#667781]">{member.email}</p></div>
              </div>
              <p className="truncate text-sm text-[#52615c]">{member.business_name}</p>
              <select value={member.role} onChange={(event) => updateMember(member, { role: event.target.value })} className="h-9 rounded-lg border border-[#d6dfdc] bg-white px-2.5 text-sm capitalize">
                {['owner', 'manager', 'agent', 'client', 'admin', 'dev'].map((role) => <option key={role} value={role}>{role}</option>)}
              </select>
              <button type="button" onClick={() => updateMember(member, { active: !member.active })} className="justify-self-start md:justify-self-end"><AdminStatusBadge status={member.active ? 'active' : 'disabled'} /></button>
            </article>
          ))}
        </div>
      )}

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Invite a team member</DialogTitle>
            <DialogDescription>
              Create or reuse the user account, then assign tenant-scoped access for this client.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            {!lockedBusinessId ? <FieldSelect label="Client" value={invite.business_id} onChange={(value) => setInvite({ ...invite, business_id: value })}>{businesses.map((business) => <option key={business.id} value={business.id}>{business.name}</option>)}</FieldSelect> : null}
            <FieldInput label="Email address" value={invite.email} onChange={(value) => setInvite({ ...invite, email: value })} placeholder="owner@business.com" />
            <FieldInput label="Display name" value={invite.display_name} onChange={(value) => setInvite({ ...invite, display_name: value })} placeholder="Business owner" />
            <FieldSelect label="Role" value={invite.role} onChange={(value) => setInvite({ ...invite, role: value })}>{['owner', 'manager', 'agent', 'client', 'admin', 'dev'].map((role) => <option key={role} value={role}>{role}</option>)}</FieldSelect>
            <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setInviteOpen(false)}>Cancel</Button><Button onClick={submitInvite} disabled={saving} className="bg-[#075e54] hover:bg-[#064e46]">{saving ? 'Inviting...' : 'Send invite'}</Button></div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function FieldInput({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string }) {
  return <label className="grid gap-1.5 text-sm font-medium">{label}<Input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} /></label>;
}

function FieldSelect({ label, value, onChange, children }: { label: string; value: string; onChange: (value: string) => void; children: React.ReactNode }) {
  return <label className="grid gap-1.5 text-sm font-medium">{label}<select value={value} onChange={(event) => onChange(event.target.value)} className="h-10 rounded-md border border-[#d6dfdc] bg-white px-3 text-sm capitalize">{children}</select></label>;
}
