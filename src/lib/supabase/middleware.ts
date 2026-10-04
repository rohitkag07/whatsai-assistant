import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/types/database";
import { isDashboardAuthBypassEnabled } from "@/lib/auth/dev-bypass";
import {
  defaultLandingForRole,
  getUserPlatformRole,
  resolveTrustedPlatformRole,
  isAdminPlatformRole,
} from "@/lib/auth/roles";
import { isPublicAuthPath } from "@/lib/auth/password-recovery";

const DEV_ONLY_PATHS = ["/admin", "/assistant-setup", "/reports", "/settings"];

const CLIENT_ROUTE_ALIASES: Record<string, string> = {
  "/conversations": "/chats",
  "/site-visits": "/calendar",
};

function matchesPath(pathname: string, paths: string[]) {
  return paths.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}

function redirectTo(request: NextRequest, pathname: string) {
  const redirect = request.nextUrl.clone();
  redirect.pathname = pathname;
  redirect.search = "";
  return NextResponse.redirect(redirect);
}

async function resolvePlatformRole(
  supabase: ReturnType<typeof createServerClient<Database>>,
  user: import("@supabase/supabase-js").User,
) {
  const appRole = getUserPlatformRole(user);
  if (isAdminPlatformRole(appRole)) return appRole;
  const { data, error } = await supabase
    .from("business_members")
    .select("id,business_id,user_id,role,active")
    .eq("user_id", user.id)
    .eq("active", true)
    .order("created_at", { ascending: true });
  return resolveTrustedPlatformRole(user, error ? [] : data);
}

/**
 * Edge middleware helper — keeps Supabase session cookies fresh on
 * every request and gates the dashboard behind a valid session.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } });

  if (isDashboardAuthBypassEnabled()) return response;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
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
        request.cookies.set({ name, value: "", ...options });
        response = NextResponse.next({ request: { headers: request.headers } });
        response.cookies.set({ name, value: "", ...options });
      },
    },
  });

  const userResult = await supabase.auth.getUser();
  const user = userResult.error ? null : userResult.data.user;

  const pathname = request.nextUrl.pathname;
  const isAuthPg = pathname.startsWith("/login");
  const isPublic = isPublicAuthPath(pathname);

  if (!user && !isPublic) {
    const redirect = request.nextUrl.clone();
    redirect.pathname = "/login";
    redirect.searchParams.set("next", `${pathname}${request.nextUrl.search}`);
    return NextResponse.redirect(redirect);
  }

  if (!user) return response;

  const platformRole = await resolvePlatformRole(supabase, user);
  const landingPath = defaultLandingForRole(platformRole);
  const clientAlias = Object.entries(CLIENT_ROUTE_ALIASES).find(
    ([source]) => pathname === source || pathname.startsWith(`${source}/`),
  );

  if (isAuthPg || pathname === "/") {
    return redirectTo(request, landingPath);
  }

  if (clientAlias) {
    return redirectTo(request, clientAlias[1]);
  }

  if (
    matchesPath(pathname, DEV_ONLY_PATHS) &&
    !isAdminPlatformRole(platformRole)
  ) {
    return redirectTo(request, "/dashboard");
  }

  return response;
}
