import { z } from 'zod';

const ScalarValueSchema = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.null(),
]);

export const GuardSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('field_present'),
    field: z.string().min(1),
  }),
  z.object({
    type: z.literal('field_equals'),
    field: z.string().min(1),
    value: ScalarValueSchema,
  }),
  z.object({
    type: z.literal('number_gte'),
    field: z.string().min(1),
    value: z.number().finite(),
  }),
  z.object({
    type: z.literal('boolean_is_true'),
    field: z.string().min(1),
  }),
]);

export const ActionSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('set_context'),
    key: z.string().min(1),
    value: ScalarValueSchema,
  }),
  z.object({
    type: z.literal('append_tag'),
    tag: z.string().min(1),
  }),
  z.object({
    type: z.literal('emit_event'),
    name: z.string().min(1),
    payload: z.record(z.unknown()).default({}),
  }),
  z.object({
    type: z.literal('schedule_follow_up'),
    delayMinutes: z.number().int().positive().max(43_200),
    reason: z.string().min(1),
  }),
  z.object({
    type: z.literal('escalate_owner'),
    reason: z.string().min(1),
    slaMinutes: z.number().int().positive().max(1_440).default(10),
  }),
]);

export const TransitionSchema = z.object({
  id: z.string().min(1),
  event: z.string().min(1),
  to: z.string().min(1),
  guards: z.array(GuardSchema).default([]),
  actions: z.array(ActionSchema).default([]),
});

export const StateSchema = z.object({
  id: z.string().min(1),
  terminal: z.boolean().default(false),
  transitions: z.array(TransitionSchema).default([]),
});

export const PlaybookSchema = z
  .object({
    schemaVersion: z.literal(1),
    id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    version: z.string().regex(/^\d+\.\d+\.\d+$/),
    vertical: z.string().min(1),
    name: z.string().min(1),
    initialState: z.string().min(1),
    states: z.array(StateSchema).min(1),
  })
  .superRefine((playbook, context) => {
    const stateIds = new Set<string>();

    for (const state of playbook.states) {
      if (stateIds.has(state.id)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['states'],
          message: `Duplicate state id: ${state.id}`,
        });
      }
      stateIds.add(state.id);

      const transitionEvents = new Set<string>();
      const transitionIds = new Set<string>();
      for (const transition of state.transitions) {
        if (transitionEvents.has(transition.event)) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['states', state.id, 'transitions'],
            message:
              `State ${state.id} has multiple transitions for event `
              + transition.event,
          });
        }
        transitionEvents.add(transition.event);

        if (transitionIds.has(transition.id)) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['states', state.id, 'transitions'],
            message:
              `State ${state.id} has duplicate transition id `
              + transition.id,
          });
        }
        transitionIds.add(transition.id);
      }
    }

    if (!stateIds.has(playbook.initialState)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['initialState'],
        message: `Initial state does not exist: ${playbook.initialState}`,
      });
    }

    for (const state of playbook.states) {
      for (const transition of state.transitions) {
        if (!stateIds.has(transition.to)) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: [
              'states',
              state.id,
              'transitions',
              transition.id,
              'to',
            ],
            message: `Transition target does not exist: ${transition.to}`,
          });
        }
      }
    }
  });

export type Guard = z.infer<typeof GuardSchema>;
export type Action = z.infer<typeof ActionSchema>;
export type Transition = z.infer<typeof TransitionSchema>;
export type WorkflowState = z.infer<typeof StateSchema>;
export type Playbook = z.infer<typeof PlaybookSchema>;
export type WorkflowContext = Readonly<Record<string, unknown>>;
