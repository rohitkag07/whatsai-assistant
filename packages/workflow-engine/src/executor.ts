import { randomUUID } from 'node:crypto';
import {
  type Action,
  type Guard,
  type Playbook,
  PlaybookSchema,
  type WorkflowContext,
} from './schema';

export type TransitionOutcome = 'applied' | 'rejected' | 'action_failed';

export interface GuardResult {
  readonly guard: Guard;
  readonly passed: boolean;
  readonly actual: unknown;
}

export interface ActionResult {
  readonly action: Action;
  readonly status: 'completed' | 'failed';
  readonly detail?: string;
}

export interface ImmutableTransitionLog {
  readonly id: string;
  readonly executionId: string;
  readonly tenantId: string;
  readonly conversationId: string | null;
  readonly playbookId: string;
  readonly playbookVersion: string;
  readonly transitionId: string | null;
  readonly event: string;
  readonly fromState: string;
  readonly toState: string;
  readonly outcome: TransitionOutcome;
  readonly guardResults: readonly GuardResult[];
  readonly actionResults: readonly ActionResult[];
  readonly contextSnapshot: WorkflowContext;
  readonly errorMessage: string | null;
  readonly createdAt: string;
}

export interface ExternalActionContext {
  readonly executionId: string;
  readonly actionIndex: number;
  readonly idempotencyKey: string;
  readonly tenantId: string;
  readonly conversationId: string | null;
  readonly playbookId: string;
  readonly transitionId: string;
  readonly event: string;
  readonly fromState: string;
  readonly toState: string;
  readonly context: WorkflowContext;
}

export interface AtomicTransitionCommit {
  readonly expectedState: string;
  readonly nextState: string;
  readonly log: ImmutableTransitionLog;
}

export interface WorkflowDependencies {
  executeExternalAction(
    action: Extract<
      Action,
      { type: 'emit_event' | 'schedule_follow_up' | 'escalate_owner' }
    >,
    context: ExternalActionContext,
  ): Promise<{ readonly detail?: string }>;

  /**
   * Implementations must compare-and-swap the conversation state and insert
   * `commit.log` in one database transaction. The log contains the complete,
   * ordered action results. The supplied executionId is the retry key.
   */
  commitTransition(commit: AtomicTransitionCommit): Promise<void>;
  now?: () => Date;
  createId?: () => string;
}

export interface ExecuteTransitionInput {
  readonly executionId?: string;
  readonly tenantId: string;
  readonly conversationId?: string | null;
  readonly playbook: Playbook | unknown;
  readonly currentState: string;
  readonly event: string;
  readonly context: WorkflowContext;
}

export type ExecuteTransitionResult =
  | {
      readonly accepted: true;
      readonly currentState: string;
      readonly nextState: string;
      readonly context: WorkflowContext;
      readonly log: ImmutableTransitionLog;
    }
  | {
      readonly accepted: false;
      readonly code:
        | 'unknown_state'
        | 'invalid_transition'
        | 'guard_rejected'
        | 'action_failed';
      readonly currentState: string;
      readonly nextState: string;
      readonly context: WorkflowContext;
      readonly log: ImmutableTransitionLog;
    };

export class WorkflowConfigurationError extends Error {
  readonly issues: readonly string[];

  constructor(issues: readonly string[]) {
    super(`Invalid workflow playbook: ${issues.join('; ')}`);
    this.name = 'WorkflowConfigurationError';
    this.issues = issues;
  }
}

function getPath(context: WorkflowContext, path: string): unknown {
  let current: unknown = context;

  for (const segment of path.split('.')) {
    if (
      typeof current !== 'object'
      || current === null
      || Array.isArray(current)
    ) {
      return undefined;
    }
    current = (current as Readonly<Record<string, unknown>>)[segment];
  }

  return current;
}

function evaluateGuard(guard: Guard, context: WorkflowContext): GuardResult {
  const actual = getPath(context, guard.field);

  switch (guard.type) {
    case 'field_present':
      return {
        guard,
        actual,
        passed: actual !== undefined && actual !== null && actual !== '',
      };
    case 'field_equals':
      return { guard, actual, passed: Object.is(actual, guard.value) };
    case 'number_gte':
      return {
        guard,
        actual,
        passed: typeof actual === 'number' && actual >= guard.value,
      };
    case 'boolean_is_true':
      return { guard, actual, passed: actual === true };
  }
}

function cloneContext(context: WorkflowContext): Record<string, unknown> {
  return structuredClone(context) as Record<string, unknown>;
}

function deepFreeze<T>(value: T): Readonly<T> {
  if (typeof value !== 'object' || value === null || Object.isFrozen(value)) {
    return value;
  }

  for (const child of Object.values(value as Record<string, unknown>)) {
    deepFreeze(child);
  }

  return Object.freeze(value);
}

