import { createHmac } from 'node:crypto';
import { describe, expect, it, vi } from 'vitest';
import {
  claimWebhookEvent,
  WebhookClaimError,
  type WebhookEventsClient,
} from './idempotency';
import { verifyMetaSignature } from './verify-signature';

describe('verifyMetaSignature', () => {
  const secret = 'test-app-secret';
  const rawBody = Buffer.from('{"entry":[{"id":"event-1"}]}', 'utf8');

  it('accepts a valid sha256 signature for the exact raw body', () => {
    const digest = createHmac('sha256', secret).update(rawBody).digest('hex');
    expect(verifyMetaSignature(rawBody, `sha256=${digest}`, secret)).toBe(
      true,
    );
  });

  it('rejects tampered payloads and malformed signatures', () => {
    const digest = createHmac('sha256', secret).update(rawBody).digest('hex');
    expect(
      verifyMetaSignature(Buffer.from('tampered'), `sha256=${digest}`, secret),
    ).toBe(false);
    expect(verifyMetaSignature(rawBody, 'sha1=bad', secret)).toBe(false);
    expect(verifyMetaSignature(rawBody, 'sha256=xyz', secret)).toBe(false);
    expect(verifyMetaSignature(rawBody, null, secret)).toBe(false);
  });
});

function createClient(
  error: { readonly code: string; readonly message: string } | null,
): {
  readonly client: WebhookEventsClient;
  readonly insert: ReturnType<typeof vi.fn>;
} {
  const insert = vi.fn().mockResolvedValue({ error });
  return {
    client: {
      from: vi.fn(() => ({ insert })),
    },
    insert,
  };
}

describe('claimWebhookEvent', () => {
  it('claims a new event with a deterministic payload hash', async () => {
    const { client, insert } = createClient(null);
    const result = await claimWebhookEvent(client, {
      eventId: 'wamid.event-1',
      tenantId: 'tenant-a',
      eventType: 'messages',
      rawBody: '{"message":"hello"}',
    });

    expect(result).toEqual({ claimed: true, eventId: 'wamid.event-1' });
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        event_id: 'wamid.event-1',
        tenant_id: 'tenant-a',
        payload_sha256: expect.stringMatching(/^[a-f0-9]{64}$/),
        processing_status: 'claimed',
      }),
    );
  });

  it('suppresses PostgreSQL primary-key conflicts only', async () => {
    const { client } = createClient({
      code: '23505',
      message: 'duplicate key value violates unique constraint',
    });

    await expect(
      claimWebhookEvent(client, {
        eventId: 'wamid.event-1',
        rawBody: '{}',
      }),
    ).resolves.toEqual({
      claimed: false,
      eventId: 'wamid.event-1',
      reason: 'duplicate',
    });
  });

  it('does not hide non-idempotency database failures', async () => {
    const { client } = createClient({
      code: '42501',
      message: 'permission denied',
    });

    await expect(
      claimWebhookEvent(client, {
        eventId: 'wamid.event-2',
        rawBody: '{}',
      }),
    ).rejects.toBeInstanceOf(WebhookClaimError);
  });
});
