import { NextResponse } from 'next/server';
import { requireSelectedAdminBusiness } from '@/lib/admin-control';
import { serviceClientOrNull } from '@/lib/sales-server';
import { BusinessContextError } from '@/lib/whatsai-business';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const supabase = serviceClientOrNull();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: 'Supabase service connection is unavailable.' }, { status: 503 });
  }

  try {
    const { id } = await context.params;
    const { businessId } = await requireSelectedAdminBusiness(supabase, id);
    const channel = await (supabase.from('business_channels') as any)
      .select('id,phone_number_id,status')
      .eq('business_id', businessId)
      .eq('channel_type', 'whatsapp')
      .eq('is_primary', true)
      .maybeSingle();

    if (channel.error) throw channel.error;
    if (!channel.data?.phone_number_id) {
      return NextResponse.json({ ok: false, error: 'Primary WhatsApp channel is not configured.' }, { status: 404 });
    }

    const token = process.env.WHATSAPP_ACCESS_TOKEN;
    if (!token) {
      return NextResponse.json({ ok: false, error: 'Server WhatsApp token is not configured.' }, { status: 503 });
    }

    const version = process.env.WHATSAPP_GRAPH_VERSION || 'v22.0';
    const response = await fetch(
      `https://graph.facebook.com/${version}/${channel.data.phone_number_id}?fields=display_phone_number,verified_name,quality_rating,code_verification_status`,
      { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' },
    );
    const profile = await response.json().catch(() => null);

    if (!response.ok) {
      await (supabase.from('business_channels') as any)
        .update({ status: 'error', updated_at: new Date().toISOString() })
        .eq('id', channel.data.id);
      return NextResponse.json(
        { ok: false, error: profile?.error?.message || 'Meta connection test failed.' },
        { status: 502 },
      );
    }

    const verifiedAt = new Date().toISOString();
    await (supabase.from('business_channels') as any)
      .update({ status: 'connected', last_verified_at: verifiedAt, updated_at: verifiedAt })
      .eq('id', channel.data.id);

    return NextResponse.json({ ok: true, profile, verified_at: verifiedAt });
  } catch (error) {
    const status = error instanceof BusinessContextError ? error.status : 500;
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Connection test failed.' },
      { status },
    );
  }
}
