import { describe, it, expect } from 'vitest';
import { commandEnabled, commandSyntheticEnabled, scopedSnapshot, approvalPresentation, unavailableCommand } from './model';
import { syntheticCommand } from './fixtures';
const context = { platformRole: 'admin' as const, activeBusinessId: null, memberships: [] };
const enabled = { XEROWA_FOUNDATION_ENABLED: '1', XEROWA_FOUNDATION_COMMAND: '1', XEROWA_COMMAND_ENABLED: '1' };
describe('Command presentation boundaries', () => {
  it('requires the existing platform authority and every default-off flag', () => {
    expect(commandEnabled(context, {})).toBe(false);
    expect(commandEnabled(context, enabled)).toBe(true);
    for (const key of Object.keys(enabled)) expect(commandEnabled(context, { ...enabled, [key]: '0' })).toBe(false);
    expect(commandEnabled({ ...context, platformRole: 'client' }, enabled)).toBe(false);
  });
  it('Synthetic needs a separate lab gate and cannot run in production', () => {
    const env = { ...enabled, XEROWA_COMMAND_SYNTHETIC: '1', XEROWA_DESIGN_LAB_ENABLED: '1', NODE_ENV: 'development' };
    expect(commandSyntheticEnabled(context, env)).toBe(true);
    expect(commandSyntheticEnabled(context, { ...env, NODE_ENV: 'production' })).toBe(false);
    expect(commandSyntheticEnabled(context, { ...env, VERCEL_ENV: 'production' })).toBe(false);
    expect(commandSyntheticEnabled(context, { ...env, XEROWA_DESIGN_LAB_ENABLED: '0' })).toBe(false);
  });
  it('fails closed on foreign business, child and approval relationships', () => {
    const source = syntheticCommand();
    source.incidents.push({ ...source.incidents[0], id: 'foreign-child', runId: 'synthetic-run-estate' });
    source.approvals.push({ ...source.approvals[0], id: 'foreign-approval', runId: 'synthetic-run-estate' });
    const result = scopedSnapshot(source, ['xerowa-test-gym']);
    expect(result.businesses.map(b => b.id)).toEqual(['xerowa-test-gym']);
    expect(result.runs.every(r => r.businessId === 'xerowa-test-gym')).toBe(true);
    expect(result.incidents.find(i => i.id === 'foreign-child')).toBeUndefined();
    expect(result.approvals.find(a => a.id === 'foreign-approval')).toBeUndefined();
    expect(scopedSnapshot(source, []).runs).toEqual([]);
  });
  it('changed, expired, invalid-date and revoked decisions retain unsafe states', () => {
    const a = syntheticCommand().approvals[0];
    expect(approvalPresentation({ ...a, approvedHash: 'other' }, '2026-10-02T10:00:00Z')).toBe('changed');
    expect(approvalPresentation(a, '2026-10-04T10:00:00Z')).toBe('expired');
    expect(approvalPresentation({ ...a, expiresAt: 'invalid' }, '2026-10-02T10:00:00Z')).toBe('expired');
    expect(approvalPresentation({ ...a, status: 'revoked' }, '2026-10-02T10:00:00Z')).toBe('revoked');
  });
  it('absence has no invented healthy fleet, queue, receipt or version', () => {
    const s = unavailableCommand();
    expect(s.source).toBe('Unavailable'); expect(s.state).toBe('disconnected');
    expect(s.runs).toEqual([]); expect(s.businesses).toEqual([]);
    expect(s.agents.every(a => a.reachability === 'unknown' && a.queue === null && a.version === null)).toBe(true);
  });
  it('bounds 10,000-row conditions and labels the result partial', () => {
    const s = syntheticCommand();
    s.runs = Array.from({length:10_000}, (_, i) => ({...s.runs[0], id:`run-${i}`, approvalId:null}));
    const result = scopedSnapshot(s, ['xerowa-test-gym']);
    expect(result.runs).toHaveLength(50); expect(result.state).toBe('partial');
    expect(result.approvals).toEqual([]); expect(result.incidents).toEqual([]);
  });
});
