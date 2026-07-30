import { ArrowDownToLine, CheckCircle2, Clock3, MessageSquare } from 'lucide-react';
import { AdminEmptyState, AdminPageHeader, AdminSection, AdminStatusBadge, formatAdminDate, truncateAdminText } from '@/components/admin/AdminPrimitives';
import { requirePlatformRole } from '@/lib/auth/session';
import { loadAdminWebhookEvents } from '@/lib/admin-data';

export const dynamic = 'force-dynamic';

export default async function AdminWebhooksPage() {
  await requirePlatformRole(['admin', 'dev']);
  const events = await loadAdminWebhookEvents();

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <AdminPageHeader eyebrow="WhatsApp ingress" title="Webhook log" description="A safe operational view of the latest inbound events that successfully reached canonical message persistence." />
      <AdminSection title="Latest inbound events" description="Each row proves the provider event reached its client, contact, and canonical message record.">
        {!events.length ? (
          <div className="p-5"><AdminEmptyState title="No inbound events recorded" description="The next verified WhatsApp message will appear here after canonical persistence succeeds." /></div>
        ) : (
          <div className="divide-y divide-[#edf1ef]">
            {events.map((event) => (
              <article key={event.id} className="grid min-h-[76px] gap-3 px-4 py-4 md:grid-cols-[42px_minmax(170px,0.8fr)_minmax(220px,1fr)_130px_155px] md:items-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e8f6f1] text-[#075e54]"><ArrowDownToLine className="h-4 w-4" /></div>
                <div className="min-w-0"><p className="truncate text-sm font-semibold text-[#111b21]">{event.business_name}</p><p className="truncate text-xs text-[#667781]">{event.contact_name || event.contact_phone || 'Unknown contact'}</p></div>
                <div className="min-w-0"><p className="truncate text-sm text-[#52615c]">{truncateAdminText(event.body, 80)}</p><p className="mt-1 flex items-center gap-1.5 text-xs text-[#86968f]"><MessageSquare className="h-3 w-3" />{event.message_type}</p></div>
                <div><AdminStatusBadge status={event.status || 'processed'} /></div>
                <time className="flex items-center gap-1.5 text-xs text-[#667781]"><Clock3 className="h-3.5 w-3.5" />{formatAdminDate(event.created_at)}</time>
              </article>
            ))}
            <div className="flex items-center gap-2 bg-[#f8fbfa] px-5 py-4 text-xs text-[#52615c]"><CheckCircle2 className="h-4 w-4 text-[#00a884]" />Showing canonical persisted events only. Invalid signatures never enter this feed.</div>
          </div>
        )}
      </AdminSection>
    </div>
  );
}
