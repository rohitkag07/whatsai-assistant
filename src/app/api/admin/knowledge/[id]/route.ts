import { NextResponse } from 'next/server';
import { requireSelectedAdminBusiness } from '@/lib/admin-control';
import { adminKnowledgeSchema } from '@/lib/admin-knowledge-schema';
import { normalizeKnowledgeKeywords } from '@/lib/knowledge-schema';
import { serviceClientOrNull } from '@/lib/sales-server';
import { BusinessContextError } from '@/lib/whatsai-business';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const parsed = adminKnowledgeSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: 'Complete the title, reply, and at least one keyword.' }, { status: 400 });
  }
  const supabase = serviceClientOrNull();
  if (!supabase) return NextResponse.json({ ok: false, error: 'Supabase unavailable.' }, { status: 503 });

  try {
    const { id } = await context.params;
    const { businessId } = await requireSelectedAdminBusiness(supabase, parsed.data.business_id);
    const now = new Date().toISOString();
    const result = await (supabase.from('assistant_knowledge_items') as any)
      .update({
        title: parsed.data.title,
        type: parsed.data.type,
        question: parsed.data.question || null,
        content: parsed.data.content,
        keywords: normalizeKnowledgeKeywords(parsed.data.keywords),
        locale: parsed.data.locale,
        status: parsed.data.status,
        is_active: parsed.data.status === 'published',
        published_at: parsed.data.status === 'published' ? now : null,
        last_reviewed_at: now,
        updated_at: now,
      })
      .eq('id', id)
      .eq('business_id', businessId)
      .select('*')
      .single();
    if (result.error) throw result.error;
    return NextResponse.json({ ok: true, item: result.data });
  } catch (error) {
    const status = error instanceof BusinessContextError ? error.status : 500;
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Knowledge update failed.' }, { status });
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const businessId = new URL(request.url).searchParams.get('business_id');
  const supabase = serviceClientOrNull();
  if (!supabase) return NextResponse.json({ ok: false, error: 'Supabase unavailable.' }, { status: 503 });

  try {
    const { id } = await context.params;
    const selected = await requireSelectedAdminBusiness(supabase, businessId);
    const result = await (supabase.from('assistant_knowledge_items') as any)
      .delete()
      .eq('id', id)
      .eq('business_id', selected.businessId);
    if (result.error) throw result.error;
    return NextResponse.json({ ok: true });
  } catch (error) {
    const status = error instanceof BusinessContextError ? error.status : 500;
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Knowledge delete failed.' }, { status });
  }
}
