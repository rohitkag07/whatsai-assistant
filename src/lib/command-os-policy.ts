export type CommandOsMode = 'read_only' | 'supervised' | 'paused';
export type AgentControlStatus = 'enabled' | 'paused' | 'disabled';
export type AgentRiskLevel = 'L0' | 'L1' | 'L2' | 'L3' | 'L4';

export type AgentRunDecision =
  | { outcome: 'run'; reason: 'allowed' }
  | { outcome: 'approval'; reason: 'high_risk_requires_approval' }
  | {
      outcome: 'blocked';
      reason:
        | 'global_paused'
        | 'global_read_only'
        | 'agent_paused'
        | 'agent_disabled'
        | 'risk_ceiling_exceeded';
    };

const riskRank: Record<AgentRiskLevel, number> = {
  L0: 0,
  L1: 1,
  L2: 2,
  L3: 3,
  L4: 4,
};

export function evaluateAgentRun({
  globalMode,
  agentStatus,
  maxRiskLevel,
  requestedRiskLevel,
}: {
  globalMode: CommandOsMode;
  agentStatus: AgentControlStatus;
  maxRiskLevel: AgentRiskLevel;
  requestedRiskLevel: AgentRiskLevel;
}): AgentRunDecision {
  if (globalMode === 'paused') {
    return { outcome: 'blocked', reason: 'global_paused' };
  }
  if (agentStatus === 'disabled') {
    return { outcome: 'blocked', reason: 'agent_disabled' };
  }
  if (agentStatus === 'paused') {
    return { outcome: 'blocked', reason: 'agent_paused' };
  }
  if (riskRank[requestedRiskLevel] > riskRank[maxRiskLevel]) {
    return { outcome: 'blocked', reason: 'risk_ceiling_exceeded' };
  }
  if (globalMode === 'read_only' && requestedRiskLevel !== 'L0') {
    return { outcome: 'blocked', reason: 'global_read_only' };
  }
  if (requestedRiskLevel === 'L3' || requestedRiskLevel === 'L4') {
    return { outcome: 'approval', reason: 'high_risk_requires_approval' };
  }
  return { outcome: 'run', reason: 'allowed' };
}