function applyInternalAction(
  action: Extract<Action, { type: 'set_context' | 'append_tag' }>,
  context: Record<string, unknown>,
): string {
  if (action.type === 'set_context') {
    context[action.key] = action.value;
    return `Set ${action.key}`;
  }

  const currentTags = Array.isArray(context.tags)
    ? context.tags.filter((tag): tag is string => typeof tag === 'string')
    : [];
  context.tags = currentTags.includes(action.tag)
    ? currentTags
    : [...currentTags, action.tag];
  return `Added tag ${action.tag}`;
}

function freezeLog(
  log: ImmutableTransitionLog,
): ImmutableTransitionLog {
  return deepFreeze(structuredClone(log)) as ImmutableTransitionLog;
}

export async function executeTransition(
  input: ExecuteTransitionInput,
  dependencies: WorkflowDependencies,
): Promise<ExecuteTransitionResult> {
  const parsedPlaybook = PlaybookSchema.safeParse(input.playbook);
  if (!parsedPlaybook.success) {
    throw new WorkflowConfigurationError(
      parsedPlaybook.error.issues.map((issue) => issue.message),
    );
  }

  const playbook = parsedPlaybook.data;
  const now = dependencies.now ?? (() => new Date());
  const createId = dependencies.createId ?? randomUUID;
  const executionId = input.executionId ?? createId();
  const conversationId = input.conversationId ?? null;
  const currentState = playbook.states.find(
    (state) => state.id === input.currentState,
  );

  const persistRejection = async (
    code: Extract<
      ExecuteTransitionResult,
      { accepted: false }
    >['code'],
    errorMessage: string,
    guardResults: readonly GuardResult[] = [],
    actionResults: readonly ActionResult[] = [],
    outcome: TransitionOutcome = 'rejected',
    transitionId: string | null = null,
  ): Promise<Extract<ExecuteTransitionResult, { accepted: false }>> => {
    const log = freezeLog({
      id: createId(),
      executionId,
      tenantId: input.tenantId,
      conversationId,
      playbookId: playbook.id,
      playbookVersion: playbook.version,
      transitionId,
      event: input.event,
      fromState: input.currentState,
      toState: input.currentState,
      outcome,
      guardResults,
      actionResults,
      contextSnapshot: input.context,
      errorMessage,
      createdAt: now().toISOString(),
    });
    await dependencies.commitTransition({
      expectedState: input.currentState,
      nextState: input.currentState,
      log,
    });

    return {
      accepted: false,
      code,
      currentState: input.currentState,
      nextState: input.currentState,
      context: input.context,
      log,
    };
  };

  if (!currentState) {
    return persistRejection(
      'unknown_state',
      `State ${input.currentState} does not exist in playbook ${playbook.id}`,
    );
  }

  const transition = currentState.transitions.find(
    (candidate) => candidate.event === input.event,
  );
  if (!transition) {
    return persistRejection(
      'invalid_transition',
      `Event ${input.event} is not allowed from state ${input.currentState}`,
    );
  }

  const guardResults = transition.guards.map((guard) =>
    evaluateGuard(guard, input.context),
  );
  if (guardResults.some((result) => !result.passed)) {
    return persistRejection(
      'guard_rejected',
      `One or more guards rejected transition ${transition.id}`,
      guardResults,
      [],
      'rejected',
      transition.id,
    );
  }

  const nextContext = cloneContext(input.context);
  const actionResults: ActionResult[] = [];

  for (const [actionIndex, action] of transition.actions.entries()) {
    try {
      if (action.type === 'set_context' || action.type === 'append_tag') {
        const detail = applyInternalAction(action, nextContext);
        actionResults.push({ action, status: 'completed', detail });
      } else {
        const result = await dependencies.executeExternalAction(action, {
          executionId,
          actionIndex,
          idempotencyKey: `${executionId}:${actionIndex}`,
          tenantId: input.tenantId,
          conversationId,
          playbookId: playbook.id,
          transitionId: transition.id,
          event: input.event,
          fromState: input.currentState,
          toState: transition.to,
          context: deepFreeze(cloneContext(nextContext)),
        });
        actionResults.push({
          action,
          status: 'completed',
          detail: result.detail,
        });
      }
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Unknown action failure';
      actionResults.push({
        action,
        status: 'failed',
        detail: message,
      });
      return persistRejection(
        'action_failed',
        message,
        guardResults,
        actionResults,
        'action_failed',
        transition.id,
      );
    }
  }

  const immutableContext = deepFreeze(cloneContext(nextContext));
  const log = freezeLog({
    id: createId(),
    executionId,
    tenantId: input.tenantId,
    conversationId,
    playbookId: playbook.id,
    playbookVersion: playbook.version,
    transitionId: transition.id,
    event: input.event,
    fromState: input.currentState,
    toState: transition.to,
    outcome: 'applied',
    guardResults,
    actionResults,
    contextSnapshot: immutableContext,
    errorMessage: null,
    createdAt: now().toISOString(),
  });

  await dependencies.commitTransition({
    expectedState: input.currentState,
    nextState: transition.to,
    log,
  });

  return {
    accepted: true,
    currentState: input.currentState,
    nextState: transition.to,
    context: immutableContext,
    log,
  };
}
