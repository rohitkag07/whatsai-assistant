'use client';

import { useMemo, useState } from 'react';
import { Braces, ChevronDown, ChevronUp, Search } from 'lucide-react';
import { toast } from 'sonner';
import { AdminEmptyState, AdminStatusBadge } from '@/components/admin/AdminPrimitives';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { AdminBusiness, AdminPlaybook } from '@/lib/admin-data';

export function AdminPlaybookManager({
  initialPlaybooks,
  businesses,
  lockedBusinessId,
}: {
  initialPlaybooks: AdminPlaybook[];
  businesses: AdminBusiness[];
  lockedBusinessId?: string;
}) {
  const [playbooks, setPlaybooks] = useState(initialPlaybooks);
  const [businessId, setBusinessId] = useState(lockedBusinessId || 'all');
  const [query, setQuery] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return playbooks.filter((playbook) => {
      if (businessId !== 'all' && playbook.business_id !== businessId) return false;
      return !needle || [playbook.name, playbook.business_name, playbook.vertical]
        .some((value) => value.toLowerCase().includes(needle));
    });
  }, [businessId, playbooks, query]);

  async function toggle(playbook: AdminPlaybook) {
    setSavingId(playbook.id);
    const response = await fetch(`/api/admin/playbooks/${playbook.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ business_id: playbook.business_id, is_active: !playbook.is_active }),
    });
    const payload = await response.json().catch(() => null);
    setSavingId(null);
    if (!response.ok) return toast.error(payload?.error || 'Could not update the playbook.');
    setPlaybooks((current) => current.map((row) => row.id === playbook.id ? { ...row, is_active: !row.is_active } : row));
    toast.success(playbook.is_active ? 'Playbook paused.' : 'Playbook activated.');
  }

  return (
    <div>
      <div className="grid gap-3 border-b border-[#e7ecea] bg-[#fbfdfc] p-4 md:grid-cols-[1fr_230px]">
        <label className="relative">
          <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-[#86968f]" />
          <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search playbook or vertical" className="h-10 bg-white pl-9" />
        </label>
        {!lockedBusinessId ? (
          <select value={businessId} onChange={(event) => setBusinessId(event.target.value)} className="h-10 rounded-md border border-[#d6dfdc] bg-white px-3 text-sm">
            <option value="all">All clients</option>
            {businesses.map((business) => <option key={business.id} value={business.id}>{business.name}</option>)}
          </select>
        ) : <div />}
      </div>
      {!filtered.length ? (
        <div className="p-5"><AdminEmptyState title="No playbooks configured" description="Complete the client setup wizard to create the first deterministic reply playbook." /></div>
      ) : (
        <div className="divide-y divide-[#edf1ef]">
          {filtered.map((playbook) => {
            const isExpanded = expanded === playbook.id;
            return (
              <article key={playbook.id} className="px-4 py-4 sm:px-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#edf8f4] text-[#075e54]"><Braces className="h-5 w-5" /></div>
                    <div className="min-w-0">
                      <h3 className="truncate font-semibold text-[#111b21]">{playbook.name}</h3>
                      <p className="mt-0.5 truncate text-xs text-[#667781]">{playbook.business_name} · {playbook.vertical.replaceAll('_', ' ')}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <AdminStatusBadge status={playbook.is_active ? 'active' : 'paused'} />
                    <span className="rounded-full bg-[#f0f3f2] px-2.5 py-1 text-xs text-[#52615c]">{playbook.keyword_replies.length} rules</span>
                    <Button variant="outline" size="sm" onClick={() => setExpanded(isExpanded ? null : playbook.id)}>{isExpanded ? <ChevronUp className="mr-1.5 h-4 w-4" /> : <ChevronDown className="mr-1.5 h-4 w-4" />}Inspect</Button>
                    <Button size="sm" variant={playbook.is_active ? 'outline' : 'default'} disabled={savingId === playbook.id} onClick={() => toggle(playbook)} className={!playbook.is_active ? 'bg-[#075e54] hover:bg-[#064e46]' : ''}>{savingId === playbook.id ? 'Saving...' : playbook.is_active ? 'Pause' : 'Activate'}</Button>
                  </div>
                </div>
                {isExpanded ? (
                  <div className="mt-4 grid gap-4 border-t border-[#edf1ef] pt-4 lg:grid-cols-2">
                    <JsonPanel label="Keyword rules" value={playbook.keyword_replies} />
                    <JsonPanel label="Handoff rules" value={playbook.handoff_rules} />
                    <JsonPanel label="Qualification questions" value={playbook.qualification_questions} />
                    <div className="rounded-xl border border-[#dce4e1] bg-[#fbfdfc] p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#008b73]">Fallback reply</p>
                      <p className="mt-3 text-sm leading-6 text-[#52615c]">{playbook.fallback_reply || 'No fallback reply configured.'}</p>
                    </div>
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

function JsonPanel({ label, value }: { label: string; value: unknown }) {
  return (
    <div className="min-w-0 rounded-xl border border-[#dce4e1] bg-[#111b21] p-4 text-white">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#91e5cf]">{label}</p>
      <pre className="mt-3 max-h-56 overflow-auto whitespace-pre-wrap break-words text-[11px] leading-5 text-[#d2e8e2]">{JSON.stringify(value, null, 2)}</pre>
    </div>
  );
}
