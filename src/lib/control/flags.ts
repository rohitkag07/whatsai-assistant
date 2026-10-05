import {
  resolveFoundationFlags,
  type FoundationContext,
} from "@/lib/product-foundation-flags";
import { isDashboardAuthBypassEnabled } from "@/lib/auth/dev-bypass";
export function controlEnabled(
  session: FoundationContext,
  env: Record<string, string | undefined>,
) {
  return (
    env.XEROWA_CONTROL_ENABLED === "1" &&
    resolveFoundationFlags(session, env).control
  );
}
export function syntheticEnabled(env: Record<string, string | undefined>) {
  return env.NODE_ENV !== "production" && env.XEROWA_CONTROL_SYNTHETIC === "1";
}
export function readEnabled(env: Record<string, string | undefined>) {
  const productionDeployment =
    env.VERCEL_ENV === "production" ||
    (!env.VERCEL_ENV && env.NODE_ENV === "production");
  if (
    env.XEROWA_CONTROL_READ_ENABLED !== "1" ||
    env.XEROWA_CONTROL_READ_SCHEMA_CONFIRMED !== "1" ||
    env.XEROWA_CONTROL_SYNTHETIC === "1" ||
    isDashboardAuthBypassEnabled(env) ||
    productionDeployment
  )
    return false;
  try {
    const url = new URL(env.NEXT_PUBLIC_SUPABASE_URL || "");
    const approved = new URL(env.XEROWA_CONTROL_APPROVED_NONPROD_URL || "");
    return (
      url.origin === approved.origin &&
      url.pathname === "/" &&
      approved.pathname === "/" &&
      !url.username &&
      !url.password &&
      !url.search &&
      !approved.search &&
      !approved.username &&
      !approved.password &&
      (url.protocol === "https:" ||
        (url.protocol === "http:" &&
          ["localhost", "127.0.0.1"].includes(url.hostname)))
    );
  } catch {
    return false;
  }
}
