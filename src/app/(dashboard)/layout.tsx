import { firstRunEnabled } from "@/lib/first-run/flags";
import { loadReadiness } from "@/lib/first-run/loader";
import type { ShellReadState } from "@/lib/auth/shell-types";
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
  const firstRun = firstRunEnabled(session,process.env);
  const readiness = firstRun ? await loadReadiness(session) : null;
  const scopedShell:ShellReadState|undefined = readiness ? {
    businesses:{status:'ready',data:session.activeBusinessId?[{id:session.activeBusinessId,name:readiness.businessName ?? 'Selected workspace · identity unavailable',category:'Business',status:'unverified'}]:[]},
    unread:{status:'unknown',data:null},
  } : undefined;
  const foundationState = scopedShell ?? (flags.control
    ? await loadFoundationShellState(session)
    : undefined);
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
      firstRun={firstRun}
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
