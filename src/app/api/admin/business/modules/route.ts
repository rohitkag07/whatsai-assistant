import { NextResponse } from 'next/server';
import {
  adminModuleSchema,
  applyModuleContractSideEffects,
  buildUpdatedModuleMetadata,
  isRuntimeEnforcedAdminModule,
  requireSelectedAdminBusiness,
} from '@/lib/admin-control';
import { serviceClientOrNull } from '@/lib/sales-server';
import { BusinessContextError } from '@/lib/whatsai-business';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function PATCH(request: Request) {
  const parsed = adminModuleSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.flatten() }, { status: 400 });
  }

  const supabase = serviceClientOrNull();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: 'Supabase service client unavailable.' }, { status: 503 });
  }

  try {
    const payload = parsed.data;
    const { session, business, businessId } = await requireSelectedAdminBusiness(supabase, payload.business_id);

    if (!isRuntimeEnforcedAdminModule(payload.module_id)) {
      return NextResponse.json(
        { ok: false, error: 'module_not_runtime_enforced', module_id: payload.module_id },
        { status: 409 },
      );
    }

    const updatedAt = new Date().toISOString();
    const metadata = buildUpdatedModuleMetadata({
      metadata: business.metadata,
      moduleId: payload.module_id,
      enabled: payload.enabled,
      actorId: session.user.id,
      updatedAt,
    });

    const update = await (supabase.from('businesses') as any)
      .update({ metadata, updated_at: updatedAt })
      .eq('id', businessId)
      .select('id,metadata')
      .single();

    if (update.error) {
      return NextResponse.json({ ok: false, error: update.error.message }, { status: 500 });
    }

    const sideEffect = await applyModuleContractSideEffects(supabase, businessId, payload.module_id, payload.enabled);
    if (sideEffect?.error) {
      return NextResponse.json({ ok: false, error: sideEffect.error.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      business_id: businessId,
      module_id: payload.module_id,
      enabled: payload.enabled,
      updated_at: updatedAt,
    });
  } catch (error) {
    const status = error instanceof BusinessContextError ? error.status : 500;
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'admin_module_update_failed' }, { status });
  }
}
