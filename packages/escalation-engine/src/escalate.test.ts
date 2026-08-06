import { describe, expect, it, vi } from 'vitest';
import {
  escalateHotLead,
  type OwnerAlertGateway,
  type OwnerEscalationInput,
} from './escalate';

const baseInput: OwnerEscalationInput = {
  tenantId: 'tenant-a',
  leadId: 'lead-a',
  ownerId: 'owner-a',
  contactName: 'Aarav',
  contactPhone: '+919999999999',
  score: 75,
  scoreReasons: ['Explicit intent'],
  explicitSiteVisitRequested: false,
  summary: 'Looking for a plot in Indore.',
};

function createGateway(): OwnerAlertGateway {
  return {
    sendOwnerAlert: vi.fn().mockResolvedValue({
      deliveryId: 'delivery-1',
      acceptedAt: '2026-08-06T00:00:00.000Z',
    }),
  };
}

describe('escalateHotLead', () => {
  it('does not escalate a score exactly at the strict >75 threshold', async () => {
    const gateway = createGateway();

    await expect(
      escalateHotLead(baseInput, gateway),
    ).resolves.toEqual({
      escalated: false,
      reason: 'below_threshold',
    });
    expect(gateway.sendOwnerAlert).not.toHaveBeenCalled();
  });

  it('escalates score 76 with an exact ten-minute owner SLA', async () => {
    const gateway = createGateway();

    const result = await escalateHotLead(
      { ...baseInput, score: 76 },
      gateway,
      () => new Date('2026-08-06T10:00:00.000Z'),
    );

    expect(result).toEqual({
      escalated: true,
      reason: 'hot_lead',
      deliveryId: 'delivery-1',
      respondBy: '2026-08-06T10:10:00.000Z',
    });
    expect(gateway.sendOwnerAlert).toHaveBeenCalledWith(
      expect.objectContaining({
        responseSlaMinutes: 10,
        respondBy: '2026-08-06T10:10:00.000Z',
      }),
    );
  });

  it('escalates an explicit site visit even when the score is below 76', async () => {
    const gateway = createGateway();

    const result = await escalateHotLead(
      {
        ...baseInput,
        score: 40,
        explicitSiteVisitRequested: true,
      },
      gateway,
      () => new Date('2026-08-06T10:00:00.000Z'),
    );

    expect(result.escalated).toBe(true);
    if (result.escalated) {
      expect(result.reason).toBe('site_visit_requested');
    }
  });

  it('rejects scores outside the 0-100 domain', async () => {
    await expect(
      escalateHotLead({ ...baseInput, score: 101 }, createGateway()),
    ).rejects.toBeInstanceOf(RangeError);
  });
});
