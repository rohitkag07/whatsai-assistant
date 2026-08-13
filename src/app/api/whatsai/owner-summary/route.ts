import { NextResponse } from 'next/server';
import { buildOwnerSummaryText, loadWhatsAiInboxData } from '@/lib/whatsai-data';
import { serviceClientOrNull } from '@/lib/sales-server';
import { BusinessContextError, requireDashboardBusinessMutationContext } from '@/lib/whatsai-business';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST() {
  const supabase = serviceClientOrNull();
  if (!supabase) return NextResponse.json({ ok: false, error: 'Supabase service client unavailable.' }, { status: 502 });
  const context = await requireDashboardBusinessMutationContext(supabase).catch((error) => error);
  if (context instanceof Error) {
    const status = context instanceof BusinessContextError ? context.status : 500;
    return NextResponse.json({ ok: false, error: context.message }, { status });
  }
  const data = await loadWhatsAiInboxData({ businessId: context.businessId });
  const body = buildOwnerSummaryText(data);
  const builderId = data.selectedThread?.builderId ?? null;
  let row = null;

  const inserted = await (supabase.from('daily_owner_summaries') as any)
    .upsert({
      business_id: context.businessId,
      builder_id: builderId,
      summary_date: new Date().toISOString().slice(0, 10),
      owner_phone: null,
      metrics: data.summary.metrics,
      body,
      status: 'draft',
    }, { onConflict: 'business_id,summary_date' })
    .select()
    .single();
  row = inserted.data ?? null;

  if (builderId) {
    await (supabase.from('agent_runs') as any).insert({
      builder_id: builderId,
      agent: 'whatsai-assistant',
      action: 'owner-summary-draft',
      input: { business_id: context.businessId },
      output: { body, metrics: data.summary.metrics, summary_id: row?.id ?? null },
      status: 'success',
    });
  }

  return NextResponse.json({
    ok: true,
    summary: body,
    row,
    metrics: data.summary.metrics,
  });
}
