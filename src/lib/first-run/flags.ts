import type { AuthSession } from "@/lib/auth/session";
import { resolveFoundationFlags } from "@/lib/product-foundation-flags";
import { isDashboardAuthBypassEnabled } from "@/lib/auth/dev-bypass";
export function firstRunEnabled(
  session: AuthSession,
  env: Record<string, string | undefined>,
) {
  return (
    env.XEROWA_FIRST_RUN_ENABLED === "1" &&
    resolveFoundationFlags(session, env).control
  );
}
export function syntheticFirstRun(
  session: AuthSession,
  env: Record<string, string | undefined>,
) {
  return (
    firstRunEnabled(session, env) &&
    isDashboardAuthBypassEnabled(env) &&
    env.XEROWA_FIRST_RUN_SYNTHETIC === "1" &&
    env.XEROWA_DESIGN_LAB_ENABLED === "1"
  );
}
export function ownerCanConfigure(session: AuthSession) {
  return session.memberships.some(
    (m) =>
      m.active &&
      m.business_id === session.activeBusinessId &&
      m.role === "owner",
  );
}
