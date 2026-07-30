import 'server-only';

export type WhatsAppHealth = {
  ok: boolean;
  configured: boolean;
  status: number;
  error?: string;
  profile?: {
    id?: string;
    display_phone_number?: string;
    verified_name?: string;
    quality_rating?: string;
    code_verification_status?: string;
  };
};

export async function getWhatsAppHealth(): Promise<WhatsAppHealth> {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const version = process.env.WHATSAPP_GRAPH_VERSION || 'v22.0';

  if (!phoneNumberId || !token) {
    return {
      ok: false,
      configured: false,
      status: 503,
      error: 'WhatsApp credentials are missing.',
    };
  }

  try {
    const response = await fetch(
      `https://graph.facebook.com/${version}/${phoneNumberId}?fields=display_phone_number,verified_name,quality_rating,code_verification_status`,
      {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
        signal: AbortSignal.timeout(5_000),
      },
    );
    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      return {
        ok: false,
        configured: true,
        status: 502,
        error: payload?.error?.message || 'Meta health request failed.',
      };
    }
    return { ok: true, configured: true, status: 200, profile: payload };
  } catch {
    return {
      ok: false,
      configured: true,
      status: 502,
      error: 'Could not reach Meta WhatsApp API.',
    };
  }
}
