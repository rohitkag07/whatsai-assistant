import { createBrowserClient } from '@supabase/ssr';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

/**
 * Browser-side Supabase client (RLS-aware via anon key).
 * Use inside Client Components, hooks, and event handlers.
 */
export function createClient() {
  const url     = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      '[supabase/client] Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. ' +
      'Add the Supabase browser credentials to the root .env.local file.',
    );
  }

  return createBrowserClient<Database>(url, anonKey);
}

/**
 * Password recovery must remain usable when an email link is opened in a
 * different browser from the one that requested it. The regular SSR client is
 * intentionally PKCE-only, whose verifier is browser-local. This narrowly
 * scoped client requests and consumes an implicit, time-limited recovery
 * session instead; it is signed out immediately after the password update.
 */
export function createImplicitRecoveryClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      '[supabase/client] Missing browser credentials for password recovery.',
    );
  }

  return createSupabaseClient<Database>(url, anonKey, {
    auth: {
      flowType: 'implicit',
      detectSessionInUrl: true,
      persistSession: true,
      autoRefreshToken: true,
    },
  });
}
