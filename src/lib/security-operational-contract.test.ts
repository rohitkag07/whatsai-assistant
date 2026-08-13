import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');
const migration = read('supabase/migrations/20260812222529_pilot_operational_controls.sql');
const exposedSurfaceMigration = read(
  'supabase/migrations/20260813122307_harden_legacy_exposed_surfaces.sql',
);
const safeSearchPathMigration = read(
  'supabase/migrations/20260813122510_set_safe_function_search_paths.sql',
);
const middleware = read('middleware.ts');

describe('pilot operational control contracts', () => {
  it('keeps rate-limit state private and the RPC service-role-only', () => {
    expect(migration).toContain('private.api_rate_limit_windows');
    expect(migration).toMatch(/security definer\s+set search_path = ''/i);
    expect(migration).toMatch(
      /revoke all on function public\.consume_api_rate_limit[\s\S]*from public, anon, authenticated/i,
    );
    expect(migration).toMatch(
      /grant execute on function public\.consume_api_rate_limit[\s\S]*to service_role/i,
    );
  });

  it('fails closed and returns an explicit rate-limit response', () => {
    expect(middleware).toContain('/rest/v1/rpc/consume_api_rate_limit');
    expect(middleware).toContain("status: 429");
    expect(middleware).toContain("status: 503");
    expect(middleware).toContain("'Retry-After'");
  });

  it('requires preview, exact confirmation and a private audit receipt', () => {
    expect(migration).toContain('preview_business_retention_delete');
    expect(migration).toContain('execute_business_retention_delete');
    expect(migration).toContain("'DELETE BUSINESS ' || p_business_id::text");
    expect(migration).toContain('private.business_retention_deletion_audit');
    expect(migration).toMatch(
      /revoke all on function public\.execute_business_retention_delete[\s\S]*authenticated/i,
    );
  });

  it('removes XeroWA legacy PII without deleting standalone X7 entities', () => {
    for (const table of ['follow_up_queue', 'whatsapp_messages', 'agent_runs', 'leads']) {
      expect(migration).toContain(`delete from public.${table} where builder_id = v_builder_id`);
    }
    expect(migration).not.toContain('delete from public.builders');
    expect(migration).not.toContain('delete from public.projects');
  });

  it('closes legacy views and broadcast mutations to untrusted Data API roles', () => {
    expect(exposedSurfaceMigration).toContain('security_invoker = true');
    expect(exposedSurfaceMigration).toMatch(
      /revoke all privileges on table public\.%I from public, anon, authenticated/i,
    );
    expect(exposedSurfaceMigration).toMatch(
      /revoke all on function public\.claim_broadcast_recipients[\s\S]*public, anon, authenticated/i,
    );
    expect(exposedSurfaceMigration).toMatch(
      /revoke all on function public\.refresh_broadcast_campaign_metrics[\s\S]*public, anon, authenticated/i,
    );
  });

  it('pins legacy helper and trigger function search paths', () => {
    for (const functionName of [
      'set_updated_at',
      'auth_builder_id',
      'seed_setup_checklist',
      'whatsai_touch_updated_at',
    ]) {
      expect(safeSearchPathMigration).toContain(`public.${functionName}`);
    }
    expect(safeSearchPathMigration.match(/set search_path = ''/g)).toHaveLength(4);
  });
});
