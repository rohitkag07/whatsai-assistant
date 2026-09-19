import { isAdminPlatformRole, type PlatformRole } from "@/lib/auth/roles";

export type FoundationContext = {
  platformRole: PlatformRole;
  activeBusinessId: string | null;
  memberships: readonly { business_id: string; active: boolean }[];
};
export type FoundationFlags = {
  control: boolean;
  command: boolean;
  designLab: boolean;
};
// Pure resolver: only server layouts/pages supply the environment. No client override.
export function resolveFoundationFlags(
  context: FoundationContext,
  env: Record<string, string | undefined>,
): FoundationFlags {
  const platform = isAdminPlatformRole(context.platformRole);
  const enabled = env.XEROWA_FOUNDATION_ENABLED === "1";
  const tenants = (env.XEROWA_FOUNDATION_TENANT_IDS ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter((value) => value && value !== "*");
  const id = context.activeBusinessId;
  const hasAccess =
    platform ||
    context.memberships.some(
      (member) => member.active && member.business_id === id,
    );
  return {
    control: enabled && Boolean(id && hasAccess && tenants.includes(id)),
    command: enabled && platform && env.XEROWA_FOUNDATION_COMMAND === "1",
    designLab: platform && env.XEROWA_DESIGN_LAB_ENABLED === "1",
  };
}
