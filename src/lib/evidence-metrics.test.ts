import { describe, expect, it } from 'vitest';
import { buildClientOneMetrics } from './evidence-calculator';

describe('buildClientOneMetrics', () => {
  it('computes current and previous 30-day evidence without placeholder values', () => {
    const now = new Date('2026-08-06T00:00:00.000Z');
    const result = buildClientOneMetrics(
      [
        {
          direction: 'outbound',
          status: 'delivered',
          receivedAt: '2026-08-01T00:00:00.000Z',
          processedAt: '2026-08-01T00:00:02.000Z',
          createdAt: '2026-08-01T00:00:00.000Z',
        },
        {
          direction: 'outbound',
          status: 'failed',
          receivedAt: null,
          processedAt: null,
          createdAt: '2026-08-02T00:00:00.000Z',
        },
        {
          direction: 'outbound',
          status: 'delivered',
          receivedAt: '2026-06-20T00:00:00.000Z',
          processedAt: '2026-06-20T00:00:04.000Z',
          createdAt: '2026-06-20T00:00:00.000Z',
        },
      ],
      [
        { stage: 'qualified', createdAt: '2026-08-01T00:00:00.000Z' },
        { stage: 'new', createdAt: '2026-08-02T00:00:00.000Z' },
        { stage: 'new', createdAt: '2026-06-20T00:00:00.000Z' },
      ],
      [],
      now,
    );

    expect(result.metrics.processingLatencyMs).toMatchObject({
      current: 2_000,
      previous: 4_000,
      sampleSize: 1,
      previousSampleSize: 1,
      delta: -2_000,
    });
    expect(result.metrics.deliveryRatePercent.current).toBe(50);
    expect(result.metrics.deliveryRatePercent.previous).toBe(100);
    expect(result.metrics.qualifiedLeadRatePercent.current).toBe(50);
    expect(result.metrics.qualifiedLeadRatePercent.previous).toBe(0);
  });

  it('returns null metrics instead of fabricating evidence when samples are absent', () => {
    const result = buildClientOneMetrics(
      [],
      [],
      [],
      new Date('2026-08-06T00:00:00.000Z'),
    );

    expect(result.metrics.processingLatencyMs.current).toBeNull();
    expect(result.metrics.deliveryRatePercent.current).toBeNull();
    expect(result.metrics.qualifiedLeadRatePercent.current).toBeNull();
  });
});
