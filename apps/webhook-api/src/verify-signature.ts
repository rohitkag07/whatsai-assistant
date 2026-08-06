import { createHmac, timingSafeEqual } from 'node:crypto';

const META_SIGNATURE_PREFIX = 'sha256=';
const SHA256_HEX_PATTERN = /^[a-f0-9]{64}$/i;

export type RawWebhookBody = string | Buffer;

/**
 * Verify Meta's X-Hub-Signature-256 header against the exact, unparsed bytes
 * received by the HTTP server.
 */
export function verifyMetaSignature(
  rawBody: RawWebhookBody,
  signatureHeader: string | null | undefined,
  appSecret: string,
): boolean {
  if (appSecret.length === 0 || !signatureHeader) {
    return false;
  }

  if (!signatureHeader.startsWith(META_SIGNATURE_PREFIX)) {
    return false;
  }

  const suppliedHex = signatureHeader.slice(META_SIGNATURE_PREFIX.length);
  if (!SHA256_HEX_PATTERN.test(suppliedHex)) {
    return false;
  }

  const expectedDigest = createHmac('sha256', appSecret)
    .update(rawBody)
    .digest();
  const suppliedDigest = Buffer.from(suppliedHex, 'hex');

  if (suppliedDigest.length !== expectedDigest.length) {
    return false;
  }

  return timingSafeEqual(expectedDigest, suppliedDigest);
}
