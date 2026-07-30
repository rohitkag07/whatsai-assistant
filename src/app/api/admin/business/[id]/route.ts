import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireSelectedAdminBusiness } from '@/lib/admin-control';
import { serviceClientOrNull } from '@/lib/sales-server';
import { BusinessContextError } from '@/lib/whatsai-business';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const updateSchema = z.object({
  name: z.string().trim().min(2).max(160),
  category: z.enum(['real_estate', 'clinic', 'coaching', 'gym', 'local_service', 'software_saas', 'other']),
  city: z.string().trim().max(120).nullable(),
  owner_name: z.string().trim().max(120).nullable(),
  owner_phone: z.string().trim().max(20).nullable(),
  plan: z.enum(['trial', 'starter', 'growth', 'pro', 'enterprise']),
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const parsed = updateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: 'Check the client details and try again.' }, { status: 400 });
  }

  const supabase = serviceClientOrNull();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: 'Supabase service connection is unavailable.' }, { status: 503 });
  }

  try {
    const { id } = await context.params;
    const { businessId } = await requireSelectedAdminBusiness(supabase, id);
    const now = new Date().toISOString();
    const result = await (supabase.from('businesses') as any)
      .update({
        ...parsed.data,
        owner_whatsapp: parsed.data.owner_phone,
        updated_at: now,
      })
      .eq('id', businessId)
      .select('id,name,category,status,plan,city,owner_name,owner_phone,created_at,updated_at')
      .single();

    if (result.error) {
      return NextResponse.json({ ok: false, error: result.error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true, business: result.data });
  } catch (error) {
    const status = error instanceof BusinessContextError ? error.status : 500;
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Client update failed.' },
      { status },
    );
  }
}
