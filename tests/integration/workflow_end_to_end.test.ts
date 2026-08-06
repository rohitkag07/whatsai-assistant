import { createHmac } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import {
  claimWebhookEvent,
  type WebhookEventsClient,
} from '../../apps/webhook-api/src/idempotency';
import { parseMetaTextMessage } from '../../apps/webhook-api/src/parse-meta-message';
import {
  resolveWebhookTenant,
  type RlsTenantDirectory,
} from '../../apps/webhook-api/src/resolve-tenant';
import { verifyMetaSignature } from '../../apps/webhook-api/src/verify-signature';
import {
  escalateHotLead,
  type OwnerAlert,
  type OwnerAlertGateway,
} from '../../packages/escalation-engine/src/escalate';
import { calculateLeadScore } from '../../packages/lead-scoring/src/calculator';
import {
  executeTransition,
  type ImmutableTransitionLog,
  type WorkflowDependencies,
} from '../../packages/workflow-engine/src/executor';
import {
  PlaybookSchema,
  type Playbook,
} from '../../packages/workflow-engine/src/schema';

function loadRealEstatePlaybook(): Playbook {
  const playbookPath = resolve(
    process.cwd(),
    'packages/workflow-engine/src/playbooks/real_estate.json',
  );
  const parsedJson: unknown = JSON.parse(readFileSync(playbookPath, 'utf8'));
  return PlaybookSchema.parse(parsedJson);
}

describe('Meta webhook to hot-lead owner escalation', () => {
  it('executes the complete tenant-safe workflow with a ten-minute SLA', async () => {
    const appSecret = 'integration-app-secret';
    const payload = {
      entry: [
        {
          changes: [
            {
              value: {
                metadata: { phone_number_id: 'meta-phone-tenant-a' },
                contacts: [
                  {
                    wa_id: '919999999999',
                    profile: { name: 'Aarav' },
                  },
                ],
                messages: [
                  {
                    id: 'wamid.integration-1',
                    from: '919999999999',
                    timestamp: '1785981600',
                    type: 'text',
                    text: {
                      body: 'Indore me plot chahiye, kal site visit book karo',
                    },
                  },
                ],
              },
            },
          ],
        },
      ],
    };
    const rawBody = Buffer.from(JSON.stringify(payload), 'utf8');
    const signature = `sha256=${createHmac('sha256', appSecret)
      .update(rawBody)
      .digest('hex')}`;

    expect(verifyMetaSignature(rawBody, signature, appSecret)).toBe(true);
    const message = parseMetaTextMessage(rawBody);
    expect(message.eventId).toBe('wamid.integration-1');

    const webhookInsert = vi.fn().mockResolvedValue({ error: null });
    const webhookClient: WebhookEventsClient = {
      from: vi.fn(() => ({ insert: webhookInsert })),
    };
    await expect(
      claimWebhookEvent(webhookClient, {
        eventId: message.eventId,
        rawBody,
        eventType: 'messages',
      }),
    ).resolves.toEqual({
      claimed: true,
      eventId: 'wamid.integration-1',
    });

    const tenantDirectory: RlsTenantDirectory = {
      findAccessibleTenantByPhoneNumberId: vi.fn(async (phoneNumberId) =>
        phoneNumberId === 'meta-phone-tenant-a'
          ? {
              tenantId: 'tenant-a',
              ownerId: 'owner-a',
              phoneNumberId,
            }
          : null,
      ),
    };
    const tenantRoute = await resolveWebhookTenant(
      tenantDirectory,
      message.phoneNumberId,
    );
    expect(tenantRoute.tenantId).toBe('tenant-a');

    const logs: ImmutableTransitionLog[] = [];
    const externalActions: string[] = [];
    const workflowDependencies: WorkflowDependencies = {
      executeExternalAction: vi.fn(async (action) => {
        externalActions.push(action.type);
        return { detail: 'accepted by integration adapter' };
      }),
      commitTransition: vi.fn(async (commit) => {
        logs.push(commit.log);
      }),
      now: () => new Date('2026-08-06T10:00:00.000Z'),
      createId: () => `workflow-log-${logs.length + 1}`,
    };
    const playbook = loadRealEstatePlaybook();

    const started = await executeTransition(
      {
        tenantId: tenantRoute.tenantId,
        conversationId: message.eventId,
        playbook,
        currentState: playbook.initialState,
        event: 'message_received',
        context: {
          contact: { phone: message.contactPhone },
          messageBody: message.body,
        },
      },
      workflowDependencies,
    );
    expect(started.accepted).toBe(true);
    expect(started.nextState).toBe('qualifying');

    const score = calculateLeadScore({
      explicitIntent: true,
      explicitSiteVisitRequested: true,
      completeness: {
        name: message.contactName,
        phone: message.contactPhone,
        requirement: 'plot',
        location: 'Indore',
        timeline: 'immediate',
      },
      urgency: 'immediate',
      budgetFit: 'within_range',
    });
    expect(score.score).toBe(100);

    const qualified = await executeTransition(
      {
        tenantId: tenantRoute.tenantId,
        conversationId: message.eventId,
        playbook,
        currentState: started.nextState,
        event: 'qualification_completed',
        context: {
          ...started.context,
          explicitIntent: true,
          leadScore: score.score,
        },
      },
      workflowDependencies,
    );
    expect(qualified.accepted).toBe(true);
    expect(qualified.nextState).toBe('qualified');

    const visitScheduled = await executeTransition(
      {
        tenantId: tenantRoute.tenantId,
        conversationId: message.eventId,
        playbook,
        currentState: qualified.nextState,
        event: 'site_visit_requested',
        context: {
          ...qualified.context,
          siteVisitRequested: true,
          appointmentId: 'appointment-a',
        },
      },
      workflowDependencies,
    );
    expect(visitScheduled.accepted).toBe(true);
    expect(visitScheduled.nextState).toBe('visit_scheduled');

    const alerts: OwnerAlert[] = [];
    const alertGateway: OwnerAlertGateway = {
      sendOwnerAlert: vi.fn(async (alert) => {
        alerts.push(alert);
        return {
          deliveryId: 'tool-gateway-delivery-1',
          acceptedAt: '2026-08-06T10:00:00.000Z',
        };
      }),
    };
    const escalation = await escalateHotLead(
      {
        tenantId: tenantRoute.tenantId,
        leadId: 'lead-a',
        ownerId: tenantRoute.ownerId,
        contactName: message.contactName,
        contactPhone: message.contactPhone,
        score: score.score,
        scoreReasons: score.reasons,
        explicitSiteVisitRequested: true,
        summary: message.body,
      },
      alertGateway,
      () => new Date('2026-08-06T10:00:00.000Z'),
    );

    expect(escalation).toEqual({
      escalated: true,
      reason: 'site_visit_requested',
      deliveryId: 'tool-gateway-delivery-1',
      respondBy: '2026-08-06T10:10:00.000Z',
    });
    expect(alerts).toHaveLength(1);
    expect(alerts[0]?.responseSlaMinutes).toBe(10);
    expect(logs.map((log) => log.outcome)).toEqual([
      'applied',
      'applied',
      'applied',
    ]);
    expect(externalActions).toEqual([
      'emit_event',
      'emit_event',
      'escalate_owner',
      'schedule_follow_up',
    ]);
  });
});
