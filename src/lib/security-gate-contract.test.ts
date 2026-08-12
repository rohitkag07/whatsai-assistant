import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');
const securityMigration = read('supabase/migrations/20260812222528_pilot_security_gate.sql');
const webhookMigration = read('supabase/migrations/019_vercel_serverless_runtime.sql');
const middleware = read('middleware.ts');

const mutationRoutes = [
  'src/app/api/appointments/[id]/route.ts',
  'src/app/api/chats/[threadId]/assign/route.ts',
  'src/app/api/leads/[id]/stage/route.ts',
  'src/app/api/sales/book-visit/route.ts',
  'src/app/api/sales/drip/route.ts',
  'src/app/api/sales/follow-up/route.ts',
  'src/app/api/sales/site-visits/feedback/route.ts',
  'src/app/api/whatsai/broadcasts/[id]/run/route.ts',
  'src/app/api/whatsai/broadcasts/route.ts',
  'src/app/api/whatsai/followup-sequence/route.ts',
  'src/app/api/whatsai/knowledge/route.ts',
  'src/app/api/whatsai/lead-flow/route.ts',
  'src/app/api/whatsai/media/route.ts',
  'src/app/api/whatsai/reply/route.ts',
  'src/app/api/whatsai/templates/route.ts',
  'src/app/api/whatsai/templates/sync/route.ts',
  'src/app/api/whatsai/thread-state/route.ts',
];

describe('pilot security gate source contracts', () => {
  it('uses durable service-role-only rate limiting and fails closed in middleware', () => {
    expect(securityMigration).toContain('private.api_rate_limit_windows');
    expect(securityMigration).toContain("set search_path = ''");
    expect(securityMigration).toMatch(/revoke all on function public\.consume_api_rate_limit[\s\S]*authenticated/i);
    expect(securityMigration).toMatch(/grant execute on function public\.consume_api_rate_limit[\s\S]*service_role/i);
    expect(middleware).toContain('/rest/v1/rpc/consume_api_rate_limit');
    expect(middleware).toContain("status: 429");
    expect(middleware).toContain("status: 503");
  });

  it('replaces builder-claim tenant policies with membership reads and operator writes', () => {
    expect(securityMigration).toContain('private.is_business_member');
    expect(securityMigration).toContain('private.has_business_role');
    expect(securityMigration).toContain('public.business_members');
    expect(securityMigration).toContain("array['owner','manager','agent','admin','dev']::text[]");
    expect(securityMigration).not.toContain("array['owner','manager','agent','client'");
  });

  it.each(mutationRoutes)('requires mutation authorization in %s', (route) => {
    expect(read(route)).toContain('requireDashboardBusinessMutationContext');
  });

  it('keeps webhook replay ingestion atomic and service-role only', () => {
    expect(webhookMigration).toContain('pg_advisory_xact_lock');
    expect(webhookMigration).toContain("'duplicate', true");
    expect(webhookMigration).toMatch(/revoke all on function public\.ingest_whatsapp_inbound[\s\S]*authenticated/i);
    expect(webhookMigration).toMatch(/grant execute on function public\.ingest_whatsapp_inbound[\s\S]*service_role/i);
  });

  it('requires preview, exact confirmation, and an audit receipt for retention deletion', () => {
    expect(securityMigration).toContain('preview_business_retention_delete');
    expect(securityMigration).toContain('execute_business_retention_delete');
    expect(securityMigration).toContain("'DELETE BUSINESS ' || p_business_id::text");
    expect(securityMigration).toContain('private.business_retention_deletion_audit');
    expect(securityMigration).toMatch(/revoke all on function public\.execute_business_retention_delete[\s\S]*authenticated/i);
  });
});
