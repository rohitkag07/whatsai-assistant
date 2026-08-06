import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createClient } from '@supabase/supabase-js';
import { describe, expect, it } from 'vitest';

const migrationPath = resolve(
  process.cwd(),
  'supabase/migrations/20260806_multi_tenant_schema.sql',
);
const migrationSql = readFileSync(migrationPath, 'utf8');
const stagingVerifierSql = readFileSync(
  resolve(
    process.cwd(),
    'supabase/tests/staging_migration_verifier.sql',
  ),
  'utf8',
);

const tenantTables = [
  'tenants',
  'tenant_memberships',
  'contacts',
  'conversations',
  'messages',
  'leads',
  'appointments',
  'workflow_transition_logs',
  'webhook_events',
] as const;

const mutableTenantTables = [
  'contacts',
  'conversations',
  'messages',
  'leads',
  'appointments',
] as const;

function policySql(policyName: string): string {
  const match = migrationSql.match(
    new RegExp(`create policy ${policyName}[\\s\\S]*?;`, 'i'),
  );
  if (!match) {
    throw new Error(`Missing policy ${policyName}`);
  }
  return match[0];
}

describe('multi-tenant RLS migration contract', () => {
  it.each(tenantTables)('enables RLS for %s', (table) => {
    expect(migrationSql).toMatch(
      new RegExp(
        `alter table public\\.${table} enable row level security`,
        'i',
      ),
    );
  });

  it('locks membership mutations to owners only', () => {
    for (const policy of [
      'memberships_insert_owner',
      'memberships_update_owner',
      'memberships_delete_owner',
    ]) {
      const sql = policySql(policy);
      expect(sql).toContain('private.has_tenant_role');
      expect(sql).toContain("'owner'::public.xerowa_tenant_role");
      expect(sql).not.toContain("'admin'::public.xerowa_tenant_role");
    }

    expect(migrationSql).toContain(
      'drop policy if exists memberships_admin_insert',
    );
    expect(migrationSql).toContain(
      'drop policy if exists memberships_admin_update',
    );
    expect(migrationSql).toContain(
      'drop policy if exists memberships_admin_delete',
    );
  });

  it.each(mutableTenantTables)(
    'allows members to read %s but blocks viewer mutations',
    (table) => {
      const selectPolicy = policySql(`${table}_tenant_select`);
      expect(selectPolicy).toContain('private.is_tenant_member');
      expect(selectPolicy).not.toContain('private.has_tenant_role');

      for (const operation of ['insert', 'update', 'delete']) {
        const mutationPolicy = policySql(`${table}_tenant_${operation}`);
        expect(mutationPolicy).toContain('private.has_tenant_role');
        expect(mutationPolicy).toContain(
          "'agent'::public.xerowa_tenant_role",
        );
        expect(mutationPolicy).not.toContain(
          "'viewer'::public.xerowa_tenant_role",
        );
      }

      expect(migrationSql).not.toMatch(
        new RegExp(
          `create policy [^;]+ on public\\.${table}\\s+for all`,
          'i',
        ),
      );
    },
  );

  it('grants webhook operations explicitly without giving authenticated delete', () => {
    expect(migrationSql).toMatch(
      /grant all on table public\.webhook_events to service_role;/i,
    );
    expect(migrationSql).toMatch(
      /grant select,\s*insert,\s*update on table\s+public\.webhook_events\s+to authenticated;/i,
    );
    expect(migrationSql).not.toMatch(
      /grant[^;]*delete[^;]*public\.webhook_events[^;]*authenticated/i,
    );
  });

  it('uses tenant-bound composite foreign keys throughout the graph', () => {
    expect(migrationSql).toMatch(
      /unique\s*\(tenant_id,\s*id\)/i,
    );
    expect(migrationSql).toMatch(
      /foreign key\s*\(tenant_id,\s*conversation_id\)[\s\S]*?references public\.conversations\(tenant_id,\s*id\)/i,
    );
    expect(migrationSql).toMatch(
      /foreign key\s*\(tenant_id,\s*contact_id\)[\s\S]*?references public\.contacts\(tenant_id,\s*id\)/i,
    );
    expect(migrationSql).toMatch(
      /foreign key\s*\(tenant_id,\s*lead_id\)[\s\S]*?references public\.leads\(tenant_id,\s*id\)/i,
    );
  });

  it('hardens definer helpers and provides an atomic workflow RPC', () => {
    for (const helper of [
      'private.is_tenant_member',
      'private.is_tenant_admin',
      'private.has_tenant_role',
    ]) {
      const start = migrationSql.indexOf(`function ${helper}`);
      expect(start).toBeGreaterThanOrEqual(0);
      const functionSql = migrationSql.slice(start, start + 1_200);
      expect(functionSql).toContain('security definer');
      expect(functionSql).toContain("set search_path = ''");
    }

    expect(migrationSql).toContain(
      'create or replace function public.commit_workflow_transition',
    );
    expect(migrationSql).toContain('security invoker');
    expect(migrationSql).toContain(
      'before update or delete on public.workflow_transition_logs',
    );
  });

  it('staging verifier audits roles, definer settings, grants, and composite keys', () => {
    expect(stagingVerifierSql).toContain("policy_record.roles");
    expect(stagingVerifierSql).toContain(
      'cardinality(policy_record.roles) <> 1',
    );
    expect(stagingVerifierSql).toContain("'has_tenant_role'");
    expect(stagingVerifierSql).toContain('function_record.prosecdef');
    expect(stagingVerifierSql).toContain("search_path=%");
    expect(stagingVerifierSql).toContain('pg_get_constraintdef');
    expect(stagingVerifierSql).toContain(
      "'service_role',\n      'public.webhook_events'",
    );
    expect(stagingVerifierSql).toContain(
      'workflow_transition_logs_immutable',
    );
  });
});

