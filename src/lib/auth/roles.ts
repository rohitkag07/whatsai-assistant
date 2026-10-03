import type { User } from "@supabase/supabase-js";

export const PLATFORM_ROLES = ["client", "admin", "dev"] as const;
export type PlatformRole = (typeof PLATFORM_ROLES)[number];

export type BusinessMemberRole =
  | "owner"
  | "manager"
  | "agent"
  | "operator"
  | "viewer"
  | PlatformRole;

const ADMIN_ROLES = new Set<PlatformRole>(["admin", "dev"]);

export function isPlatformRole(value: unknown): value is PlatformRole {
  return (
    typeof value === "string" && PLATFORM_ROLES.includes(value as PlatformRole)
  );
}

export function isAdminPlatformRole(role: PlatformRole) {
  return ADMIN_ROLES.has(role);
}

export function platformRoleFromMembershipRole(
  role: BusinessMemberRole | null | undefined,
): PlatformRole | null {
  if (
    role === "client" ||
    role === "owner" ||
    role === "manager" ||
    role === "agent" ||
    role === "operator" ||
    role === "viewer" ||
    role === "admin" ||
    role === "dev"
  )
    return "client";
  return null;
}

// Only server-controlled app metadata may supply platform claims. Ambiguous or
// malformed aliases never confer authority; profile/user metadata is not read.
export function getUserPlatformRole(user: User): PlatformRole {
  const claims = ["platform_role", "xero_role", "xerowa_role", "role"]
    .map((key) => user.app_metadata?.[key])
    .filter((value) => value !== undefined);
  if (!claims.length || claims.some((value) => !isPlatformRole(value)))
    return "client";
  return new Set(claims).size === 1 ? (claims[0] as PlatformRole) : "client";
}

export function resolveTrustedPlatformRole(
  user: User,
  rows: unknown,
): PlatformRole {
  void rows;
  const appRole = getUserPlatformRole(user);
  if (isAdminPlatformRole(appRole)) return appRole;
  // Tenant membership rows determine business access elsewhere, but never
  // confer platform-wide admin/dev authority.
  return "client";
}

export function defaultLandingForRole(role: PlatformRole) {
  return isAdminPlatformRole(role) ? "/admin" : "/dashboard";
}
