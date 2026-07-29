import { NextResponse } from 'next/server';
import { z } from 'zod';
import {
  ACTIVE_BUSINESS_COOKIE,
  ACTIVE_BUSINESS_COOKIE_OPTIONS,
} from '@/lib/auth/active-business';
import { requireSelectedAdminBusiness } from '@/lib/admin-control';
import { serviceClientOrNull } from '@/lib/sales-server';
import { BusinessContextError } from '@/lib/whatsai-business';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const schema = z.object({
  business_id: z.string().uuid(),
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: 'Select a valid client.' },
      { status: 400 },
    );
  }

  const supabase = serviceClientOrNull();
  if (!supabase) {
    return NextResponse.json(
      { ok: false, error: 'Client switching is temporarily unavailable.' },
      { status: 503 },
    );
  }

  try {
    const { business } = await requireSelectedAdminBusiness(
      supabase,
      parsed.data.business_id,
    );
    const response = NextResponse.json({
      ok: true,
      business: { id: business.id, name: business.name },
    });
    response.cookies.set(
      ACTIVE_BUSINESS_COOKIE,
      business.id,
      ACTIVE_BUSINESS_COOKIE_OPTIONS,
    );
    return response;
  } catch (error) {
    const status = error instanceof BusinessContextError ? error.status : 500;
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Client switch failed.',
      },
      { status },
    );
  }
}
