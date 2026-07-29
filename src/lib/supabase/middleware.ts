import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import type { Database } from '@/types/database';
import {
  defaultLandingForRole,
  getUserPlatformRole,
  isAdminPlatformRole,
  platformRoleFromMembershipRole,
  type BusinessMemberRole,
  type PlatformRole,
} from '@/lib/auth/roles';

const DEV_ONLY_PATHS = [
  '/admin',
  '/assistant-setup',
  '/campaigns',
  '/colony',
  '/content',
  '/ghost-closer',
  '/reports',
  '/settings',
];

const CLIENT_ROUTE_ALIASES: Record<string, string> = {
  '/conversations': '/chats',
  '/site-visits': '/calendar',
};

function matchesPath(pathname: string, paths: string[]) {
  return paths.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

function redirectTo(request: NextRequest, pathname: string) {
  const redirect = request.nextUrl.clone();
  redirect.pathname = pathname;
  redirect.search = '';
  return NextResponse.redirect(redirect);
}

async function resolvePlatformRole(supabase: ReturnType<typeof createServerClient<Database>>, userId: string, fallbackRole: PlatformRole) {
  if (isAdminPlatformRole(fallbackRole)) return fallbackRole;

  const { data } = await (supabase.from('business_members') as any)
    .select('role')
    .eq('user_id', userId)
    .eq('active', true)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  return platformRoleFromMembershipRole(data?.role as BusinessMemberRole | undefined) ?? fallbackRole;
}

/**
 * Edge middleware helper — keeps Supabase session cookies fresh on
 * every request and gates the dashboard behind a valid session.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } });

  const url     = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // If Supabase isn't configured (e.g., local docs preview), let the
  // request through unchanged so the dev experience stays usable.
  if (!url || !anonKey) return response;

  const supabase = createServerClient<Database>(url, anonKey, {
    cookies: {
      get(name: string) {
        return request.cookies.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        request.cookies.set({ name, value, ...options });
        response = NextResponse.next({ request: { headers: request.headers } });
        response.cookies.set({ name, value, ...options });
      },
      remove(name: string, options: CookieOptions) {
        request.cookies.set({ name, value: '', ...options });
        response = NextResponse.next({ request: { headers: request.headers } });
        response.cookies.set({ name, value: '', ...options });
      },
    },
  });

  const { data: { user } } = await supabase.auth.getUser();

  const pathname  = request.nextUrl.pathname;
  const isAuthPg  = pathname.startsWith('/login');
  const isGuard   = pathname.startsWith('/guard');
  const isPublic  = isAuthPg || isGuard;

  if (!user && !isPublic) {
    const redirect = request.nextUrl.clone();
    redirect.pathname = '/login';
    redirect.searchParams.set('next', `${pathname}${request.nextUrl.search}`);
    return NextResponse.redirect(redirect);
  }

  if (!user) return response;

  const platformRole = await resolvePlatformRole(supabase, user.id, getUserPlatformRole(user));
  const landingPath = defaultLandingForRole(platformRole);
  const clientAlias = Object.entries(CLIENT_ROUTE_ALIASES).find(([source]) => pathname === source || pathname.startsWith(`${source}/`));

  if (isAuthPg || pathname === '/') {
    return redirectTo(request, landingPath);
  }

  if (clientAlias) {
    return redirectTo(request, clientAlias[1]);
  }

  if (matchesPath(pathname, DEV_ONLY_PATHS) && !isAdminPlatformRole(platformRole)) {
    return redirectTo(request, '/dashboard');
  }

  return response;
}
