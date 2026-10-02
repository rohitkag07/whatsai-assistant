import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, it, expect, vi, afterEach } from 'vitest';
vi.mock('server-only', () => ({}));
import { commandExperience } from '@/components/admin/CommandExperiencePage';
import { CommandWorkspace } from '@/components/admin/CommandWorkspace';
import { unavailableCommand } from '@/lib/command/model';
import type { EvidenceState } from '@/lib/command/model';
import { syntheticCommand } from '@/lib/command/fixtures';
import type { AuthSession } from '@/lib/auth/session';
const env = { ...process.env };
afterEach(() => { process.env = { ...env }; });
describe('Command server and presentation gate', () => {
  it('flag off returns to the legacy page before reading fixtures', () => {
    const session = { platformRole: 'admin', activeBusinessId: null, memberships: [] } as unknown as AuthSession;
    delete process.env.XEROWA_COMMAND_ENABLED;
    expect(commandExperience(session, 'overview')).toBeNull();
  });
  it('client cannot gain Command access from flags', () => {
    Object.assign(process.env, { XEROWA_COMMAND_ENABLED: '1', XEROWA_FOUNDATION_ENABLED: '1', XEROWA_FOUNDATION_COMMAND: '1' });
    const session = { platformRole: 'client', activeBusinessId: null, memberships: [] } as unknown as AuthSession;
    expect(commandExperience(session, 'runs')).toBeNull();
  });
  it.each(['overview','runs','agents','approvals','businesses','system'] as const)('renders %s with truthful unavailable provenance', view => {
    const html = renderToStaticMarkup(<CommandWorkspace initialView={view} snapshot={unavailableCommand()} />);
    expect(html).toContain('Source unavailable'); expect(html).not.toContain('Synthetic review only');
    expect(html).not.toContain('Approve</button>'); expect(html).not.toContain('Pause all</button>');
  });
  it('Synthetic trace is persistently labelled and raw payload is collapsed', () => {
    const html = renderToStaticMarkup(<CommandWorkspace initialView="runs" snapshot={syntheticCommand()} />);
    expect(html).toContain('Synthetic · isolated review fixtures'); expect(html).toContain('Synthetic review only');
    expect(html).toContain('<details'); expect(html).not.toContain('<details open');
    expect(html).toContain('Inspect linked approval');
  });
  it.each(['loading','empty','partial','stale','denied','disconnected','error','unknown'] as EvidenceState[])('renders %s across all six sections without claiming successful source reads', state => {
    for (const view of ['overview','runs','agents','approvals','businesses','system'] as const) {
      const html = renderToStaticMarkup(<CommandWorkspace initialView={view} snapshot={{...syntheticCommand(),state}} />);
      expect(html).toContain(`data-state="${state}"`);
      expect(html).toContain('Synthetic · isolated review fixtures');
      if (['loading','empty','denied','disconnected','error','unknown'].includes(state)) expect(html).not.toContain('synthetic-run-gym');
    }
  });
});
