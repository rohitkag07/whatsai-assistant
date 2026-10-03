import type { User } from '@supabase/supabase-js';
import { describe, expect, it } from 'vitest';
import { getUserPlatformRole, platformRoleFromMembershipRole } from '@/lib/auth/roles';

function userWithMetadata(app: Record<string, unknown>, editable: Record<string, unknown>) {
  return {
    app_metadata: app,
    user_metadata: editable,
  } as User;
}

describe('getUserPlatformRole', () => {
  it('accepts privileged roles only from server-controlled app metadata', () => {
    expect(getUserPlatformRole(userWithMetadata({ platform_role: 'admin' }, {}))).toBe('admin');
    expect(getUserPlatformRole(userWithMetadata({ xerowa_role: 'dev' }, {}))).toBe('dev');
  });

  it.each(['platform_role', 'xero_role', 'xerowa_role', 'role'])(
    'ignores editable user_metadata.%s privilege claims',
    (key) => {
      expect(getUserPlatformRole(userWithMetadata({}, { [key]: 'admin' }))).toBe('client');
      expect(getUserPlatformRole(userWithMetadata({}, { [key]: 'dev' }))).toBe('client');
    },
  );
});

describe('platformRoleFromMembershipRole', () => {
  it.each(['owner', 'manager', 'agent', 'client', 'admin', 'dev'] as const)(
    'does not promote tenant membership role %s to a platform role',
    (role) => {
      expect(platformRoleFromMembershipRole(role)).toBe('client');
    },
  );
});
