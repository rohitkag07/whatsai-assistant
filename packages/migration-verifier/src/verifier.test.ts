import { describe, expect, it } from 'vitest';
import {
  verifyStagingMigration,
  type StagingCatalogSnapshot,
} from './verifier';

const completeSnapshot: StagingCatalogSnapshot = {
  tables: [
    'tenants',
    'tenant_memberships',
    'contacts',
    'conversations',
    'messages',
    'leads',
    'appointments',
    'workflow_transition_logs',
    'webhook_events',
  ],
  rlsEnabledTables: [
    'tenants',
    'tenant_memberships',
    'contacts',
    'conversations',
    'messages',
    'leads',
    'appointments',
    'workflow_transition_logs',
    'webhook_events',
  ],
  policyTables: [
    'tenants',
    'tenant_memberships',
    'contacts',
    'conversations',
    'messages',
    'leads',
    'appointments',
    'workflow_transition_logs',
    'webhook_events',
  ],
  functions: [
    'private.is_tenant_member(uuid)',
    'private.has_tenant_role(uuid,xerowa_tenant_role[])',
    'private.is_tenant_admin(uuid)',
    'private.prevent_immutable_log_change()',
    'public.commit_workflow_transition',
  ],
  triggers: ['workflow_transition_logs_immutable'],
  columns: {
    leads: ['id', 'builder_id', 'tenant_id'],
  },
};

describe('verifyStagingMigration', () => {
  it('passes only when every institutional schema control is present', () => {
    const report = verifyStagingMigration(completeSnapshot);

    expect(report.passed).toBe(true);
    expect(report.checks.every((check) => check.passed)).toBe(true);
  });

  it('reports missing RLS and immutable-log controls', () => {
    const report = verifyStagingMigration({
      ...completeSnapshot,
      rlsEnabledTables: completeSnapshot.rlsEnabledTables.filter(
        (table) => table !== 'messages',
      ),
      triggers: [],
    });

    expect(report.passed).toBe(false);
    expect(
      report.checks.find((check) => check.id === 'rls_enabled')?.missing,
    ).toEqual(['messages']);
    expect(
      report.checks.find(
        (check) => check.id === 'immutable_workflow_log_trigger',
      )?.missing,
    ).toEqual(['workflow_transition_logs_immutable']);
  });
});
