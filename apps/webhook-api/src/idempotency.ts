import { createHash } from 'node:crypto';
import type { RawWebhookBody } from './verify-signature';

const POSTGRES_UNIQUE_VIOLATION = '23505';

export interface WebhookDatabaseError {
  readonly code: string;
  readonly message: string;
  readonly details?: string;
  readonly hint?: string;
}

interface WebhookInsertResult {
  readonly error: WebhookDatabaseError | null;
}

interface WebhookInsertBuilder {
  insert(values: WebhookEventInsert): PromiseLike<WebhookInsertResult>;
}

export interface WebhookEventsClient {
  from(table: 'webhook_events'): WebhookInsertBuilder;
}

export interface WebhookEventInsert {
  readonly event_id: string;
  readonly tenant_id: string | null;
  readonly provider: string;
  readonly event_type: string | null;
  readonly payload_sha256: string;
  readonly processing_status: 'claimed';
}

export interface ClaimWebhookInput {
  readonly eventId: string;
  readonly tenantId?: string | null;
  readonly provider?: string;
  readonly eventType?: string | null;
  readonly rawBody: RawWebhookBody;
}

export type ClaimWebhookResult =
  | { readonly claimed: true; readonly eventId: string }
  | {
      readonly claimed: false;
      readonly eventId: string;
      readonly reason: 'duplicate';
    };

export class WebhookClaimError extends Error {
  readonly code: string;

  constructor(error: WebhookDatabaseError) {
    super(`Unable to claim webhook event: ${error.message}`);
    this.name = 'WebhookClaimError';
    this.code = error.code;
  }
}

export async function claimWebhookEvent(
  client: WebhookEventsClient,
  input: ClaimWebhookInput,
): Promise<ClaimWebhookResult> {
  if (input.eventId.trim().length === 0) {
    throw new Error('eventId is required for webhook idempotency');
  }

  const payloadSha256 = createHash('sha256')
    .update(input.rawBody)
    .digest('hex');
  const result = await client.from('webhook_events').insert({
    event_id: input.eventId,
    tenant_id: input.tenantId ?? null,
    provider: input.provider ?? 'meta',
    event_type: input.eventType ?? null,
    payload_sha256: payloadSha256,
    processing_status: 'claimed',
  });

  if (!result.error) {
    return { claimed: true, eventId: input.eventId };
  }

  if (result.error.code === POSTGRES_UNIQUE_VIOLATION) {
    return {
      claimed: false,
      eventId: input.eventId,
      reason: 'duplicate',
    };
  }

  throw new WebhookClaimError(result.error);
}
