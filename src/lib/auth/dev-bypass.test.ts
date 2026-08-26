import { describe, expect, it } from 'vitest';
import {
  buildDevAuthBypassSession,
  isDashboardAuthBypassEnabled,
} from './dev-bypass';

describe('dashboard auth bypass guard', () => {
  it('stays disabled unless explicitly enabled', () => {
    expect(isDashboardAuthBypassEnabled({ NODE_ENV: 'development' })).toBe(false);
  });

  it('enables only outside production when the bypass flag is set', () => {
    expect(isDashboardAuthBypassEnabled({ NODE_ENV: 'development', XEROWA_AUTH_BYPASS: '1' })).toBe(true);
    expect(isDashboardAuthBypassEnabled({ NODE_ENV: 'production', XEROWA_AUTH_BYPASS: '1' })).toBe(false);
    expect(isDashboardAuthBypassEnabled({ VERCEL_ENV: 'production', XEROWA_AUTH_BYPASS: 'true' })).toBe(false);
  });

  it('creates a dev platform session scoped to the configured business id', () => {
    const session = buildDevAuthBypassSession({
      XEROWA_AUTH_BYPASS_BUSINESS_ID: 'biz_dev_123',
      XEROWA_AUTH_BYPASS_EMAIL: 'owner@example.com',
    });

    expect(session.platformRole).toBe('dev');
    expect(session.activeBusinessId).toBe('biz_dev_123');
    expect(session.user.email).toBe('owner@example.com');
    expect(session.memberships).toHaveLength(1);
    expect(session.memberships[0]).toMatchObject({
      business_id: 'biz_dev_123',
      role: 'dev',
      active: true,
    });
  });

  it('falls back to DEFAULT_BUSINESS_ID for local demo access', () => {
    const session = buildDevAuthBypassSession({ DEFAULT_BUSINESS_ID: 'biz_default' });
    expect(session.activeBusinessId).toBe('biz_default');
  });
});
