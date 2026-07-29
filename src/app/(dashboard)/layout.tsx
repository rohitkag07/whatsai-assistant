import { DashboardShell } from '@/components/shared/DashboardShell';
import { requireBusinessAccess } from '@/lib/auth/session';
import { loadShellBusinesses } from '@/lib/auth/shell-context';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await requireBusinessAccess();
  const businesses = await loadShellBusinesses(session);
  return (
    <DashboardShell
      navMode="client"
      platformRole={session.platformRole}
      activeBusinessId={session.activeBusinessId}
      businesses={businesses}
    >
      {children}
    </DashboardShell>
  );
}
