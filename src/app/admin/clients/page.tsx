import { Plus } from 'lucide-react';
import { requirePlatformRole } from '@/lib/auth/session';
import { loadAdminBusinesses } from '@/lib/admin-data';
import { AdminClientDirectory } from '@/components/admin/AdminClientDirectory';
import { AdminPageHeader, AdminSection } from '@/components/admin/AdminPrimitives';

export const dynamic = 'force-dynamic';

export default async function AdminClientsPage() {
  await requirePlatformRole(['admin', 'dev']);
  const businesses = await loadAdminBusinesses();

  return (
    <div className="mx-auto max-w-[1540px] space-y-6">
      <AdminPageHeader
        eyebrow="Client operations"
        title="Every business account, with the next action visible."
        description="Find a client, inspect their live workspace, update settings, or pause automated replies from one directory."
        action={
          <div className="flex items-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm font-semibold text-white backdrop-blur">
            <Plus className="h-4 w-4" />
            {businesses.length} client{businesses.length === 1 ? '' : 's'}
          </div>
        }
      />
      <AdminSection title="Client directory" description="Search by account, owner, city, or phone number.">
        <AdminClientDirectory businesses={businesses} />
      </AdminSection>
    </div>
  );
}
