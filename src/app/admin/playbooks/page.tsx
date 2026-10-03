import { SystemState } from '@/components/system/SystemState';
import { AdminPageHeader, AdminSection } from '@/components/admin/AdminPrimitives';
import { AdminPlaybookManager } from '@/components/admin/AdminPlaybookManager';
import { requirePlatformRole } from '@/lib/auth/session';
import { loadAdminBusinesses, loadAdminPlaybooks } from '@/lib/admin-data';

export const dynamic = 'force-dynamic';

export default async function AdminPlaybooksPage() {
  await requirePlatformRole(['admin', 'dev']);
  const result = await Promise.all([loadAdminPlaybooks(), loadAdminBusinesses()]).catch(() => null);
  if (!result) return <div className="space-y-5"><AdminPageHeader eyebrow="Source unavailable" title="Playbook manager" description="The source could not be read. No empty collection or successful read is assumed." /><SystemState kind="error" /></div>;
  const [playbooks, businesses] = result;
  return <div className="mx-auto max-w-5xl space-y-5"><AdminPageHeader eyebrow="Deterministic automation" title="Playbook manager" description="Inspect keyword rules, handoff policy, qualification flow, and the active reply engine for every client." /><AdminSection title="Client playbooks" description="Activation changes are applied to the canonical assistant_playbooks contract."><AdminPlaybookManager initialPlaybooks={playbooks} businesses={businesses} /></AdminSection></div>;
}
