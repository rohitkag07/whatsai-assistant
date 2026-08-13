import { describe, expect, it } from 'vitest';
import { canMutateDashboardBusiness, type DashboardBusinessContext } from '@/lib/whatsai-business';
import type { AuthSession, BusinessMembership } from '@/lib/auth/session';

function context(role: BusinessMembership['role'], platformRole: AuthSession['platformRole'] = 'client') {
  return {
    businessId: 'business-a',
    session: {
      platformRole,
      memberships: [{ business_id: 'business-a', role }],
    },
  } as Pick<DashboardBusinessContext, 'businessId' | 'session'>;
}

describe('dashboard business mutation authorization', () => {
  it.each(['owner', 'manager', 'agent', 'admin'] as const)('allows business %s mutations', (role) => {
    expect(canMutateDashboardBusiness(context(role))).toBe(true);
  });

  it('denies viewer/client mutations', () => {
    expect(canMutateDashboardBusiness(context('client'))).toBe(false);
  });

  it('denies a tenant dev membership without platform app metadata', () => {
    expect(canMutateDashboardBusiness(context('dev'))).toBe(false);
  });

  it('requires the mutating membership to match the selected business', () => {
    const selected = context('owner');
    selected.session.memberships[0].business_id = 'business-b';
    expect(canMutateDashboardBusiness(selected)).toBe(false);
  });

  it.each(['admin', 'dev'] as const)('allows platform %s operations', (role) => {
    expect(canMutateDashboardBusiness(context('client', role))).toBe(true);
  });
});