const integrationEnvironment = {
  url: process.env.RLS_TEST_SUPABASE_URL,
  anonKey: process.env.RLS_TEST_SUPABASE_ANON_KEY,
  ownerAJwt: process.env.RLS_TEST_OWNER_A_JWT,
  tenantAId: process.env.RLS_TEST_TENANT_A_ID,
  tenantBId: process.env.RLS_TEST_TENANT_B_ID,
};

const hasIntegrationEnvironment = Object.values(integrationEnvironment).every(
  (value): value is string => typeof value === 'string' && value.length > 0,
);

function requireIntegrationEnvironment(): {
  readonly url: string;
  readonly anonKey: string;
  readonly ownerAJwt: string;
  readonly tenantAId: string;
  readonly tenantBId: string;
} {
  const { url, anonKey, ownerAJwt, tenantAId, tenantBId } =
    integrationEnvironment;
  if (!url || !anonKey || !ownerAJwt || !tenantAId || !tenantBId) {
    throw new Error('RLS integration environment is incomplete');
  }
  return { url, anonKey, ownerAJwt, tenantAId, tenantBId };
}

describe.skipIf(!hasIntegrationEnvironment)(
  'live cross-tenant RLS isolation',
  () => {
    it('allows Owner A to read Tenant A but returns zero Tenant B rows', async () => {
      const environment = requireIntegrationEnvironment();

      const ownerAClient = createClient(
        environment.url,
        environment.anonKey,
        {
          global: {
            headers: {
              Authorization: `Bearer ${environment.ownerAJwt}`,
            },
          },
          auth: {
            persistSession: false,
            autoRefreshToken: false,
          },
        },
      );

      const ownTenant = await ownerAClient
        .from('tenants')
        .select('id')
        .eq('id', environment.tenantAId);
      expect(ownTenant.error).toBeNull();
      expect(ownTenant.data).toEqual([{ id: environment.tenantAId }]);

      const foreignTenant = await ownerAClient
        .from('tenants')
        .select('id')
        .eq('id', environment.tenantBId);
      expect(foreignTenant.error).toBeNull();
      expect(foreignTenant.data).toEqual([]);

      const foreignContacts = await ownerAClient
        .from('contacts')
        .select('id')
        .eq('tenant_id', environment.tenantBId);
      expect(foreignContacts.error).toBeNull();
      expect(foreignContacts.data).toEqual([]);
    });

    it('denies Owner A inserting a contact into Tenant B', async () => {
      const environment = requireIntegrationEnvironment();

      const ownerAClient = createClient(
        environment.url,
        environment.anonKey,
        {
          global: {
            headers: {
              Authorization: `Bearer ${environment.ownerAJwt}`,
            },
          },
          auth: {
            persistSession: false,
            autoRefreshToken: false,
          },
        },
      );

      const attemptedInsert = await ownerAClient.from('contacts').insert({
        tenant_id: environment.tenantBId,
        phone: '+910000000000',
        full_name: 'RLS denial probe',
      });
      expect(attemptedInsert.error).not.toBeNull();
    });
  },
);
