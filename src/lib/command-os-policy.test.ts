import { expect, test } from 'vitest';
import { evaluateAgentRun } from './command-os-policy.ts';

test('paused global mode blocks every agent run', () => {
  expect(
    evaluateAgentRun({
      globalMode: 'paused',
      agentStatus: 'enabled',
      maxRiskLevel: 'L4',
      requestedRiskLevel: 'L0',
    }),
  ).toEqual({ outcome: 'blocked', reason: 'global_paused' });
});

test('disabled or paused agents cannot run', () => {
  expect(
    evaluateAgentRun({
      globalMode: 'supervised',
      agentStatus: 'disabled',
      maxRiskLevel: 'L2',
      requestedRiskLevel: 'L0',
    }).outcome,
  ).toBe('blocked');
  expect(
    evaluateAgentRun({
      globalMode: 'supervised',
      agentStatus: 'paused',
      maxRiskLevel: 'L2',
      requestedRiskLevel: 'L0',
    }).reason,
  ).toBe('agent_paused');
});

test('risk above the agent ceiling is blocked', () => {
  expect(
    evaluateAgentRun({
      globalMode: 'supervised',
      agentStatus: 'enabled',
      maxRiskLevel: 'L1',
      requestedRiskLevel: 'L2',
    }),
  ).toEqual({ outcome: 'blocked', reason: 'risk_ceiling_exceeded' });
});

test('read-only mode permits only L0 checks', () => {
  expect(
    evaluateAgentRun({
      globalMode: 'read_only',
      agentStatus: 'enabled',
      maxRiskLevel: 'L2',
      requestedRiskLevel: 'L0',
    }).outcome,
  ).toBe('run');
  expect(
    evaluateAgentRun({
      globalMode: 'read_only',
      agentStatus: 'enabled',
      maxRiskLevel: 'L2',
      requestedRiskLevel: 'L1',
    }),
  ).toEqual({ outcome: 'blocked', reason: 'global_read_only' });
});

test('supervised L0-L2 runs safely while L3-L4 requires approval', () => {
  expect(
    evaluateAgentRun({
      globalMode: 'supervised',
      agentStatus: 'enabled',
      maxRiskLevel: 'L4',
      requestedRiskLevel: 'L2',
    }).outcome,
  ).toBe('run');
  expect(
    evaluateAgentRun({
      globalMode: 'supervised',
      agentStatus: 'enabled',
      maxRiskLevel: 'L4',
      requestedRiskLevel: 'L3',
    }),
  ).toEqual({ outcome: 'approval', reason: 'high_risk_requires_approval' });
});
