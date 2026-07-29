import { NextResponse } from 'next/server';
import { z } from 'zod';
import {
  applyModuleContractSideEffects,
  buildUpdatedModuleMetadata,
  requireSelectedAdminBusiness,
} from '@/lib/admin-control';
import { serviceClientOrNull } from '@/lib/sales-server';
import { BusinessContextError } from '@/lib/whatsai-business';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const schema = z.object({
  business_id: z.string().uuid(),
  paused: z.boolean(),
});

export async function PATCH(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: 'Select a valid client status.' },
      { status: 400 },
    );
  }

  const supabase = serviceClientOrNull();
  if (!supabase) {
    return NextResponse.json(
      { ok: false, error: 'Client status is temporarily unavailable.' },
      { status: 503 },
    );
  }

  try {
    const { session, business, businessId } =
      await requireSelectedAdminBusiness(
        supabase,
        parsed.data.business_id,
      );
    const updatedAt = new Date().toISOString();
    const assistantEnabled = !parsed.data.paused;
    const metadata = buildUpdatedModuleMetadata({
      metadata: business.metadata,
      moduleId: 'assistant',
      enabled: assistantEnabled,
      actorId: session.user.id,
      updatedAt,
    });

    const { error } = await (supabase.from('businesses') as any)
      .update({
        status: parsed.data.paused ? 'paused' : 'active',
        metadata,
        updated_at: updatedAt,
      })
      .eq('id', businessId);

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 },
      );
    }

    const sideEffect = await applyModuleContractSideEffects(
      supabase,
      businessId,
      'assistant',
      assistantEnabled,
    );
    if (sideEffect.error) {
      return NextResponse.json(
        { ok: false, error: sideEffect.error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({
      ok: true,
      business_id: businessId,
      status: parsed.data.paused ? 'paused' : 'active',
      assistant_enabled: assistantEnabled,
    });
  } catch (error) {
    const status = error instanceof BusinessContextError ? error.status : 500;
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Status update failed.',
      },
      { status },
    );
  }
}
