import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import {
  type AtomicTransitionCommit,
  executeTransition,
  type WorkflowDependencies,
} from './executor';
import { PlaybookSchema, type Playbook } from './schema';

function loadPlaybook(name: 'dental' | 'real_estate'): Playbook {
  const path = resolve(
    process.cwd(),
    `packages/workflow-engine/src/playbooks/${name}.json`,
  );
  return PlaybookSchema.parse(JSON.parse(readFileSync(path, 'utf8')));
}

function createDependencies(
  commits: AtomicTransitionCommit[],
): WorkflowDependencies {
  return {
    executeExternalAction: vi.fn().mockResolvedValue({
      detail: 'dispatched',
    }),
    commitTransition: vi.fn(async (commit: AtomicTransitionCommit) => {
      commits.push(commit);
    }),
    now: () => new Date('2026-08-06T00:00:00.000Z'),
    createId: vi
      .fn()
      .mockReturnValueOnce('execution-id')
      .mockReturnValue('transition-log-id'),
  };
}

describe('workflow playbooks', () => {
  it('validates the production dental and real-estate playbooks', () => {
    expect(loadPlaybook('dental').id).toBe('dental-care');
    expect(loadPlaybook('real_estate').id).toBe('real-estate-sales');
  });

  it('rejects ambiguous transitions at schema validation time', () => {
    const playbook = loadPlaybook('dental');
    const duplicateTransition = playbook.states[0]?.transitions[0];
    expect(duplicateTransition).toBeDefined();

    const invalid = {
      ...playbook,
      states: playbook.states.map((state, index) =>
        index === 0 && duplicateTransition
          ? {
              ...state,
              transitions: [
                ...state.transitions,
                { ...duplicateTransition, id: 'duplicate-event' },
              ],
            }
          : state,
      ),
    };

    expect(PlaybookSchema.safeParse(invalid).success).toBe(false);
  });
});

describe('executeTransition', () => {
  it('rejects an invalid event and atomically records the rejection', async () => {
    const commits: AtomicTransitionCommit[] = [];
    const dependencies = createDependencies(commits);

    const result = await executeTransition(
      {
        tenantId: 'tenant-a',
        conversationId: 'conversation-a',
        playbook: loadPlaybook('real_estate'),
        currentState: 'new',
        event: 'site_visit_requested',
        context: { contact: { phone: '+919999999999' } },
      },
      dependencies,
    );

    expect(result.accepted).toBe(false);
    expect(result.nextState).toBe('new');
    expect(result.log.outcome).toBe('rejected');
    expect(dependencies.executeExternalAction).not.toHaveBeenCalled();
    expect(commits).toHaveLength(1);
    expect(commits[0]).toMatchObject({
      expectedState: 'new',
      nextState: 'new',
    });
  });

  it('rejects a valid event when its guards fail', async () => {
    const commits: AtomicTransitionCommit[] = [];
    const dependencies = createDependencies(commits);

    const result = await executeTransition(
      {
        tenantId: 'tenant-a',
        playbook: loadPlaybook('real_estate'),
        currentState: 'qualifying',
        event: 'qualification_completed',
        context: { explicitIntent: true, leadScore: 30 },
      },
      dependencies,
    );

    expect(result.accepted).toBe(false);
    if (!result.accepted) {
      expect(result.code).toBe('guard_rejected');
    }
    expect(result.nextState).toBe('qualifying');
    expect(dependencies.executeExternalAction).not.toHaveBeenCalled();
    expect(commits[0]?.log.guardResults.some((item) => !item.passed)).toBe(
      true,
    );
  });

  it('commits state and complete action results through one atomic boundary', async () => {
    const commits: AtomicTransitionCommit[] = [];
    const dependencies = createDependencies(commits);

    const result = await executeTransition(
      {
        executionId: 'delivery-attempt-1',
        tenantId: 'tenant-a',
        conversationId: 'conversation-a',
        playbook: loadPlaybook('real_estate'),
        currentState: 'qualifying',
        event: 'qualification_completed',
        context: {
          explicitIntent: true,
          leadScore: 82,
          tags: [],
          nested: { source: 'meta' },
        },
      },
      dependencies,
    );

    expect(result.accepted).toBe(true);
    expect(result.nextState).toBe('qualified');
    expect(result.context).toMatchObject({
      stage: 'qualified',
      tags: ['qualified'],
    });
    expect(commits).toHaveLength(1);
    expect(commits[0]).toMatchObject({
      expectedState: 'qualifying',
      nextState: 'qualified',
      log: {
        executionId: 'delivery-attempt-1',
        outcome: 'applied',
      },
    });
    expect(commits[0]?.log.actionResults).toHaveLength(3);

    const externalContext = vi.mocked(
      dependencies.executeExternalAction,
    ).mock.calls[0]?.[1];
    expect(externalContext).toMatchObject({
      executionId: 'delivery-attempt-1',
      actionIndex: 2,
      idempotencyKey: 'delivery-attempt-1:2',
    });

    expect(Object.isFrozen(result.log)).toBe(true);
    expect(Object.isFrozen(result.log.actionResults)).toBe(true);
    expect(Object.isFrozen(result.context)).toBe(true);
    expect(Object.isFrozen(result.context.nested)).toBe(true);
  });

  it('keeps current state and records action failure atomically', async () => {
    const commits: AtomicTransitionCommit[] = [];
    const dependencies = createDependencies(commits);
    vi.mocked(dependencies.executeExternalAction).mockRejectedValueOnce(
      new Error('gateway unavailable'),
    );

    const result = await executeTransition(
      {
        executionId: 'handoff-attempt-1',
        tenantId: 'tenant-a',
        conversationId: 'conversation-a',
        playbook: loadPlaybook('real_estate'),
        currentState: 'qualified',
        event: 'human_handoff_requested',
        context: { leadScore: 90 },
      },
      dependencies,
    );

    expect(result.accepted).toBe(false);
    if (!result.accepted) {
      expect(result.code).toBe('action_failed');
    }
    expect(result.nextState).toBe('qualified');
    expect(commits[0]).toMatchObject({
      expectedState: 'qualified',
      nextState: 'qualified',
      log: {
        outcome: 'action_failed',
        errorMessage: 'gateway unavailable',
      },
    });
    expect(commits[0]?.log.actionResults[0]).toMatchObject({
      status: 'failed',
      detail: 'gateway unavailable',
    });
  });

  it('does not report success when the atomic database commit fails', async () => {
    const dependencies = createDependencies([]);
    vi.mocked(dependencies.commitTransition).mockRejectedValueOnce(
      new Error('serialization failure'),
    );

    await expect(
      executeTransition(
        {
          tenantId: 'tenant-a',
          conversationId: 'conversation-a',
          playbook: loadPlaybook('real_estate'),
          currentState: 'qualifying',
          event: 'qualification_completed',
          context: { explicitIntent: true, leadScore: 82 },
        },
        dependencies,
      ),
    ).rejects.toThrow('serialization failure');
  });
});
