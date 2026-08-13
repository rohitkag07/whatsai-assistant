import type { User } from '@supabase/supabase-js';

export const PLATFORM_ROLES = ['client', 'admin', 'dev'] as const;
export type PlatformRole = (typeof PLATFORM_ROLES)[number];

export type BusinessMemberRole = 'owner' | 'manager' | 'agent' | PlatformRole;

const ADMIN_ROLES = new Set<PlatformRole>(['admin', 'dev']);

export function isPlatformRole(value: unknown): value is PlatformRole {
  return typeof value === 'string' && PLATFORM_ROLES.includes(value as PlatformRole);
}

export function isAdminPlatformRole(role: PlatformRole) {
  return ADMIN_ROLES.has(role);
}

export function platformRoleFromMembershipRole(role: BusinessMemberRole | null | undefined): PlatformRole | null {
  // Tenant membership roles never grant platform-wide authorization. Global
  // admin/dev access is accepted only from server-controlled app_metadata.
  if (role === 'client' || role === 'owner' || role === 'manager' || role === 'agent' || role === 'admin' || role === 'dev') {
    return 'client';
  }
  return null;
}

export function getUserPlatformRole(user: User): PlatformRole {
  const appRole =
    user.app_metadata?.platform_role ??
    user.app_metadata?.xero_role ??
    user.app_metadata?.xerowa_role ??
    user.app_metadata?.role;

  if (isPlatformRole(appRole)) return appRole;

  // Supabase user_metadata is editable by the signed-in user. It must never
  // participate in authorization decisions; privileged roles are assigned
  // only through server-controlled app_metadata.
  return 'client';
}

export function defaultLandingForRole(role: PlatformRole) {
  return isAdminPlatformRole(role) ? '/admin' : '/dashboard';
}
