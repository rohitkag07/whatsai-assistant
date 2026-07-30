import '@fontsource-variable/outfit';
import { DashboardShell } from '@/components/shared/DashboardShell';
import { requirePlatformRole } from '@/lib/auth/session';
import { loadShellBusinesses } from '@/lib/auth/shell-context';

export const metadata = { title: 'XeroWA Admin' };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requirePlatformRole(['admin', 'dev']);
  const businesses = await loadShellBusinesses(session);
  return (
    <div className="font-admin">
      <DashboardShell
        navMode="admin"
        platformRole={session.platformRole}
        activeBusinessId={session.activeBusinessId}
        businesses={businesses}
      >
        {children}
      </DashboardShell>
    </div>
  );
}
