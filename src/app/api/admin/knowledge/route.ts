import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireSelectedAdminBusiness } from '@/lib/admin-control';
import { normalizeKnowledgeKeywords, slugifyKnowledgeTitle } from '@/lib/knowledge-schema';
import { serviceClientOrNull } from '@/lib/sales-server';
import { BusinessContextError, requirePlatformApiSession } from '@/lib/whatsai-business';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const knowledgeSchema = z.object({
  business_id: z.string().uuid(),
  title: z.string().trim().min(2).max(120),
  type: z.enum(['faq', 'service', 'pricing', 'policy', 'location', 'offer', 'document', 'other']),
  question: z.string().trim().max(280).nullable().optional(),
  content: z.string().trim().min(2).max(4000),
  keywords: z.array(z.string().trim().min(1).max(80)).min(1).max(30),
  locale: z.enum(['en-IN', 'hi-IN', 'hinglish']).default('hinglish'),
  status: z.enum(['draft', 'published', 'archived']).default('draft'),
});

export async function GET(request: Request) {
  const supabase = serviceClientOrNull();
  if (!supabase) return NextResponse.json({ ok: false, error: 'Supabase unavailable.' }, { status: 503 });

  try {
    await requirePlatformApiSession(['admin', 'dev']);
    const businessId = new URL(request.url).searchParams.get('business_id');
    const query = (supabase.from('assistant_knowledge_items') as any)
      .select('id,business_id,playbook_id,title,type,question,content,keywords,locale,status,is_active,updated_at')
      .order('updated_at', { ascending: false })
      .limit(500);
    const result = businessId ? await query.eq('business_id', businessId) : await query;
    if (result.error) throw result.error;
    return NextResponse.json({ ok: true, items: result.data ?? [] });
  } catch (error) {
    const status = error instanceof BusinessContextError ? error.status : 500;
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Knowledge load failed.' }, { status });
  }
}

export async function POST(request: Request) {
  const parsed = knowledgeSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: 'Complete the title, reply, and at least one keyword.' }, { status: 400 });
  }
  const supabase = serviceClientOrNull();
  if (!supabase) return NextResponse.json({ ok: false, error: 'Supabase unavailable.' }, { status: 503 });

  try {
    const payload = parsed.data;
    const { businessId } = await requireSelectedAdminBusiness(supabase, payload.business_id);
    const now = new Date().toISOString();
    const result = await (supabase.from('assistant_knowledge_items') as any)
      .insert({
        business_id: businessId,
        title: payload.title,
        type: payload.type,
        question: payload.question || null,
        content: payload.content,
        keywords: normalizeKnowledgeKeywords(payload.keywords),
        locale: payload.locale,
        status: payload.status,
        is_active: payload.status === 'published',
        okf_slug: `${slugifyKnowledgeTitle(payload.title)}-${crypto.randomUUID().slice(0, 8)}`,
        source_type: 'manual',
        metadata: {},
        published_at: payload.status === 'published' ? now : null,
        last_reviewed_at: now,
      })
      .select('*')
      .single();
    if (result.error) throw result.error;
    return NextResponse.json({ ok: true, item: result.data }, { status: 201 });
  } catch (error) {
    const status = error instanceof BusinessContextError ? error.status : 500;
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Knowledge create failed.' }, { status });
  }
}

export { knowledgeSchema };
