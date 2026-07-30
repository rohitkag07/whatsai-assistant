'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Building2,
  Eye,
  Pause,
  Phone,
  Play,
  Plus,
  Search,
  Settings2,
} from 'lucide-react';
import { toast } from 'sonner';
import type { AdminBusiness } from '@/lib/admin-data';
import { AdminEmptyState, AdminStatusBadge } from '@/components/admin/AdminPrimitives';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const categories = [
  ['software_saas', 'Software / SaaS'],
  ['clinic', 'Clinic'],
  ['gym', 'Gym and wellness'],
  ['real_estate', 'Real estate'],
  ['coaching', 'Coaching and education'],
  ['local_service', 'Local service'],
  ['other', 'Other'],
] as const;

const plans = ['trial', 'starter', 'growth', 'pro', 'enterprise'] as const;

export function AdminClientDirectory({ businesses }: { businesses: AdminBusiness[] }) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [status, setStatus] = useState('all');
  const [addOpen, setAddOpen] = useState(false);
  const [pending, setPending] = useState<string | null>(null);
  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return businesses.filter((business) => {
      const searchable = [business.name, business.city, business.owner_name, business.owner_phone]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return (
        (!needle || searchable.includes(needle)) &&
        (category === 'all' || business.category === category) &&
        (status === 'all' || business.status === status)
      );
    });
  }, [businesses, category, search, status]);

  async function activateClient(businessId: string) {
    setPending(`inspect:${businessId}`);
    try {
      const response = await fetch('/api/admin/active-business', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ business_id: businessId }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.error || 'Client switch failed.');
      router.push('/dashboard');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Client switch failed.');
    } finally {
      setPending(null);
    }
  }

  async function togglePaused(business: AdminBusiness) {
    const paused = business.status !== 'paused';
    setPending(`status:${business.id}`);
    try {
      const response = await fetch('/api/admin/business/status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ business_id: business.id, paused }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.error || 'Client status update failed.');
      toast.success(paused ? `${business.name} paused` : `${business.name} resumed`);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Client status update failed.');
    } finally {
      setPending(null);
    }
  }

  return (
    <>
      <div className="border-b border-[#e7ecea] p-4 sm:p-5">
        <div className="grid gap-3 lg:grid-cols-[minmax(240px,1fr)_220px_180px_auto]">
          <label className="relative">
            <span className="sr-only">Search clients</span>
            <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-[#86968f]" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search business, owner, city, or phone"
              className="h-11 rounded-xl border-[#cfd8d5] pl-10"
            />
          </label>
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className="h-11 rounded-xl border border-[#cfd8d5] bg-white px-3 text-sm text-[#23312d] outline-none focus:border-[#00a884] focus:ring-2 focus:ring-[#00a884]/15"
          >
            <option value="all">All categories</option>
            {categories.map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="h-11 rounded-xl border border-[#cfd8d5] bg-white px-3 text-sm text-[#23312d] outline-none focus:border-[#00a884] focus:ring-2 focus:ring-[#00a884]/15"
          >
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="trial">Trial</option>
            <option value="paused">Paused</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <Button
            type="button"
            onClick={() => setAddOpen(true)}
            className="h-11 bg-[#075e54] text-white hover:bg-[#064e46]"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add New Client
          </Button>
        </div>
      </div>

      {filtered.length ? (
        <>
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
                {filtered.map((business) => (
                  <TableRow key={business.id} className="h-[76px] hover:bg-[#f7fbf9]">
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
                    <TableCell><AdminStatusBadge status={business.status} /></TableCell>
                    <TableCell className="pr-5">
                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={pending === `inspect:${business.id}`}
                          onClick={() => activateClient(business.id)}
                        >
                          <Eye className="mr-1.5 h-4 w-4" />
                          Inspect
                        </Button>
                        <Button asChild type="button" size="sm" variant="outline">
                          <Link href={`/admin/clients/${business.id}`}>
                            <Settings2 className="mr-1.5 h-4 w-4" />
                            Settings
                          </Link>
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          disabled={pending === `status:${business.id}`}
                          onClick={() => togglePaused(business)}
                          className="text-[#9a4b0f] hover:bg-amber-50 hover:text-[#8a3f08]"
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
            {filtered.map((business) => (
              <article key={business.id} className="rounded-2xl border border-[#dfe6e3] bg-white p-4 shadow-[0_8px_24px_rgba(17,27,33,0.04)]">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-[#111b21]">{business.name}</h3>
                    <p className="mt-1 text-xs capitalize text-[#667781]">
                      {business.category.replaceAll('_', ' ')} · {business.city || 'City not set'}
                    </p>
                  </div>
                  <AdminStatusBadge status={business.status} />
                </div>
                <p className="mt-4 flex items-center gap-2 text-sm text-[#44534e]">
                  <Phone className="h-4 w-4 text-[#00a884]" />
                  {business.whatsapp_phone || 'WhatsApp not connected'}
                </p>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => activateClient(business.id)}
                    className="bg-[#075e54] hover:bg-[#064e46]"
                  >
                    <Eye className="mr-1.5 h-4 w-4" /> Inspect
                  </Button>
                  <Button asChild type="button" size="sm" variant="outline">
                    <Link href={`/admin/clients/${business.id}`}>
                      <Settings2 className="mr-1.5 h-4 w-4" /> Settings
                    </Link>
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => togglePaused(business)}
                    className="col-span-2 text-[#9a4b0f]"
                  >
                    {business.status === 'paused' ? <Play className="mr-1.5 h-4 w-4" /> : <Pause className="mr-1.5 h-4 w-4" />}
                    {business.status === 'paused' ? 'Resume bot' : 'Pause bot'}
                  </Button>
                </div>
              </article>
            ))}
          </div>
        </>
      ) : (
        <div className="p-4 sm:p-5">
          <AdminEmptyState
            title={businesses.length ? 'No clients match these filters' : 'No clients yet'}
            description={businesses.length ? 'Clear a filter or search for another business.' : 'Create the first business account to connect a WhatsApp number and invite its owner.'}
            action={
              !businesses.length ? (
                <Button onClick={() => setAddOpen(true)} className="bg-[#075e54] hover:bg-[#064e46]">
                  <Plus className="mr-2 h-4 w-4" /> Add New Client
                </Button>
              ) : null
            }
          />
        </div>
      )}

      <AddClientDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        onCreated={() => {
          setAddOpen(false);
          router.refresh();
        }}
      />
    </>
  );
}

function AddClientDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}) {
  const [saving, setSaving] = useState(false);

  async function submit(formData: FormData) {
    setSaving(true);
    try {
      const response = await fetch('/api/admin/business/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(Object.fromEntries(formData.entries())),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.error || 'Client creation failed.');
      toast.success(`${payload.business.name} created`);
      onCreated();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Client creation failed.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto border-[#d8e1dd] sm:max-w-2xl sm:rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl text-[#111b21]">
            <Building2 className="h-5 w-5 text-[#075e54]" />
            Add New Client
          </DialogTitle>
          <DialogDescription>
            Create the business workspace first. WhatsApp credentials can be connected from the client detail page.
          </DialogDescription>
        </DialogHeader>
        <form action={submit} className="grid gap-4 sm:grid-cols-2">
          <Field label="Business Name" name="name" placeholder="Acme Dental Clinic" required className="sm:col-span-2" />
          <SelectField label="Category" name="category" options={categories} defaultValue="other" />
          <Field label="City" name="city" placeholder="Indore" required />
          <Field label="Owner Name" name="owner_name" placeholder="Dr. A. Sharma" required />
          <Field label="Owner Phone" name="owner_phone" placeholder="+91 98765 43210" required />
          <SelectField
            label="Plan"
            name="plan"
            options={plans.map((plan) => [plan, plan[0].toUpperCase() + plan.slice(1)] as const)}
            defaultValue="growth"
          />
          <DialogFooter className="mt-2 sm:col-span-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={saving} className="bg-[#075e54] hover:bg-[#064e46]">
              {saving ? 'Creating client…' : 'Create Client'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  name,
  className,
  ...props
}: React.ComponentProps<typeof Input> & { label: string; name: string }) {
  return (
    <label className={className}>
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} className="mt-2 h-11 rounded-xl border-[#cfd8d5]" {...props} />
    </label>
  );
}

function SelectField({
  label,
  name,
  options,
  defaultValue,
}: {
  label: string;
  name: string;
  options: ReadonlyArray<readonly [string, string]>;
  defaultValue: string;
}) {
  return (
    <label>
      <Label htmlFor={name}>{label}</Label>
      <select
        id={name}
        name={name}
        defaultValue={defaultValue}
        className="mt-2 h-11 w-full rounded-xl border border-[#cfd8d5] bg-white px-3 text-sm text-[#23312d] outline-none focus:border-[#00a884] focus:ring-2 focus:ring-[#00a884]/15"
      >
        {options.map(([value, optionLabel]) => (
          <option key={value} value={value}>{optionLabel}</option>
        ))}
      </select>
    </label>
  );
}
