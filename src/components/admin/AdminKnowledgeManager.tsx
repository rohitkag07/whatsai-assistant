'use client';

import { useMemo, useState } from 'react';
import { BookOpen, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { AdminEmptyState, AdminStatusBadge } from '@/components/admin/AdminPrimitives';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { AdminBusiness, AdminKnowledgeItem } from '@/lib/admin-data';

type FormValue = {
  id?: string;
  business_id: string;
  title: string;
  type: AdminKnowledgeItem['type'];
  question: string;
  content: string;
  keywords: string;
  locale: string;
  status: string;
};

const blank = (businessId: string): FormValue => ({
  business_id: businessId,
  title: '',
  type: 'faq',
  question: '',
  content: '',
  keywords: '',
  locale: 'hinglish',
  status: 'draft',
});

export function AdminKnowledgeManager({
  initialItems,
  businesses,
  lockedBusinessId,
}: {
  initialItems: AdminKnowledgeItem[];
  businesses: AdminBusiness[];
  lockedBusinessId?: string;
}) {
  const [items, setItems] = useState(initialItems);
  const [query, setQuery] = useState('');
  const [businessId, setBusinessId] = useState(lockedBusinessId || 'all');
  const [editing, setEditing] = useState<FormValue | null>(null);
  const [saving, setSaving] = useState(false);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return items.filter((item) => {
      if (businessId !== 'all' && item.business_id !== businessId) return false;
      if (!needle) return true;
      return [item.title, item.question, item.content, item.keywords.join(' ')]
        .some((value) => value?.toLowerCase().includes(needle));
    });
  }, [businessId, items, query]);

  function openNew() {
    const selected = lockedBusinessId || (businessId !== 'all' ? businessId : businesses[0]?.id);
    if (!selected) return toast.error('Add a client before creating knowledge.');
    setEditing(blank(selected));
  }

  function openEdit(item: AdminKnowledgeItem) {
    setEditing({
      id: item.id,
      business_id: item.business_id,
      title: item.title,
      type: item.type,
      question: item.question || '',
      content: item.content,
      keywords: item.keywords.join(', '),
      locale: item.locale,
      status: item.status,
    });
  }

  async function save() {
    if (!editing || saving) return;
    setSaving(true);
    try {
      const response = await fetch(
        editing.id ? `/api/admin/knowledge/${editing.id}` : '/api/admin/knowledge',
        {
          method: editing.id ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...editing,
            question: editing.question || null,
            keywords: editing.keywords.split(',').map((keyword) => keyword.trim()).filter(Boolean),
          }),
        },
      );
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.error || 'Could not save this answer.');
      const item = { ...payload.item, business_name: businesses.find((business) => business.id === editing.business_id)?.name || 'Unknown business' } as AdminKnowledgeItem;
      setItems((current) => editing.id ? current.map((row) => row.id === item.id ? item : row) : [item, ...current]);
      setEditing(null);
      toast.success(editing.id ? 'Approved reply updated.' : 'Approved reply created.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not save this answer.');
    } finally {
      setSaving(false);
    }
  }

  async function remove(item: AdminKnowledgeItem) {
    if (!window.confirm(`Delete "${item.title}"? This cannot be undone.`)) return;
    const response = await fetch(`/api/admin/knowledge/${item.id}?business_id=${item.business_id}`, { method: 'DELETE' });
    const payload = await response.json().catch(() => null);
    if (!response.ok) return toast.error(payload?.error || 'Could not delete this answer.');
    setItems((current) => current.filter((row) => row.id !== item.id));
    toast.success('Approved reply deleted.');
  }

  return (
    <>
      <div className="grid gap-3 border-b border-[#e7ecea] bg-[#fbfdfc] p-4 md:grid-cols-[1fr_230px_auto]">
        <label className="relative">
          <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-[#86968f]" />
          <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search title, keyword, or answer" className="h-10 bg-white pl-9" />
        </label>
        {!lockedBusinessId ? (
          <select value={businessId} onChange={(event) => setBusinessId(event.target.value)} className="h-10 rounded-md border border-[#d6dfdc] bg-white px-3 text-sm">
            <option value="all">All clients</option>
            {businesses.map((business) => <option key={business.id} value={business.id}>{business.name}</option>)}
          </select>
        ) : <div />}
        <Button onClick={openNew} className="bg-[#075e54] hover:bg-[#064e46]"><Plus className="mr-2 h-4 w-4" />Add answer</Button>
      </div>
      {!filtered.length ? (
        <div className="p-5"><AdminEmptyState title="No approved replies yet" description="Add the exact answers this client is allowed to send on WhatsApp." action={<Button onClick={openNew}>Add first answer</Button>} /></div>
      ) : (
        <div className="grid gap-3 p-4 lg:grid-cols-2">
          {filtered.map((item) => (
            <article key={item.id} className="rounded-2xl border border-[#dbe3e0] bg-white p-4 transition hover:border-[#9fd4c6]">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#e8f6f1] text-[#075e54]"><BookOpen className="h-4 w-4" /></div>
                  <div className="min-w-0">
                    <h3 className="truncate font-semibold text-[#111b21]">{item.title}</h3>
                    <p className="mt-0.5 truncate text-xs text-[#667781]">{item.business_name}</p>
                  </div>
                </div>
                <AdminStatusBadge status={item.status} />
              </div>
              <p className="mt-4 line-clamp-3 min-h-[60px] text-sm leading-5 text-[#52615c]">{item.content}</p>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {item.keywords.slice(0, 6).map((keyword) => <span key={keyword} className="rounded-full bg-[#edf3f1] px-2 py-1 text-[11px] font-medium text-[#52615c]">{keyword}</span>)}
              </div>
              <div className="mt-4 flex justify-end gap-2 border-t border-[#edf1ef] pt-3">
                <Button variant="ghost" size="sm" onClick={() => openEdit(item)}><Pencil className="mr-1.5 h-3.5 w-3.5" />Edit</Button>
                <Button variant="ghost" size="sm" onClick={() => remove(item)} className="text-red-600 hover:bg-red-50 hover:text-red-700"><Trash2 className="mr-1.5 h-3.5 w-3.5" />Delete</Button>
              </div>
            </article>
          ))}
        </div>
      )}

      <Dialog open={Boolean(editing)} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing?.id ? 'Edit approved reply' : 'Add approved reply'}</DialogTitle>
            <DialogDescription>
              Save the exact client-approved answer, its matching keywords, language, and publishing status.
            </DialogDescription>
          </DialogHeader>
          {editing ? (
            <div className="grid gap-4">
              {!lockedBusinessId ? <FormSelect label="Client" value={editing.business_id} onChange={(value) => setEditing({ ...editing, business_id: value })}>{businesses.map((business) => <option key={business.id} value={business.id}>{business.name}</option>)}</FormSelect> : null}
              <div className="grid gap-4 sm:grid-cols-2">
                <FormInput label="Title" value={editing.title} onChange={(value) => setEditing({ ...editing, title: value })} placeholder="Consultation fee" />
                <FormSelect label="Type" value={editing.type} onChange={(value) => setEditing({ ...editing, type: value as AdminKnowledgeItem['type'] })}>
                  {['faq', 'service', 'pricing', 'policy', 'location', 'offer', 'document', 'other'].map((value) => <option key={value} value={value}>{value.replaceAll('_', ' ')}</option>)}
                </FormSelect>
              </div>
              <FormInput label="Customer question" value={editing.question} onChange={(value) => setEditing({ ...editing, question: value })} placeholder="How much is the consultation?" />
              <label className="grid gap-1.5 text-sm font-medium text-[#23312d]">Exact approved reply<Textarea value={editing.content} onChange={(event) => setEditing({ ...editing, content: event.target.value })} rows={5} placeholder="Enter the exact response the assistant may send." /></label>
              <FormInput label="Keywords, separated by commas" value={editing.keywords} onChange={(value) => setEditing({ ...editing, keywords: value })} placeholder="fees, cost, kitna, charges" />
              <div className="grid gap-4 sm:grid-cols-2">
                <FormSelect label="Language" value={editing.locale} onChange={(value) => setEditing({ ...editing, locale: value })}><option value="hinglish">Hinglish</option><option value="en-IN">English India</option><option value="hi-IN">Hindi India</option></FormSelect>
                <FormSelect label="Status" value={editing.status} onChange={(value) => setEditing({ ...editing, status: value })}><option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option></FormSelect>
              </div>
              <div className="flex justify-end gap-2 pt-2"><Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button><Button onClick={save} disabled={saving} className="bg-[#075e54] hover:bg-[#064e46]">{saving ? 'Saving...' : 'Save answer'}</Button></div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}

function FormInput({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string }) {
  return <label className="grid gap-1.5 text-sm font-medium text-[#23312d]">{label}<Input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} /></label>;
}

function FormSelect({ label, value, onChange, children }: { label: string; value: string; onChange: (value: string) => void; children: React.ReactNode }) {
  return <label className="grid gap-1.5 text-sm font-medium text-[#23312d]">{label}<select value={value} onChange={(event) => onChange(event.target.value)} className="h-10 rounded-md border border-[#d6dfdc] bg-white px-3 text-sm capitalize">{children}</select></label>;
}
