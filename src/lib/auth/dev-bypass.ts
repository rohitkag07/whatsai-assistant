import type { User } from '@supabase/supabase-js';
import type { AuthSession, BusinessMembership } from '@/lib/auth/session';

const TRUE_VALUES = new Set(['1', 'true', 'yes', 'on']);
const PRODUCTION_VALUES = new Set(['production', 'prod']);

export type AuthBypassEnv = Partial<Record<string, string | undefined>>;

function truthy(value: string | undefined) {
  return TRUE_VALUES.has((value ?? '').trim().toLowerCase());
}

function isProductionEnv(env: AuthBypassEnv) {
  return PRODUCTION_VALUES.has((env.NODE_ENV ?? '').trim().toLowerCase())
    || PRODUCTION_VALUES.has((env.VERCEL_ENV ?? '').trim().toLowerCase());
}

export function isDashboardAuthBypassEnabled(env: AuthBypassEnv = process.env) {
  return truthy(env.XEROWA_AUTH_BYPASS) && !isProductionEnv(env);
}

export function getDevAuthBypassBusinessId(env: AuthBypassEnv = process.env) {
  return env.XEROWA_AUTH_BYPASS_BUSINESS_ID || env.DEFAULT_BUSINESS_ID || null;
}

export function buildDevAuthBypassSession(env: AuthBypassEnv = process.env): AuthSession {
  const businessId = getDevAuthBypassBusinessId(env);
  const now = new Date(0).toISOString();
  const email = env.XEROWA_AUTH_BYPASS_EMAIL || 'dev-bypass@xerowa.local';
  const userId = 'dev-auth-bypass-user';
  const membership: BusinessMembership | null = businessId
    ? {
        id: 'dev-auth-bypass-membership',
        business_id: businessId,
        user_id: userId,
        display_name: 'Dev auth bypass',
        role: 'dev',
        active: true,
        created_at: now,
      }
    : null;

  const user = {
    id: userId,
    aud: 'authenticated',
    role: 'authenticated',
    email,
    email_confirmed_at: now,
    phone: '',
    confirmed_at: now,
    last_sign_in_at: now,
    app_metadata: { provider: 'dev-bypass', providers: ['dev-bypass'], xerowa_role: 'dev' },
    user_metadata: { full_name: 'Dev auth bypass' },
    identities: [],
    created_at: now,
    updated_at: now,
    is_anonymous: false,
  } satisfies User;

  return {
    user,
    platformRole: 'dev',
    memberships: membership ? [membership] : [],
    activeBusinessId: businessId,
  };
}
