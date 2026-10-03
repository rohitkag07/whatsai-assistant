import { SystemState } from '@/components/system/SystemState';
import { AdminMessageTable } from '@/components/admin/AdminMessageTable';
import { AdminPageHeader, AdminSection } from '@/components/admin/AdminPrimitives';
import { requirePlatformRole } from '@/lib/auth/session';
import { loadAdminBusinesses, loadAdminMessages } from '@/lib/admin-data';

export const dynamic = 'force-dynamic';

export default async function AdminConversationsPage() {
  await requirePlatformRole(['admin', 'dev']);
  const result = await Promise.all([loadAdminMessages(100), loadAdminBusinesses()]).catch(() => null);
  if (!result) return <div className="space-y-5"><AdminPageHeader eyebrow="Source unavailable" title="Conversation monitor" description="The source could not be read. No empty collection or successful read is assumed." /><SystemState kind="error" /></div>;
  const [messages, businesses] = result;
  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <AdminPageHeader eyebrow="Cross-client inbox" title="Conversation monitor" description="Inspect the latest canonical inbound and outbound messages across every client without exposing raw provider credentials." />
      <AdminSection title="Latest 100 messages" description="Filter by client or direction, then expand any event for operational detail."><AdminMessageTable messages={messages} businesses={businesses} /></AdminSection>
    </div>
  );
}
