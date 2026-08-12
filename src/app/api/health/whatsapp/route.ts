import { NextResponse } from 'next/server';
import { getWhatsAppHealth } from '@/lib/whatsapp-health';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const health = await getWhatsAppHealth();
  const publicProfile = health.profile
    ? {
        verified_name: health.profile.verified_name,
        quality_rating: health.profile.quality_rating,
        code_verification_status: health.profile.code_verification_status,
      }
    : undefined;

  return NextResponse.json(
    {
      ok: health.ok,
      configured: health.configured,
      profile: publicProfile,
      error: health.error,
    },
    { status: health.status },
  );
}
