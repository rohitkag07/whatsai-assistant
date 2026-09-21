import {
  resolveFoundationFlags,
  type FoundationContext,
} from "@/lib/product-foundation-flags";
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
