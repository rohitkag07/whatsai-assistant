import { onboardingEnabled } from "@/lib/onboarding/flags";
import { resolveFoundationFlags } from "@/lib/product-foundation-flags";
import { DashboardShell } from "@/components/shared/DashboardShell";
import { requirePlatformRole } from "@/lib/auth/session";
import { commandEnabled } from '@/lib/command/model';
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
  const commandOperations = commandEnabled(session, process.env);
  const foundationState = commandOperations
    ? { businesses: { status: 'disconnected' as const, data: null }, unread: { status: 'unknown' as const, data: null } }
    : flags.command
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
        commandOperations={commandOperations}
        foundationState={foundationState}
        designLab={flags.designLab}
        onboarding={onboardingEnabled(session, process.env)}
        platformRole={session.platformRole}
        activeBusinessId={session.activeBusinessId}
        businesses={businesses}
      >
        {children}
      </DashboardShell>
    </div>
  );
}
