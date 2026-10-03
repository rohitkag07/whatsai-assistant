import { SystemState } from '@/components/system/SystemState';
import { AdminPageHeader, AdminSection } from '@/components/admin/AdminPrimitives';
import { AdminTeamManager } from '@/components/admin/AdminTeamManager';
import { requirePlatformRole } from '@/lib/auth/session';
import { loadAdminBusinesses, loadAdminTeam } from '@/lib/admin-data';

export const dynamic = 'force-dynamic';

export default async function AdminTeamPage() {
  await requirePlatformRole(['admin', 'dev']);
  const result = await Promise.all([loadAdminTeam(), loadAdminBusinesses()]).catch(() => null);
  if (!result) return <div className="space-y-5"><AdminPageHeader eyebrow="Source unavailable" title="Team and access" description="The source could not be read. No empty collection or successful read is assumed." /><SystemState kind="error" /></div>;
  const [members, businesses] = result;
  return <div className="mx-auto max-w-5xl space-y-5"><AdminPageHeader eyebrow="Role-based access" title="Team and access" description="Invite platform operators and client teams, then manage their role and active access from one secure directory." /><AdminSection title="Access directory" description={`${members.length} memberships across ${businesses.length} clients.`}><AdminTeamManager initialMembers={members} businesses={businesses} /></AdminSection></div>;
}
