import type { SupabaseClient } from '@supabase/supabase-js';
import { getAuthSession } from '@/lib/auth/session';
import { isAdminPlatformRole, type PlatformRole } from '@/lib/auth/roles';

type DashboardBusiness = Awaited<ReturnType<typeof fetchBusiness>>;

export type DashboardBusinessContext = {
  business: DashboardBusiness;
  businessId: string;
  session: NonNullable<Awaited<ReturnType<typeof getAuthSession>>>;
};

const BUSINESS_MUTATION_ROLES = new Set(['owner', 'manager', 'agent', 'admin']);

export async function resolveDashboardBusiness(supabase: SupabaseClient, requestedBusinessId?: string | null) {
  const configuredBusinessId = process.env.DEFAULT_BUSINESS_ID || null;
  const configuredBuilderId = process.env.DEFAULT_BUILDER_ID || null;

  if (configuredBusinessId) {
    if (requestedBusinessId && requestedBusinessId !== configuredBusinessId) {
      throw new BusinessContextError('business_context_mismatch', 403);
    }
    return fetchBusiness(supabase, configuredBusinessId);
  }

  if (configuredBuilderId) {
    const { data, error } = await supabase
      .from('businesses')
      .select('id, name, builder_id')
      .eq('builder_id', configuredBuilderId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw new BusinessContextError(error.message, 502);
    if (!data) throw new BusinessContextError('default_business_not_found', 404);
    if (requestedBusinessId && requestedBusinessId !== data.id) {
      throw new BusinessContextError('business_context_mismatch', 403);
    }
    return data;
  }

  if (requestedBusinessId && process.env.NODE_ENV !== 'production') {
    return fetchBusiness(supabase, requestedBusinessId);
  }

  throw new BusinessContextError('Configure DEFAULT_BUSINESS_ID or DEFAULT_BUILDER_ID.', 503);
}

async function fetchBusiness(supabase: SupabaseClient, businessId: string) {
  const { data, error } = await supabase
    .from('businesses')
    .select('id, name, builder_id')
    .eq('id', businessId)
    .maybeSingle();
  if (error) throw new BusinessContextError(error.message, 502);
  if (!data) throw new BusinessContextError('business_not_found', 404);
  return data;
}

export async function requireDashboardBusinessContext(supabase: SupabaseClient, requestedBusinessId?: string | null): Promise<DashboardBusinessContext> {
  const session = await getAuthSession();
  if (!session) throw new BusinessContextError('authentication_required', 401);

  const isPlatformUser = isAdminPlatformRole(session.platformRole);
  const membershipIds = new Set(session.memberships.map((membership) => membership.business_id));
  const businessId = requestedBusinessId ?? session.activeBusinessId;

  if (!businessId) throw new BusinessContextError('business_membership_required', 403);
  if (!isPlatformUser && !membershipIds.has(businessId)) {
    throw new BusinessContextError('business_access_denied', 403);
  }

  const business = await fetchBusiness(supabase, businessId);
  return { business, businessId, session };
}

export function canMutateDashboardBusiness(
  context: Pick<DashboardBusinessContext, 'businessId' | 'session'>,
) {
  if (isAdminPlatformRole(context.session.platformRole)) return true;
  return context.session.memberships.some(
    (membership) => membership.business_id === context.businessId
      && BUSINESS_MUTATION_ROLES.has(membership.role),
  );
}

export async function requireDashboardBusinessMutationContext(
  supabase: SupabaseClient,
  requestedBusinessId?: string | null,
): Promise<DashboardBusinessContext> {
  const context = await requireDashboardBusinessContext(supabase, requestedBusinessId);
  if (!canMutateDashboardBusiness(context)) {
    throw new BusinessContextError('business_mutation_denied', 403);
  }
  return context;
}

export async function requirePlatformApiSession(allowedRoles: PlatformRole[]) {
  const session = await getAuthSession();
  if (!session) throw new BusinessContextError('authentication_required', 401);
  if (!allowedRoles.includes(session.platformRole)) throw new BusinessContextError('platform_access_denied', 403);
  return session;
}

export class BusinessContextError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
    this.name = 'BusinessContextError';
  }
}
