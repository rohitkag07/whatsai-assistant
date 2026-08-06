export type MessageStatus =
  | 'received'
  | 'queued'
  | 'sent'
  | 'delivered'
  | 'read'
  | 'failed';

export interface EvidenceMessageRecord {
  readonly direction: 'inbound' | 'outbound';
  readonly status: MessageStatus;
  readonly receivedAt: string | null;
  readonly processedAt: string | null;
  readonly createdAt: string;
}

export interface EvidenceWebhookRecord {
  readonly processingMs: number | null;
  readonly receivedAt: string;
}

export interface EvidenceLeadRecord {
  readonly stage: string;
  readonly createdAt: string;
}

export interface PeriodMetric {
  readonly current: number | null;
  readonly previous: number | null;
  readonly sampleSize: number;
  readonly previousSampleSize: number;
  readonly delta: number | null;
}

export interface ClientOneMetrics {
  readonly processingLatencyMs: PeriodMetric;
  readonly deliveryRatePercent: PeriodMetric;
  readonly qualifiedLeadRatePercent: PeriodMetric;
}

export interface EvidencePeriod {
  readonly currentStart: string;
  readonly previousStart: string;
  readonly currentEnd: string;
}

interface DatedRecord {
  readonly date: string;
}

export function emptyMetric(): PeriodMetric {
  return Object.freeze({
    current: null,
    previous: null,
    sampleSize: 0,
    previousSampleSize: 0,
    delta: null,
  });
}

export function emptyMetrics(): ClientOneMetrics {
  return Object.freeze({
    processingLatencyMs: emptyMetric(),
    deliveryRatePercent: emptyMetric(),
    qualifiedLeadRatePercent: emptyMetric(),
  });
}

function partitionPeriods<T extends DatedRecord>(
  records: readonly T[],
  currentStartMs: number,
  previousStartMs: number,
  currentEndMs: number,
): { readonly current: readonly T[]; readonly previous: readonly T[] } {
  const current: T[] = [];
  const previous: T[] = [];

  for (const record of records) {
    const timestamp = Date.parse(record.date);
    if (!Number.isFinite(timestamp)) continue;

    if (timestamp >= currentStartMs && timestamp <= currentEndMs) {
      current.push(record);
    } else if (timestamp >= previousStartMs && timestamp < currentStartMs) {
      previous.push(record);
    }
  }

  return { current, previous };
}

function percentile95(values: readonly number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((left, right) => left - right);
  const index = Math.max(0, Math.ceil(sorted.length * 0.95) - 1);
  return sorted[index] ?? null;
}

function rate(successes: number, total: number): number | null {
  if (total === 0) return null;
  return Number(((successes / total) * 100).toFixed(1));
}

function metric(
  current: number | null,
  previous: number | null,
  sampleSize: number,
  previousSampleSize: number,
): PeriodMetric {
  return Object.freeze({
    current,
    previous,
    sampleSize,
    previousSampleSize,
    delta:
      current === null || previous === null
        ? null
        : Number((current - previous).toFixed(1)),
  });
}

function latencySamples(
  messages: readonly EvidenceMessageRecord[],
  webhooks: readonly EvidenceWebhookRecord[],
): number[] {
  const samples: number[] = [];

  for (const message of messages) {
    if (!message.receivedAt || !message.processedAt) continue;
    const duration = Date.parse(message.processedAt) - Date.parse(message.receivedAt);
    if (Number.isFinite(duration) && duration >= 0) samples.push(duration);
  }
  for (const webhook of webhooks) {
    if (
      webhook.processingMs !== null
      && Number.isFinite(webhook.processingMs)
      && webhook.processingMs >= 0
    ) {
      samples.push(webhook.processingMs);
    }
  }

  return samples;
}

function deliveryRate(messages: readonly EvidenceMessageRecord[]): {
  readonly value: number | null;
  readonly sampleSize: number;
} {
  const eligible = messages.filter(
    (message) =>
      message.direction === 'outbound'
      && ['sent', 'delivered', 'read', 'failed'].includes(message.status),
  );
  const delivered = eligible.filter(
    (message) => message.status === 'delivered' || message.status === 'read',
  ).length;
  return { value: rate(delivered, eligible.length), sampleSize: eligible.length };
}

function qualifiedLeadRate(leads: readonly EvidenceLeadRecord[]): {
  readonly value: number | null;
  readonly sampleSize: number;
} {
  const qualifiedStages = new Set([
    'qualified',
    'visit_scheduled',
    'visited',
    'negotiation',
    'booked',
  ]);
  const qualified = leads.filter((lead) => qualifiedStages.has(lead.stage)).length;
  return { value: rate(qualified, leads.length), sampleSize: leads.length };
}

export function buildClientOneMetrics(
  messages: readonly EvidenceMessageRecord[],
  leads: readonly EvidenceLeadRecord[],
  webhooks: readonly EvidenceWebhookRecord[],
  now: Date,
): {
  readonly metrics: ClientOneMetrics;
  readonly period: EvidencePeriod;
} {
  const currentEndMs = now.getTime();
  const currentStartMs = currentEndMs - 30 * 86_400_000;
  const previousStartMs = currentStartMs - 30 * 86_400_000;

  const messagePeriods = partitionPeriods(
    messages.map((row) => ({ ...row, date: row.createdAt })),
    currentStartMs,
    previousStartMs,
    currentEndMs,
  );
  const webhookPeriods = partitionPeriods(
    webhooks.map((row) => ({ ...row, date: row.receivedAt })),
    currentStartMs,
    previousStartMs,
    currentEndMs,
  );
  const leadPeriods = partitionPeriods(
    leads.map((row) => ({ ...row, date: row.createdAt })),
    currentStartMs,
    previousStartMs,
    currentEndMs,
  );

  const currentLatency = latencySamples(
    messagePeriods.current,
    webhookPeriods.current,
  );
  const previousLatency = latencySamples(
    messagePeriods.previous,
    webhookPeriods.previous,
  );
  const currentDelivery = deliveryRate(messagePeriods.current);
  const previousDelivery = deliveryRate(messagePeriods.previous);
  const currentQualified = qualifiedLeadRate(leadPeriods.current);
  const previousQualified = qualifiedLeadRate(leadPeriods.previous);

  return {
    metrics: Object.freeze({
      processingLatencyMs: metric(
        percentile95(currentLatency),
        percentile95(previousLatency),
        currentLatency.length,
        previousLatency.length,
      ),
      deliveryRatePercent: metric(
        currentDelivery.value,
        previousDelivery.value,
        currentDelivery.sampleSize,
        previousDelivery.sampleSize,
      ),
      qualifiedLeadRatePercent: metric(
        currentQualified.value,
        previousQualified.value,
        currentQualified.sampleSize,
        previousQualified.sampleSize,
      ),
    }),
    period: Object.freeze({
      currentStart: new Date(currentStartMs).toISOString(),
      previousStart: new Date(previousStartMs).toISOString(),
      currentEnd: now.toISOString(),
    }),
  };
}
