export interface StagingCatalogSnapshot {
  readonly tables: readonly string[];
  readonly rlsEnabledTables: readonly string[];
  readonly policyTables: readonly string[];
  readonly functions: readonly string[];
  readonly triggers: readonly string[];
  readonly columns: Readonly<Record<string, readonly string[]>>;
}

export interface MigrationVerificationCheck {
  readonly id: string;
  readonly passed: boolean;
  readonly missing: readonly string[];
}

export interface MigrationVerificationReport {
  readonly passed: boolean;
  readonly checks: readonly MigrationVerificationCheck[];
}

const REQUIRED_TABLES = [
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

const REQUIRED_FUNCTIONS = [
  'private.is_tenant_member(uuid)',
  'private.has_tenant_role(uuid,xerowa_tenant_role[])',
  'private.is_tenant_admin(uuid)',
  'private.prevent_immutable_log_change()',
  'public.commit_workflow_transition',
] as const;

function missingFrom(
  actual: readonly string[],
  required: readonly string[],
): readonly string[] {
  const actualSet = new Set(actual);
  return Object.freeze(required.filter((item) => !actualSet.has(item)));
}

function check(
  id: string,
  missing: readonly string[],
): MigrationVerificationCheck {
  return Object.freeze({
    id,
    passed: missing.length === 0,
    missing,
  });
}

export function verifyStagingMigration(
  snapshot: StagingCatalogSnapshot,
): MigrationVerificationReport {
  const checks = Object.freeze([
    check('required_tables', missingFrom(snapshot.tables, REQUIRED_TABLES)),
    check(
      'rls_enabled',
      missingFrom(snapshot.rlsEnabledTables, REQUIRED_TABLES),
    ),
    check(
      'tenant_policies',
      missingFrom(snapshot.policyTables, REQUIRED_TABLES),
    ),
    check(
      'security_functions',
      missingFrom(snapshot.functions, REQUIRED_FUNCTIONS),
    ),
    check(
      'immutable_workflow_log_trigger',
      missingFrom(snapshot.triggers, ['workflow_transition_logs_immutable']),
    ),
    check(
      'tenant_columns',
      missingFrom(snapshot.columns.leads ?? [], ['tenant_id']),
    ),
  ]);

  return Object.freeze({
    passed: checks.every((item) => item.passed),
    checks,
  });
}
