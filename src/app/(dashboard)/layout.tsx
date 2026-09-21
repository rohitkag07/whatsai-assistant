import { resolveFoundationFlags } from "@/lib/product-foundation-flags";
import { controlEnabled } from '@/lib/control/flags';
import { DashboardShell } from "@/components/shared/DashboardShell";
import { requireBusinessAccess } from "@/lib/auth/session";
import {
  loadFoundationShellState,
  loadShellBusinesses,
  loadShellUnreadCount,
} from "@/lib/auth/shell-context";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireBusinessAccess();
  const flags = resolveFoundationFlags(session, process.env);
  const foundationState = flags.control
    ? await loadFoundationShellState(session)
    : undefined;
  const [businesses, unreadCount] = foundationState
    ? [foundationState.businesses.data ?? [], foundationState.unread.data ?? 0]
    : await Promise.all([
        loadShellBusinesses(session),
        loadShellUnreadCount(session),
      ]);
  return (
    <DashboardShell
      navMode="client"
      foundation={flags.control}
      foundationState={foundationState}
      designLab={flags.designLab}
      controlOperations={controlEnabled(session,process.env)}
      platformRole={session.platformRole}
      activeBusinessId={session.activeBusinessId}
      businesses={businesses}
      unreadCount={unreadCount}
    >
      {children}
    </DashboardShell>
  );
}
