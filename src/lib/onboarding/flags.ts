import {
  resolveFoundationFlags,
  type FoundationContext,
} from "@/lib/product-foundation-flags";
export function onboardingEnabled(
  context: FoundationContext,
  env: Record<string, string | undefined>,
) {
  return (
    env.XEROWA_ONBOARDING_ENABLED === "1" &&
    resolveFoundationFlags(context, env).command
  );
}
