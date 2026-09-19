import { resolveFoundationFlags } from "@/lib/product-foundation-flags";
import { DashboardShell } from "@/components/shared/DashboardShell";
import { requirePlatformRole } from "@/lib/auth/session";
import {
  loadFoundationShellState,
  loadShellBusinesses,
} from "@/lib/auth/shell-context";

export const metadata = { title: "XeroWA Admin" };

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requirePlatformRole(["admin", "dev"]);
  const flags = resolveFoundationFlags(session, process.env);
  const foundationState = flags.command
    ? await loadFoundationShellState(session)
    : undefined;
  const businesses = foundationState
    ? (foundationState.businesses.data ?? [])
    : await loadShellBusinesses(session);
  return (
    <div className="font-admin">
      <DashboardShell
        navMode="admin"
        foundation={flags.command}
        foundationState={foundationState}
        designLab={flags.designLab}
        platformRole={session.platformRole}
        activeBusinessId={session.activeBusinessId}
        businesses={businesses}
      >
        {children}
      </DashboardShell>
    </div>
  );
}
