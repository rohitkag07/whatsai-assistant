import { AdminPageHeader } from '@/components/admin/AdminPrimitives';
import { CommandOsConsole } from '@/components/admin/CommandOsConsole';
import { requirePlatformRole } from '@/lib/auth/session';
import { loadCommandOsDashboard } from '@/lib/command-os-data';

export const dynamic = 'force-dynamic';

export default async function AdminCommandOsPage() {
  await requirePlatformRole(['admin', 'dev']);
  const dashboard = await loadCommandOsDashboard();

  return (
    <div className="mx-auto max-w-[1540px] space-y-6">
      <AdminPageHeader
        eyebrow="Supervised company operating system"
        title="XeroWA Command OS"
        description="A single-profile Hermes operating layer: founder briefs, Sentinel alerts, approvals, audit trail, and kill switches before any customer or production impact."
      />
      <CommandOsConsole dashboard={dashboard} />
    </div>
  );
}
