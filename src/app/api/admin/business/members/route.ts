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
    let userId = payload.user_id;

    if (!userId && payload.email) {
      userId = await findOrInviteUser(supabase, payload.email, payload.display_name);
    }

    if (!userId) {
      return NextResponse.json({ ok: false, error: 'member_user_required' }, { status: 400 });
    }

    const { data, error } = await (supabase.from('business_members') as any)
      .upsert({
        business_id: businessId,
        user_id: userId,
        display_name: payload.display_name,
        role: payload.role,
        active: true,
      }, { onConflict: 'business_id,user_id' })
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

async function findOrInviteUser(
  supabase: NonNullable<ReturnType<typeof serviceClientOrNull>>,
  email: string,
  displayName: string,
) {
  const normalizedEmail = email.toLowerCase();

  for (let page = 1; page <= 10; page += 1) {
    const result = await supabase.auth.admin.listUsers({ page, perPage: 100 });
    if (result.error) throw result.error;
    const existing = result.data.users.find(
      (user) => user.email?.toLowerCase() === normalizedEmail,
    );
    if (existing) return existing.id;
    if (result.data.users.length < 100) break;
  }

  const invited = await supabase.auth.admin.inviteUserByEmail(email, {
    data: { display_name: displayName },
  });
  if (invited.error) throw invited.error;
  return invited.data.user.id;
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
