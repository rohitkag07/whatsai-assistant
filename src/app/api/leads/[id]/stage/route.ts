import { NextResponse } from 'next/server';
import { z } from 'zod';
import { callSalesAgent, serviceClientOrNull } from '@/lib/sales-server';
import { BusinessContextError, requireDashboardBusinessMutationContext } from '@/lib/whatsai-business';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const stageSchema = z.object({
  business_id: z.string().uuid(),
  stage: z.enum(['new', 'interested', 'negotiating', 'booked', 'lost', 'cold']),
});

type OperatorStageResponse = {
  ok: boolean;
  business_id: string;
  contact_id: string;
  stage: string;
  updated_thread_ids: string[];
  legacy_lead_synced: boolean;
};

/**
 * Resolves the dashboard tenant first, then routes the canonical stage mutation
 * through Summoner -> Sales Agent -> Supabase.
 */
export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const payload = stageSchema.safeParse(await request.json().catch(() => null));
  if (!payload.success || !z.string().uuid().safeParse(id).success) {
    return NextResponse.json({ ok: false, error: 'A valid contact, business, and stage are required.' }, { status: 400 });
  }

  const tenantClient = serviceClientOrNull();
  if (!tenantClient) {
    return NextResponse.json({ ok: false, error: 'Supabase service client unavailable.' }, { status: 503 });
  }

  let business;
  try {
    ({ business } = await requireDashboardBusinessMutationContext(tenantClient, payload.data.business_id));
  } catch (error) {
    const status = error instanceof BusinessContextError ? error.status : 500;
    return NextResponse.json({
      ok: false,
      error: error instanceof Error ? error.message : 'Dashboard business context could not be resolved.',
    }, { status });
  }

  const result = await callSalesAgent<OperatorStageResponse>('/operator/leads/stage', {
    business_id: business.id,
    builder_id: business.builder_id ?? process.env.DEFAULT_BUILDER_ID ?? null,
    contact_id: id,
    stage: payload.data.stage,
  });
  if (!result?.ok) {
    return NextResponse.json({
      ok: false,
      error: 'Summoner or Sales Agent could not persist the tenant-scoped stage change.',
    }, { status: 503 });
  }

  return NextResponse.json(result);
}
