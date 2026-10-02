import { supportedAgents, scopedSnapshot, type CommandSnapshot, type CommandApproval } from './model';

export function syntheticCommand(): CommandSnapshot {
  const approvals: CommandApproval[] = ['pending', 'changed', 'expired', 'revoked', 'executed', 'denied'].map((status, index) => ({
    id: `synthetic-approval-${index}`, businessId: 'xerowa-test-gym', runId: 'synthetic-run-gym', title: `${status === 'pending' ? 'Review configuration proposal' : 'Configuration review'} · ${status}`, status: status as CommandApproval['status'], risk: 'L2 · configuration only', hash: `synthetic-hash-${index}`, approvedHash: status === 'changed' ? 'synthetic-prior-hash' : null, expiresAt: status === 'expired' ? '2026-09-30T10:00:00Z' : '2026-10-03T10:00:00Z', reason: 'Owner review is bound to the exact version. This fixture grants no authority.', impact: 'Proposed qualification routing only; no messaging or activation.', rollback: 'Retain the prior published pointer after an authorized compensating command.', before: 'Unassigned handoff', after: 'Dedicated operator handoff',
  }));
  return scopedSnapshot({
    source: 'Synthetic', state: 'ready', observedAt: '2026-10-02T10:00:00Z',
    businesses: [
      { id: 'xerowa-test-gym', name: 'xerowa-test-gym', channel: 'Disconnected · no provider credentials', configuration: 'Synthetic version 3 · proposal', health: 'Needs review · fixture incident' },
      { id: 'xerowa-test-real-estate', name: 'xerowa-test-real-estate · संकल्प regional sales operations', channel: 'Disconnected · no provider credentials', configuration: 'Synthetic version 2 · draft', health: 'Unknown · no health observation' },
    ],
    runs: [
      { id: 'synthetic-run-gym', businessId: 'xerowa-test-gym', title: 'Configuration handoff requires owner review', state: 'Waiting for approval', policy: 'Synthetic policy · owner approval required for version 3', approvalId: 'synthetic-approval-0', receipt: null, retries: 0, recovery: 'Inspect the proposed payload and expiry. Request a fresh hash-bound owner decision; never treat this preview as approval.', steps: [
        { title: 'Request received', actor: 'Synthetic owner', state: 'Recorded', at: '10:00:00.000', latencyMs: 0, summary: 'Configuration version proposed.', evidence: 'Synthetic request · request-gym-3' },
        { title: 'Business verified', actor: 'Membership guard', state: 'Synthetic assertion', at: '10:00:00.014', latencyMs: 14, summary: 'Business scope belongs to the Gym fixture.', evidence: 'Synthetic membership · not live RLS proof' },
        { title: 'Policy checked', actor: 'Configuration authority', state: 'Waiting for human', at: '10:00:00.023', latencyMs: 9, summary: 'Owner approval must match the version hash.', evidence: 'Synthetic policy · version 3' },
        { title: 'Publication receipt', actor: 'Command receipt authority', state: 'Unknown', at: null, latencyMs: null, summary: 'No published pointer or execution receipt exists in this fixture.', evidence: null },
        { title: 'Result reconciled', actor: 'Operator', state: 'Not executed', at: null, latencyMs: null, summary: 'No activation, send or customer outcome.', evidence: null },
      ] },
      { id: 'synthetic-run-estate', businessId: 'xerowa-test-real-estate', title: 'Handoff read has incomplete evidence', state: 'Outcome unknown', policy: 'Synthetic policy · fail closed on missing receipt', approvalId: null, receipt: null, retries: 1, recovery: 'Reconcile the original command receipt before any retry. Provider commitment is unknown; do not issue a new send.', steps: [
        { title: 'Handoff requested', actor: 'Synthetic operator', state: 'Recorded', at: '09:58:00.000', latencyMs: 0, summary: 'Owner assignment requested in a simulated trace.', evidence: 'Synthetic request · estate-1' },
        { title: 'Receipt lookup', actor: 'Tool Gateway', state: 'Unavailable', at: '09:58:00.200', latencyMs: 200, summary: 'Simulated read timeout. Failure of a read is not failure of an external action.', evidence: null },
        { title: 'Reconciliation', actor: 'Operator', state: 'Outcome unknown', at: null, latencyMs: null, summary: 'External commitment is unverified.', evidence: null },
      ] },
    ],
    approvals,
    incidents: [
      { id: 'synthetic-incident-gym', businessId: 'xerowa-test-gym', runId: 'synthetic-run-gym', title: 'Owner approval required', severity: 'attention', status: 'acknowledged', cause: 'Policy boundary' },
      { id: 'synthetic-incident-estate', businessId: 'xerowa-test-real-estate', runId: 'synthetic-run-estate', title: 'Receipt unavailable; outcome unknown', severity: 'critical', status: 'unacknowledged', cause: 'Evidence retrieval' },
    ],
    agents: supportedAgents(),
  }, ['xerowa-test-gym', 'xerowa-test-real-estate']);
}
