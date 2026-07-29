import { NextResponse } from 'next/server';
import { adminMemberCreateSchema, adminMemberUpdateSchema, requireSelectedAdminBusiness } from '@/lib/admin-control';
import { serviceClientOrNull } from '@/lib/sales-server';
import { BusinessContextError } from '@/lib/whatsai-business';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const parsed = adminMemberCreateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.flatten() }, { status: 400 });
  }

  const supabase = serviceClientOrNull();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: 'Supabase service client unavailable.' }, { status: 503 });
  }

  try {
    const payload = parsed.data;
    const { businessId } = await requireSelectedAdminBusiness(supabase, payload.business_id);
    const { data, error } = await (supabase.from('business_members') as any)
      .insert({
        business_id: businessId,
        user_id: payload.user_id,
        display_name: payload.display_name,
        role: payload.role,
        active: true,
      })
      .select('id,user_id,display_name,role,active,created_at')
      .single();

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, member: data });
  } catch (error) {
    const status = error instanceof BusinessContextError ? error.status : 500;
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'admin_member_create_failed' }, { status });
  }
}

export async function PATCH(request: Request) {
  const parsed = adminMemberUpdateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.flatten() }, { status: 400 });
  }

  const supabase = serviceClientOrNull();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: 'Supabase service client unavailable.' }, { status: 503 });
  }

  try {
    const payload = parsed.data;
    const { businessId } = await requireSelectedAdminBusiness(supabase, payload.business_id);
    const update: Record<string, unknown> = {};
    if (payload.role !== undefined) update.role = payload.role;
    if (payload.active !== undefined) update.active = payload.active;

    if (!Object.keys(update).length) {
      return NextResponse.json({ ok: false, error: 'member_update_required' }, { status: 400 });
    }

    const { data, error } = await (supabase.from('business_members') as any)
      .update(update)
      .eq('id', payload.member_id)
      .eq('business_id', businessId)
      .select('id,user_id,display_name,role,active,created_at')
      .single();

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, member: data });
  } catch (error) {
    const status = error instanceof BusinessContextError ? error.status : 500;
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'admin_member_update_failed' }, { status });
  }
}
