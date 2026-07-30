import { NextResponse } from 'next/server';
import { z } from 'zod';
import { BusinessContextError, requirePlatformApiSession } from '@/lib/whatsai-business';
import { serviceClientOrNull } from '@/lib/sales-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const schema = z.object({
  name: z.string().trim().min(2).max(160),
  category: z.enum(['real_estate', 'clinic', 'coaching', 'gym', 'local_service', 'software_saas', 'other']),
  city: z.string().trim().min(2).max(120),
  owner_name: z.string().trim().min(2).max(120),
  owner_phone: z.string().trim().min(10).max(20),
  plan: z.enum(['trial', 'starter', 'growth', 'pro', 'enterprise']),
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: 'Complete every required client field.' },
      { status: 400 },
    );
  }

  const supabase = serviceClientOrNull();
  if (!supabase) {
    return NextResponse.json(
      { ok: false, error: 'Supabase service connection is unavailable.' },
      { status: 503 },
    );
  }

  try {
    const session = await requirePlatformApiSession(['admin', 'dev']);
    const payload = parsed.data;
    const now = new Date().toISOString();
    const modules = ['whatsapp', 'assistant', 'followups'].reduce<Record<string, unknown>>(
      (result, module) => {
        result[module] = { enabled: true, updated_at: now, updated_by: session.user.id };
        return result;
      },
      {},
    );
    const result = await (supabase.from('businesses') as any)
      .insert({
        name: payload.name,
        phone: payload.owner_phone,
        category: payload.category,
        city: payload.city,
        owner_name: payload.owner_name,
        owner_phone: payload.owner_phone,
        owner_whatsapp: payload.owner_phone,
        plan: payload.plan,
        status: payload.plan === 'trial' ? 'trial' : 'active',
        metadata: { xerowa_admin_modules: modules },
      })
      .select('id,name,category,status,plan,city,owner_name,owner_phone,created_at,updated_at')
      .single();

    if (result.error) {
      return NextResponse.json({ ok: false, error: result.error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true, business: result.data }, { status: 201 });
  } catch (error) {
    const status = error instanceof BusinessContextError ? error.status : 500;
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Client creation failed.' },
      { status },
    );
  }
}
