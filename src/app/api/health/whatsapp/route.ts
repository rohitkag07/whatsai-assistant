import { NextResponse } from 'next/server';
import { getWhatsAppHealth } from '@/lib/whatsapp-health';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const health = await getWhatsAppHealth();
  return NextResponse.json(
    {
      ok: health.ok,
      configured: health.configured,
      profile: health.profile,
      error: health.error,
    },
    { status: health.status },
  );
}
