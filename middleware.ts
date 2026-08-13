import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

type RateLimitPolicy = {
  scope: string;
  limit: number;
  windowSeconds: number;
};

const MUTATION_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

export function policyFor(request: NextRequest): RateLimitPolicy | null {
  const { pathname } = request.nextUrl;
  if (!pathname.startsWith('/api/')) return null;

  if (pathname === '/api/webhooks/whatsapp') {
    return request.method === 'GET'
      ? { scope: 'webhook:whatsapp:verify', limit: 30, windowSeconds: 60 }
      : { scope: 'webhook:whatsapp:ingress', limit: 180, windowSeconds: 60 };
  }
  if (pathname.startsWith('/api/webhooks/')) {
    return { scope: `webhook:${pathname.slice('/api/webhooks/'.length)}`, limit: 60, windowSeconds: 60 };
  }
  if (pathname.startsWith('/api/cron/')) {
    return { scope: `cron:${pathname.slice('/api/cron/'.length)}`, limit: 10, windowSeconds: 60 };
  }
  if (MUTATION_METHODS.has(request.method)) {
    return { scope: `api:${pathname}`, limit: 120, windowSeconds: 60 };
  }
  return null;
}

export function callerAddress(request: NextRequest) {
  const realIp = request.headers.get('x-real-ip')?.trim();
  if (realIp) return realIp;
  const forwarded = request.headers.get('x-forwarded-for') ?? 'unknown';
  // Use the address appended by the trusted edge, not a caller-supplied
  // leading value in a forwarded chain.
  return forwarded.split(',').at(-1)?.trim() || 'unknown';
}

async function sha256(value: string) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function enforceRateLimit(request: NextRequest, policy: RateLimitPolicy) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json(
      { ok: false, error: 'Rate-limit service is not configured.' },
      { status: 503 },
    );
  }

  const keyHash = await sha256(`${policy.scope}:${callerAddress(request)}:${serviceRoleKey}`);
  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/consume_api_rate_limit`, {
    method: 'POST',
    headers: {
      apikey: serviceRoleKey,
      authorization: `Bearer ${serviceRoleKey}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      p_scope: policy.scope,
      p_key_hash: keyHash,
      p_limit: policy.limit,
      p_window_seconds: policy.windowSeconds,
    }),
    cache: 'no-store',
  }).catch(() => null);

  if (!response?.ok) {
    return NextResponse.json(
      { ok: false, error: 'Rate-limit service is unavailable.' },
      { status: 503 },
    );
  }

  const rows = await response.json().catch(() => null) as Array<{
    allowed: boolean;
    limit_value: number;
    remaining: number;
    reset_at: string;
  }> | null;
  const result = rows?.[0];
  if (!result) {
    return NextResponse.json(
      { ok: false, error: 'Rate-limit service returned no decision.' },
      { status: 503 },
    );
  }

  if (!result.allowed) {
    const retryAfter = Math.max(
      1,
      Math.ceil((new Date(result.reset_at).getTime() - Date.now()) / 1000),
    );
    return NextResponse.json(
      { ok: false, error: 'Too many requests.' },
      {
        status: 429,
        headers: {
          'Retry-After': String(retryAfter),
          'X-RateLimit-Limit': String(result.limit_value),
          'X-RateLimit-Remaining': '0',
        },
      },
    );
  }

  return null;
}

export async function middleware(request: NextRequest) {
  const policy = policyFor(request);
  if (policy) {
    const limited = await enforceRateLimit(request, policy);
    if (limited) return limited;
    return NextResponse.next();
  }
  if (request.nextUrl.pathname.startsWith('/api/')) return NextResponse.next();
  return updateSession(request);
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icon.svg).*)',
  ],
};
