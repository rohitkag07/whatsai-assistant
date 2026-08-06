import { describe, expect, it } from 'vitest';
import { calculateLeadScore } from './calculator';

describe('calculateLeadScore', () => {
  it('returns a transparent 0 score for an empty, unknown lead', () => {
    const result = calculateLeadScore({
      explicitIntent: false,
      completeness: {},
      urgency: 'unknown',
      budgetFit: 'outside_range',
    });

    expect(result.score).toBe(0);
    expect(result.breakdown).toEqual({
      explicitIntent: 0,
      completeness: 0,
      urgency: 0,
      budgetFit: 0,
    });
    expect(result.reasons).toHaveLength(4);
  });

  it('returns 100 for a complete, urgent, budget-fit site visit lead', () => {
    const result = calculateLeadScore({
      explicitIntent: true,
      explicitSiteVisitRequested: true,
      completeness: {
        name: 'Aarav',
        phone: '+919999999999',
        requirement: '3 BHK',
        location: 'Indore',
        timeline: 'Immediate',
      },
      urgency: 'immediate',
      budgetFit: 'within_range',
    });

    expect(result.score).toBe(100);
    expect(result.breakdown.completeness).toBe(25);
    expect(Object.isFrozen(result)).toBe(true);
    expect(Object.isFrozen(result.reasons)).toBe(true);
  });

  it('scores partial completeness field-by-field without guessing', () => {
    const result = calculateLeadScore({
      explicitIntent: true,
      completeness: {
        name: 'Aarav',
        phone: '   ',
        requirement: 'Plot',
      },
      urgency: 'within_90_days',
      budgetFit: 'unknown',
    });

    expect(result.score).toBe(51);
    expect(result.breakdown.completeness).toBe(10);
  });
});
