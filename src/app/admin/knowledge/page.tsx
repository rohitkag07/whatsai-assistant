import { AdminKnowledgeManager } from '@/components/admin/AdminKnowledgeManager';
import { AdminPageHeader, AdminSection } from '@/components/admin/AdminPrimitives';
import { requirePlatformRole } from '@/lib/auth/session';
import { loadAdminBusinesses, loadAdminKnowledge } from '@/lib/admin-data';

export const dynamic = 'force-dynamic';

export default async function AdminKnowledgePage() {
  await requirePlatformRole(['admin', 'dev']);
  const [items, businesses] = await Promise.all([loadAdminKnowledge(), loadAdminBusinesses()]);
  return <div className="mx-auto max-w-5xl space-y-5"><AdminPageHeader eyebrow="Controlled business facts" title="Knowledge editor" description="Create and maintain exact, tenant-scoped answers the deterministic assistant is allowed to send." /><AdminSection title="Approved reply library" description={`${items.length} entries across ${businesses.length} clients.`}><AdminKnowledgeManager initialItems={items} businesses={businesses} /></AdminSection></div>;
}
