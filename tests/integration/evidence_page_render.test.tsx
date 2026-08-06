import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { ClientOneEvidence } from '../../src/lib/evidence-metrics';
import { ClientOneEvidenceView } from '../../src/components/evidence/client-one-evidence-view';

function metric(
  current: number | null,
  previous: number | null,
  sampleSize: number,
  previousSampleSize: number,
): ClientOneEvidence['metrics']['processingLatencyMs'] {
  return {
    current,
    previous,
    sampleSize,
    previousSampleSize,
    delta:
      current === null || previous === null
        ? null
        : current - previous,
  };
}

function evidenceFixture(): ClientOneEvidence {
  return {
    status: 'ready',
    generatedAt: '2026-08-06T10:00:00.000Z',
    period: {
      currentStart: '2026-07-07T10:00:00.000Z',
      previousStart: '2026-06-07T10:00:00.000Z',
      currentEnd: '2026-08-06T10:00:00.000Z',
    },
    metrics: {
      processingLatencyMs: metric(1_200, 1_800, 100, 80),
      deliveryRatePercent: metric(99.5, 96, 200, 175),
      qualifiedLeadRatePercent: metric(42, 35, 50, 40),
    },
    targets: {
      processingLatencyMs: 3_000,
      deliveryRatePercent: 99,
    },
    messageSource: 'tenant_messages',
    errors: [],
  };
}

describe('ClientOneEvidenceView', () => {
  it('renders tenant baseline metrics when Client #1 is configured', () => {
    const previousTenantId = process.env.XEROWA_CLIENT_1_TENANT_ID;
    process.env.XEROWA_CLIENT_1_TENANT_ID = 'tenant-client-1';

    try {
      const html = renderToStaticMarkup(
        <ClientOneEvidenceView evidence={evidenceFixture()} />,
      );

      expect(html).toContain('Client #1 Evidence');
      expect(html).toContain('1.20s');
      expect(html).toContain('99.5%');
      expect(html).toContain('42.0%');
      expect(html).toContain('1.80s');
      expect(html).toContain('96.0%');
      expect(html).toContain('Target met');
    } finally {
      if (previousTenantId === undefined) {
        delete process.env.XEROWA_CLIENT_1_TENANT_ID;
      } else {
        process.env.XEROWA_CLIENT_1_TENANT_ID = previousTenantId;
      }
    }
  });

  it('renders missing samples without throwing or inventing metrics', () => {
    const fixture = evidenceFixture();
    const html = renderToStaticMarkup(
      <ClientOneEvidenceView
        evidence={{
          ...fixture,
          metrics: {
            processingLatencyMs: metric(null, null, 0, 0),
            deliveryRatePercent: metric(null, null, 0, 0),
            qualifiedLeadRatePercent: metric(null, null, 0, 0),
          },
        }}
      />,
    );

    expect(html).toContain('No data');
    expect(html).toContain('No prior baseline');
  });
});
