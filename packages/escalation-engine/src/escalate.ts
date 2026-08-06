const HOT_LEAD_THRESHOLD = 75;
const OWNER_RESPONSE_SLA_MINUTES = 10;

export interface OwnerEscalationInput {
  readonly tenantId: string;
  readonly leadId: string;
  readonly ownerId: string;
  readonly contactName: string;
  readonly contactPhone: string;
  readonly score: number;
  readonly scoreReasons: readonly string[];
  readonly explicitSiteVisitRequested: boolean;
  readonly summary: string;
}
export interface OwnerAlert {
  readonly tenantId: string;
  readonly ownerId: string;
  readonly leadId: string;
  readonly priority: 'high';
  readonly reason: 'hot_lead' | 'site_visit_requested';
  readonly title: string;
  readonly body: string;
  readonly responseSlaMinutes: 10;
  readonly respondBy: string;
  readonly metadata: Readonly<{
    contactName: string;
    contactPhone: string;
    score: number;
    scoreReasons: readonly string[];
    explicitSiteVisitRequested: boolean;
  }>;
}

/**
 * Adapter implemented by the X7 Tool Gateway. Vendor-specific WhatsApp, SMS,
 * email, or push logic belongs behind this boundary.
 */
export interface OwnerAlertGateway {
  sendOwnerAlert(
    alert: OwnerAlert,
  ): Promise<{ readonly deliveryId: string; readonly acceptedAt: string }>;
}

export type EscalationResult =
  | {
      readonly escalated: false;
      readonly reason: 'below_threshold';
    }
  | {
      readonly escalated: true;
      readonly reason: 'hot_lead' | 'site_visit_requested';
      readonly deliveryId: string;
      readonly respondBy: string;
    };

export async function escalateHotLead(
  input: OwnerEscalationInput,
  gateway: OwnerAlertGateway,
  now: () => Date = () => new Date(),
): Promise<EscalationResult> {
  if (!Number.isFinite(input.score) || input.score < 0 || input.score > 100) {
    throw new RangeError('Lead score must be between 0 and 100');
  }

  const escalationReason = input.explicitSiteVisitRequested
    ? 'site_visit_requested'
    : input.score > HOT_LEAD_THRESHOLD
      ? 'hot_lead'
      : null;

  if (!escalationReason) {
    return Object.freeze({
      escalated: false,
      reason: 'below_threshold',
    });
  }

  const respondBy = new Date(
    now().getTime() + OWNER_RESPONSE_SLA_MINUTES * 60_000,
  ).toISOString();
  const alert: OwnerAlert = Object.freeze({
    tenantId: input.tenantId,
    ownerId: input.ownerId,
    leadId: input.leadId,
    priority: 'high',
    reason: escalationReason,
    title: escalationReason === 'site_visit_requested'
      ? 'Site visit request needs owner response'
      : `Hot lead scored ${input.score}/100`,
    body: `${input.contactName} (${input.contactPhone}): ${input.summary}`,
    responseSlaMinutes: OWNER_RESPONSE_SLA_MINUTES,
    respondBy,
    metadata: Object.freeze({
      contactName: input.contactName,
      contactPhone: input.contactPhone,
      score: input.score,
      scoreReasons: Object.freeze([...input.scoreReasons]),
      explicitSiteVisitRequested: input.explicitSiteVisitRequested,
    }),
  });
  const delivery = await gateway.sendOwnerAlert(alert);

  return Object.freeze({
    escalated: true,
    reason: escalationReason,
    deliveryId: delivery.deliveryId,
    respondBy,
  });
}
