import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import type { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { ACTIVE_BUSINESS_COOKIE } from '@/lib/auth/active-business';
import {
  defaultLandingForRole,
  getUserPlatformRole,
  isAdminPlatformRole,
  platformRoleFromMembershipRole,
  type BusinessMemberRole,
  type PlatformRole,
} from '@/lib/auth/roles';

export type BusinessMembership = {
  id: string;
  business_id: string;
  user_id: string;
  display_name: string | null;
  role: BusinessMemberRole;
  active: boolean;
  created_at: string;
};

export type AuthSession = {
  user: User;
  platformRole: PlatformRole;
  memberships: BusinessMembership[];
  activeBusinessId: string | null;
};

function loginRedirect(next = '/'): never {
  const params = new URLSearchParams({ next });
  redirect(`/login?${params.toString()}`);
}

function normalizeMemberships(rows: unknown): BusinessMembership[] {
  if (!Array.isArray(rows)) return [];

  return rows
    .filter((row): row is BusinessMembership => {
      if (!row || typeof row !== 'object') return false;
      const item = row as Partial<BusinessMembership>;
      return Boolean(item.id && item.business_id && item.user_id && item.role && item.active);
    })
    .map((row) => ({
      ...row,
      role: row.role,
    }));
}

export async function getAuthSession(): Promise<AuthSession | null> {
  const supabase = await createClient().catch(() => null);
  if (!supabase) return null;

  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) return null;

  const membershipsResult = await (supabase.from('business_members') as any)
    .select('id,business_id,user_id,display_name,role,active,created_at')
    .eq('user_id', user.id)
    .eq('active', true)
    .order('created_at', { ascending: true });

  const memberships = normalizeMemberships(membershipsResult.data);
  const userPlatformRole = getUserPlatformRole(user);
  const membershipRole = memberships.map((membership) => platformRoleFromMembershipRole(membership.role)).find(Boolean);
  const platformRole = isAdminPlatformRole(userPlatformRole) ? userPlatformRole : membershipRole ?? userPlatformRole;
  const cookieStore = await cookies();
  const selectedBusinessId = cookieStore.get(ACTIVE_BUSINESS_COOKIE)?.value ?? null;
  const activeBusinessId = isAdminPlatformRole(platformRole)
    ? selectedBusinessId
    : memberships.some((membership) => membership.business_id === selectedBusinessId)
      ? selectedBusinessId
      : memberships[0]?.business_id ?? null;

  return {
    user,
    platformRole,
    memberships,
    activeBusinessId,
  };
}

export async function requireSession(next = '/') {
  const session = await getAuthSession();
  if (!session) loginRedirect(next);
  return session;
}

export async function requirePlatformRole(allowedRoles: PlatformRole[]) {
  const session = await requireSession('/admin');
  if (!allowedRoles.includes(session.platformRole)) {
    redirect(defaultLandingForRole(session.platformRole));
  }
  return session;
}

export async function requireBusinessAccess(businessId?: string) {
  const session = await requireSession('/dashboard');

  if (isAdminPlatformRole(session.platformRole)) return session;

  const hasMembership = businessId
    ? session.memberships.some((membership) => membership.business_id === businessId)
    : session.memberships.length > 0;

  if (!hasMembership) redirect('/guard');

  return session;
}
