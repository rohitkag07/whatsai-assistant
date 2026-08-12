import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getWhatsAppHealth } from '@/lib/whatsapp-health';
import { GET } from './route';

vi.mock('@/lib/whatsapp-health', () => ({
  getWhatsAppHealth: vi.fn(),
}));

const mockedGetWhatsAppHealth = vi.mocked(getWhatsAppHealth);

describe('GET /api/health/whatsapp', () => {
  beforeEach(() => {
    mockedGetWhatsAppHealth.mockReset();
  });

  it('returns health without exposing phone-number identifiers', async () => {
    mockedGetWhatsAppHealth.mockResolvedValue({
      ok: true,
      configured: true,
      status: 200,
      profile: {
        id: 'private-phone-number-id',
        display_phone_number: 'must-not-leak',
        verified_name: 'Example Business',
        quality_rating: 'GREEN',
        code_verification_status: 'VERIFIED',
      },
    });

    const response = await GET();
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toEqual({
      ok: true,
      configured: true,
      profile: {
        verified_name: 'Example Business',
        quality_rating: 'GREEN',
        code_verification_status: 'VERIFIED',
      },
    });
    expect(payload.profile).not.toHaveProperty('id');
    expect(payload.profile).not.toHaveProperty('display_phone_number');
  });
});
