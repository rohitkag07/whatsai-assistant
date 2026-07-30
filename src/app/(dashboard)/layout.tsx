import { DashboardShell } from '@/components/shared/DashboardShell';
import { requireBusinessAccess } from '@/lib/auth/session';
import { loadShellBusinesses, loadShellUnreadCount } from '@/lib/auth/shell-context';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await requireBusinessAccess();
  const [businesses, unreadCount] = await Promise.all([
    loadShellBusinesses(session),
    loadShellUnreadCount(session),
  ]);
  return (
    <DashboardShell
      navMode="client"
      platformRole={session.platformRole}
      activeBusinessId={session.activeBusinessId}
      businesses={businesses}
      unreadCount={unreadCount}
    >
      {children}
    </DashboardShell>
  );
}
