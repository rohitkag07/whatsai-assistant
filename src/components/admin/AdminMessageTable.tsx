'use client';

import { useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, Search } from 'lucide-react';
import { AdminEmptyState, AdminStatusBadge, formatAdminDate, truncateAdminText } from '@/components/admin/AdminPrimitives';
import { Input } from '@/components/ui/input';
import type { AdminBusiness, AdminMessage } from '@/lib/admin-data';
import { cn } from '@/lib/utils';

export function AdminMessageTable({
  messages,
  businesses,
}: {
  messages: AdminMessage[];
  businesses: AdminBusiness[];
}) {
  const [query, setQuery] = useState('');
  const [businessId, setBusinessId] = useState('all');
  const [direction, setDirection] = useState('all');
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return messages.filter((message) => {
      if (businessId !== 'all' && message.business_id !== businessId) return false;
      if (direction !== 'all' && message.direction !== direction) return false;
      if (!needle) return true;
      return [
        message.business_name,
        message.contact_name,
        message.contact_phone,
        message.body,
        message.status,
      ].some((value) => value?.toLowerCase().includes(needle));
    });
  }, [businessId, direction, messages, query]);

  return (
    <div>
      <div className="grid gap-3 border-b border-[#e7ecea] bg-[#fbfdfc] p-4 md:grid-cols-[1fr_210px_160px]">
        <label className="relative">
          <span className="sr-only">Search messages</span>
          <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-[#86968f]" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search contact, phone, or message"
            className="h-10 border-[#d6dfdc] bg-white pl-9"
          />
        </label>
        <FilterSelect value={businessId} onChange={setBusinessId} label="Business">
          <option value="all">All clients</option>
          {businesses.map((business) => (
            <option key={business.id} value={business.id}>{business.name}</option>
          ))}
        </FilterSelect>
        <FilterSelect value={direction} onChange={setDirection} label="Direction">
          <option value="all">All directions</option>
          <option value="inbound">Inbound</option>
          <option value="outbound">Outbound</option>
        </FilterSelect>
      </div>

      {!filtered.length ? (
        <div className="p-5">
          <AdminEmptyState
            title="No messages match these filters"
            description="Clear the filters or wait for the next live WhatsApp event."
          />
        </div>
      ) : (
        <div className="divide-y divide-[#edf1ef]">
          {filtered.map((message) => {
            const isExpanded = expanded === message.id;
            return (
              <article key={message.id} className="bg-white">
                <button
                  type="button"
                  onClick={() => setExpanded(isExpanded ? null : message.id)}
                  className="grid min-h-[76px] w-full grid-cols-[auto_1fr_auto] items-center gap-3 px-4 py-3 text-left transition hover:bg-[#f6faf8] md:grid-cols-[24px_minmax(150px,0.7fr)_minmax(180px,0.9fr)_minmax(240px,1.4fr)_110px_150px]"
                >
                  {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-[#111b21]">{message.business_name}</p>
                    <p className="truncate text-xs text-[#667781] md:hidden">
                      {message.contact_name || message.contact_phone || 'Unknown contact'}
                    </p>
                  </div>
                  <div className="hidden min-w-0 md:block">
                    <p className="truncate text-sm text-[#23312d]">{message.contact_name || 'Unknown contact'}</p>
                    <p className="truncate text-xs text-[#667781]">{message.contact_phone || 'No phone'}</p>
                  </div>
                  <p className="hidden min-w-0 truncate text-sm text-[#52615c] md:block">
                    {truncateAdminText(message.body, 92)}
                  </p>
                  <div className="hidden md:block"><AdminStatusBadge status={message.direction} /></div>
                  <time className="whitespace-nowrap text-xs text-[#667781]">{formatAdminDate(message.created_at)}</time>
                </button>
                {isExpanded ? (
                  <div className="border-t border-[#edf1ef] bg-[#f8fbfa] px-5 py-5 md:pl-14">
                    <div className="grid gap-5 lg:grid-cols-[1.3fr_0.7fr]">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#008b73]">Message</p>
                        <p className={cn(
                          'mt-2 rounded-2xl p-4 text-sm leading-6 text-[#23312d]',
                          message.direction === 'outbound' ? 'bg-[#d9fdd3]' : 'border border-[#dce4e1] bg-white',
                        )}>
                          {message.body || 'No text content'}
                        </p>
                      </div>
                      <dl className="grid grid-cols-2 gap-3 text-xs">
                        <Meta label="Status" value={message.status} />
                        <Meta label="Type" value={message.message_type} />
                        <Meta label="Agent" value={message.agent || 'Not recorded'} />
                        <Meta label="Message ID" value={message.id} />
                      </dl>
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

function FilterSelect({
  value,
  onChange,
  label,
  children,
}: {
  value: string;
  onChange: (value: string) => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label>
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 w-full rounded-md border border-[#d6dfdc] bg-white px-3 text-sm text-[#23312d] outline-none focus:border-[#00a884] focus:ring-2 focus:ring-[#00a884]/15"
      >
        {children}
      </select>
    </label>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[#dce4e1] bg-white p-3">
      <dt className="text-[#86968f]">{label}</dt>
      <dd className="mt-1 break-all font-medium text-[#23312d]">{value}</dd>
    </div>
  );
}
