import { redirect } from 'next/navigation';
import { MessageCircle } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { LeadPipeline } from '@/components/leads/LeadPipeline';
import { Button } from '@/components/ui/button';
import { requireBusinessAccess } from '@/lib/auth/session';
import { loadOperatorLeadsData } from '@/lib/whatsai-data';

export const metadata = { title: 'Leads' };
export const dynamic = 'force-dynamic';

export default async function LeadsPage() {
  const session = await requireBusinessAccess();
  if (!session.activeBusinessId) redirect('/admin');
  const data = await loadOperatorLeadsData({ businessId: session.activeBusinessId });

  return (
    <>
      <PageHeader
        title="Lead Pipeline"
        titleHi=""
        description="Every WhatsApp conversation is grouped by its current sales stage."
        actions={<span className="inline-flex items-center gap-2 rounded-lg border bg-white px-3 py-2 text-sm text-muted-foreground"><MessageCircle className="h-4 w-4 text-[#00a884]" />Live WhatsApp pipeline</span>}
      />
      {data.source === 'error' ? (
        <section className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-950" role="alert">
          <h2 className="font-semibold">Live lead pipeline could not load</h2>
          <p className="mt-2 max-w-2xl text-sm text-red-800">{data.error ?? 'Your lead pipeline could not load. Please try refreshing the page.'}</p>
          <p className="mt-2 text-xs text-red-700">Your saved customer information remains unchanged.</p>
          <Button asChild variant="outline" size="sm" className="mt-4 border-red-300 bg-white hover:bg-red-100">
            <a href="/leads">Retry live pipeline</a>
          </Button>
        </section>
      ) : (
        <>
          <p className="mb-6 -mt-3 text-xs text-muted-foreground">Updated just now</p>
          <LeadPipeline threads={data.threads} />
        </>
      )}
    </>
  );
}
